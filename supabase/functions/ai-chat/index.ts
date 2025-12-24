import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// CORS: allow the app preview + production origins.
// Auth is enforced via Bearer JWT, so wide CORS is OK here.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface EMIResult {
  emi: number;
  totalAmount: number;
  totalInterest: number;
  principal: number;
  rate: number;
  tenure: number;
}

// Financial calculation tools
function calculateEMI(principal: number, annualRate: number, tenureMonths: number): EMIResult {
  const monthlyRate = annualRate / 12 / 100;
  let emiValue: number;
  if (monthlyRate === 0) {
    emiValue = principal / tenureMonths;
  } else {
    emiValue = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  }
  return {
    emi: Math.round(emiValue),
    totalAmount: Math.round(emiValue * tenureMonths),
    totalInterest: Math.round(emiValue * tenureMonths - principal),
    principal,
    rate: annualRate,
    tenure: tenureMonths,
  };
}

function checkLoanEligibility(monthlyIncome: number, loanAmount: number, cibilScore: number) {
  const maxEMI = monthlyIncome * 0.5;
  const assumedRate = cibilScore >= 750 ? 10 : cibilScore >= 700 ? 11 : 12;
  const maxTenure = 60;
  const emiResult = calculateEMI(loanAmount, assumedRate, maxTenure);

  const isEligible = emiResult.emi <= maxEMI && cibilScore >= 650;
  const maxLoanAmount = Math.round(
    (maxEMI * (Math.pow(1 + assumedRate / 1200, maxTenure) - 1)) /
      (assumedRate / 1200 * Math.pow(1 + assumedRate / 1200, maxTenure))
  );

  return {
    eligible: isEligible,
    cibilScore,
    monthlyIncome,
    requestedAmount: loanAmount,
    estimatedEMI: emiResult.emi,
    maxEMIAffordable: maxEMI,
    maxLoanEligible: maxLoanAmount,
    estimatedRate: assumedRate,
    recommendation: isEligible
      ? `You are eligible for this loan. Your estimated EMI would be ₹${emiResult.emi.toLocaleString()}.`
      : `Your loan may not be approved. ${cibilScore < 650 ? "Improve your CIBIL score above 650." : ""} ${
          emiResult.emi > maxEMI
            ? `Consider a smaller loan amount (max ₹${maxLoanAmount.toLocaleString()}) or longer tenure.`
            : ""
        }`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized: Missing authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase configuration");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user's JWT and get authenticated user
    // IMPORTANT: In backend functions we must pass the JWT explicitly.
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(jwt);

    if (authError || !user) {
      console.error("JWT verification failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use the verified user ID from JWT, never trust client-provided userId
    const verifiedUserId = user.id;
    console.log("Authenticated user:", verifiedUserId);

    const body = await req.json();
    const { messages } = body;
    
    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid messages format");
      return new Response(JSON.stringify({ error: "Invalid request: messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Create service role client for database operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get the last user message for RAG search
    const lastUserMessage = messages.filter((m: Message) => m.role === "user").pop()?.content || "";
    console.log("Processing message for user:", verifiedUserId, "Message:", lastUserMessage.substring(0, 100));

    // Search for relevant financial corpus data (RAG)
    let ragContext = "";
    try {
      const searchTerms = lastUserMessage.toLowerCase();
      
      const { data: corpusData, error: corpusError } = await supabase
        .from("financial_corpus")
        .select("title, content, category, subcategory, bank_name")
        .limit(5);

      if (corpusError) {
        console.error("Corpus search error:", corpusError);
      }

      if (corpusData && corpusData.length > 0) {
        const relevantCorpus = corpusData.filter(item => {
          const content = `${item.title} ${item.content} ${item.category} ${item.subcategory || ''} ${item.bank_name || ''}`.toLowerCase();
          return searchTerms.split(' ').some((term: string) => 
            term.length > 3 && content.includes(term)
          );
        }).slice(0, 3);

        if (relevantCorpus.length > 0) {
          ragContext = "\n\n### Relevant Financial Data from our Database:\n" + 
            relevantCorpus.map(item => 
              `**${item.title}** (${item.category}${item.bank_name ? ` - ${item.bank_name}` : ''}):\n${item.content}`
            ).join("\n\n");
        }
      }
    } catch (ragError) {
      console.error("RAG search error:", ragError);
    }

    // Fetch bank data for context
    let bankContext = "";
    try {
      const { data: banks } = await supabase
        .from("banks")
        .select("name, personal_loan_rate, home_loan_rate, car_loan_rate, education_loan_rate, processing_fee, min_cibil_score, rating, website")
        .order("rating", { ascending: false })
        .limit(10);

      if (banks && banks.length > 0) {
        bankContext = "\n\n### Current Bank Rates (Top Banks):\n" +
          banks.map(b => 
            `- **${b.name}**: Personal ${b.personal_loan_rate}%, Home ${b.home_loan_rate}%, Car ${b.car_loan_rate}%, Education ${b.education_loan_rate}% | Processing: ${b.processing_fee}% | Min CIBIL: ${b.min_cibil_score} | Rating: ${b.rating}/5 | Apply: ${b.website}`
          ).join("\n");
      }
    } catch (bankError) {
      console.error("Bank fetch error:", bankError);
    }

    // Process tool calls if detected in message
    let toolResult = "";
    const lowerMessage = lastUserMessage.toLowerCase();
    
    // EMI Calculator
    const emiMatch = lowerMessage.match(/(\d+)\s*(lakh|lac|l)?\s*(rupees|rs|₹)?.*?(\d+\.?\d*)\s*%?.*?(\d+)\s*(year|yr|month)/i);
    if (emiMatch || (lowerMessage.includes("emi") && lowerMessage.includes("calculate"))) {
      const numbers = lastUserMessage.match(/\d+\.?\d*/g) || [];
      if (numbers.length >= 3) {
        let principal = parseFloat(numbers[0]);
        if (lowerMessage.includes("lakh") || lowerMessage.includes("lac")) {
          principal *= 100000;
        } else if (lowerMessage.includes("crore")) {
          principal *= 10000000;
        } else if (principal < 1000) {
          principal *= 100000;
        }
        const rate = parseFloat(numbers[1]) > 20 ? parseFloat(numbers[1]) / 10 : parseFloat(numbers[1]);
        let tenure = parseFloat(numbers[2]);
        if (lowerMessage.includes("year")) {
          tenure *= 12;
        }
        
        const emiResult = calculateEMI(principal, rate, tenure);
        toolResult = `\n\n### 📊 EMI Calculation Result:\n| Parameter | Value |\n|-----------|-------|\n| Principal | ₹${emiResult.principal.toLocaleString()} |\n| Interest Rate | ${emiResult.rate}% p.a. |\n| Tenure | ${emiResult.tenure} months |\n| **Monthly EMI** | **₹${emiResult.emi.toLocaleString()}** |\n| Total Interest | ₹${emiResult.totalInterest.toLocaleString()} |\n| Total Amount | ₹${emiResult.totalAmount.toLocaleString()} |\n`;
      }
    }

    // Loan Eligibility
    if (lowerMessage.includes("eligib") && (lowerMessage.includes("loan") || lowerMessage.includes("income") || lowerMessage.includes("cibil"))) {
      const numbers = lastUserMessage.match(/\d+\.?\d*/g) || [];
      if (numbers.length >= 2) {
        let income = parseFloat(numbers[0]);
        let amount = parseFloat(numbers[1]);
        let cibil = numbers.length > 2 ? parseFloat(numbers[2]) : 700;
        
        if (income < 10000) income *= 1000;
        if (amount < 1000) amount *= 100000;
        if (cibil < 300 || cibil > 900) cibil = 700;
        
        const eligibility = checkLoanEligibility(income, amount, cibil);
        toolResult = `\n\n### 📋 Loan Eligibility Check:\n| Parameter | Value |\n|-----------|-------|\n| Monthly Income | ₹${eligibility.monthlyIncome.toLocaleString()} |\n| Requested Amount | ₹${eligibility.requestedAmount.toLocaleString()} |\n| CIBIL Score | ${eligibility.cibilScore} |\n| **Status** | **${eligibility.eligible ? '✅ ELIGIBLE' : '❌ NOT ELIGIBLE'}** |\n| Estimated EMI | ₹${eligibility.estimatedEMI.toLocaleString()} |\n| Max Affordable EMI | ₹${eligibility.maxEMIAffordable.toLocaleString()} |\n| Max Loan Eligible | ₹${eligibility.maxLoanEligible.toLocaleString()} |\n\n**Recommendation:** ${eligibility.recommendation}\n`;
      }
    }

    // Build system prompt with RAG context
    const systemPrompt = `You are CredNest AI, a specialized financial advisor assistant EXCLUSIVELY for Indian users. You ONLY discuss finance, money, and banking-related topics.

## YOUR EXPERTISE AREAS (ONLY respond to these topics):
- Personal finance management, budgeting, and expense tracking
- Loans: Personal, Home, Car, Education, Business, Gold, Agricultural
- EMI calculations, loan eligibility, and repayment strategies
- Investments: Mutual Funds, SIPs, FDs, RDs, PPF, NPS, Stocks, Bonds
- Insurance: Life, Health, Term, Vehicle, Home, Travel
- Banking: Savings accounts, current accounts, credit cards, debit cards
- Credit score (CIBIL) improvement and management
- Tax planning and tax benefits on loans/investments
- Retirement planning and wealth management
- Financial goal setting and emergency fund planning

## STRICT RULES - FOLLOW THESE EXACTLY:
1. **ONLY ANSWER FINANCE-RELATED QUESTIONS** - If a question is NOT about money, finance, banking, loans, investments, insurance, or budgeting, politely decline with: "I'm CredNest AI, your dedicated financial advisor. I specialize only in finance, banking, loans, investments, and money management. Please ask me about these topics, and I'll be happy to help! 💰"

2. **OFF-TOPIC EXAMPLES TO DECLINE:**
   - General knowledge questions (history, science, geography, etc.)
   - Entertainment (movies, music, games, sports)
   - Technology (coding, apps, gadgets - unless about fintech)
   - Recipes, health advice, travel planning (unless travel insurance)
   - Jokes, stories, or general conversation
   - Any topic not directly related to money and finance

3. **RESPONSE QUALITY:**
   - Always be professional, accurate, and helpful
   - Use markdown formatting with headers, bullet points, and tables
   - Include specific bank rates and data when available
   - Provide actionable, step-by-step guidance
   - Use Indian Rupee (₹) formatting
   - Recommend verifying rates on official bank websites

4. **SAFETY:**
   - Never provide specific investment recommendations
   - Always prioritize user's financial safety
   - Encourage diversification and risk assessment
   - Suggest consulting certified financial advisors for major decisions

${ragContext}
${bankContext}
${toolResult}

If tool calculations (EMI, eligibility) are provided above, include them in your response and explain the results clearly.
When users ask about loans, always reference the actual bank rates from our database.
Keep responses focused, practical, and helpful for Indian financial planning.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-8),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return streaming response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
    
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
