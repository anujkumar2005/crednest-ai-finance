import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

// Fetch live data from Perplexity for accurate real-time information
async function fetchLiveDataFromPerplexity(query: string, perplexityKey: string): Promise<string> {
  try {
    console.log("Fetching live data from Perplexity for:", query.substring(0, 50));
    
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${perplexityKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "You are a financial data researcher. Provide accurate, current data for Indian financial markets, banks, and financial products. Include specific numbers, rates, and dates. Be concise and factual."
          },
          {
            role: "user",
            content: query
          }
        ],
        search_recency_filter: "week",
      }),
    });

    if (!response.ok) {
      console.error("Perplexity API error:", response.status);
      return "";
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];
    
    let result = content;
    if (citations.length > 0) {
      result += "\n\n**Sources:** " + citations.slice(0, 3).join(", ");
    }
    
    console.log("Perplexity returned data successfully");
    return result;
  } catch (error) {
    console.error("Perplexity fetch error:", error);
    return "";
  }
}

// Determine if query needs live data
function needsLiveData(message: string): boolean {
  const liveDataKeywords = [
    "current", "latest", "today", "now", "live", "recent",
    "rate", "interest", "nifty", "sensex", "stock", "market",
    "rbi", "repo", "inflation", "gold price", "fd rate", 
    "loan rate", "best bank", "compare", "which bank",
    "mutual fund", "nav", "returns", "performance"
  ];
  const lowerMessage = message.toLowerCase();
  return liveDataKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Build query for Perplexity based on user message
function buildPerplexityQuery(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("loan") && (lowerMessage.includes("rate") || lowerMessage.includes("interest"))) {
    return `Current loan interest rates in India December 2024 - Include home loan, personal loan, car loan rates from major banks like SBI, HDFC, ICICI, Axis. Provide specific percentages.`;
  }
  
  if (lowerMessage.includes("fd") || lowerMessage.includes("fixed deposit")) {
    return `Current FD interest rates in India December 2024 - Best fixed deposit rates from major banks and small finance banks. Include 1 year, 3 year, 5 year rates.`;
  }
  
  if (lowerMessage.includes("mutual fund") || lowerMessage.includes("sip")) {
    return `Top performing mutual funds in India December 2024 - Best equity, debt, and hybrid funds with 1 year returns and ratings.`;
  }
  
  if (lowerMessage.includes("gold")) {
    return `Current gold price in India today December 2024 - 24 karat and 22 karat gold rates per gram in INR.`;
  }
  
  if (lowerMessage.includes("nifty") || lowerMessage.includes("sensex") || lowerMessage.includes("stock")) {
    return `Current Nifty 50 and Sensex levels December 2024 - Latest market data and performance.`;
  }
  
  if (lowerMessage.includes("rbi") || lowerMessage.includes("repo")) {
    return `Current RBI repo rate and monetary policy December 2024 - Latest interest rate decisions.`;
  }
  
  if (lowerMessage.includes("insurance")) {
    return `Best insurance companies in India 2024 - Claim settlement ratios and premium rates for life and health insurance.`;
  }
  
  // Default financial query
  return `Latest information about: ${message} - Focus on Indian financial context with current rates and data from December 2024.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

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
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const lastUserMessage = messages.filter((m: Message) => m.role === "user").pop()?.content || "";
    console.log("Processing message for user:", verifiedUserId, "Message:", lastUserMessage.substring(0, 100));

    // Fetch live data from Perplexity if needed
    let liveDataContext = "";
    if (PERPLEXITY_API_KEY && needsLiveData(lastUserMessage)) {
      const perplexityQuery = buildPerplexityQuery(lastUserMessage);
      const liveData = await fetchLiveDataFromPerplexity(perplexityQuery, PERPLEXITY_API_KEY);
      if (liveData) {
        liveDataContext = `\n\n### 📊 Live Data (Fetched from Internet - December 2024):\n${liveData}\n`;
      }
    }

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
        bankContext = "\n\n### Current Bank Rates (Database):\n" +
          banks.map(b => 
            `- **${b.name}**: Personal ${b.personal_loan_rate}%, Home ${b.home_loan_rate}%, Car ${b.car_loan_rate}%, Education ${b.education_loan_rate}% | Processing: ${b.processing_fee}% | Min CIBIL: ${b.min_cibil_score} | Rating: ${b.rating}/5`
          ).join("\n");
      }
    } catch (bankError) {
      console.error("Bank fetch error:", bankError);
    }

    // Process tool calls
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

    // Build enhanced system prompt
    const systemPrompt = `You are CredNest AI, a specialized financial advisor assistant EXCLUSIVELY for Indian users. You provide accurate, structured, and professional financial guidance.

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

## RESPONSE FORMATTING RULES:
1. **Always use structured markdown** with clear headers, bullet points, and tables
2. **Start with a brief summary** (1-2 sentences) of your answer
3. **Use tables for comparisons** and numerical data
4. **Highlight key numbers** using bold text
5. **Provide actionable steps** when giving advice
6. **End with a relevant tip** or next step recommendation

## DATA PRIORITY:
1. Use LIVE DATA from Perplexity when available (most accurate and current)
2. Cross-reference with database bank rates
3. Always mention data source and date when providing rates

## STRICT RULES:
1. **ONLY ANSWER FINANCE-RELATED QUESTIONS** - Politely decline non-financial queries
2. Use Indian Rupee (₹) formatting
3. Reference actual rates and data when available
4. Recommend verifying rates on official sources
5. Never provide specific investment recommendations without disclaimers

${liveDataContext}
${ragContext}
${bankContext}
${toolResult}

If live data is provided above, prioritize it as it contains the most current information from the internet.
If tool calculations (EMI, eligibility) are provided, include them prominently in your response.
Structure your response clearly with headers and make it easy to scan.`;

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
          ...messages.slice(-10),
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
