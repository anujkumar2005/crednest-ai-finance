import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

function getMonthYearLabel(d: Date = new Date()): string {
  const month = d.toLocaleString("en-IN", { month: "long" });
  const year = d.getFullYear();
  return `${month} ${year}`;
}

type BankHint = { ilike: string; display: string } | null;
function extractBankHint(message: string): BankHint {
  const m = message.toLowerCase();
  const banks: Array<{ re: RegExp; ilike: string; display: string }> = [
    { re: /\bsbi\b|state bank of india|state bank/i, ilike: "%State Bank%", display: "State Bank of India (SBI)" },
    { re: /\bhdfc\b|hdfc bank/i, ilike: "%HDFC%", display: "HDFC Bank" },
    { re: /\bicici\b|icici bank/i, ilike: "%ICICI%", display: "ICICI Bank" },
    { re: /\baxis\b|axis bank/i, ilike: "%Axis%", display: "Axis Bank" },
    { re: /\bpn?b\b|punjab national bank/i, ilike: "%Punjab National%", display: "Punjab National Bank (PNB)" },
    { re: /\bboi\b|bank of india/i, ilike: "%Bank of India%", display: "Bank of India (BOI)" },
    { re: /\bcanara\b|canara bank/i, ilike: "%Canara%", display: "Canara Bank" },
    { re: /\bkotak\b|kotak mahindra/i, ilike: "%Kotak%", display: "Kotak Mahindra Bank" },
    { re: /\bindusind\b|indusind bank/i, ilike: "%IndusInd%", display: "IndusInd Bank" },
  ];
  const hit = banks.find((b) => b.re.test(m));
  return hit ? { ilike: hit.ilike, display: hit.display } : null;
}

type LoanType =
  | "education"
  | "home"
  | "personal"
  | "car"
  | "business"
  | "gold"
  | "agri";

function extractLoanType(message: string): LoanType | null {
  const m = message.toLowerCase();
  if (m.includes("education") || m.includes("student")) return "education";
  if (m.includes("home") || m.includes("housing")) return "home";
  if (m.includes("personal")) return "personal";
  if (m.includes("car") || m.includes("auto")) return "car";
  if (m.includes("business") || m.includes("msme") || m.includes("working capital")) return "business";
  if (m.includes("gold")) return "gold";
  if (m.includes("agri") || m.includes("agriculture") || m.includes("kisan")) return "agri";
  return null;
}

// Build query for Perplexity based on user message
function buildPerplexityQuery(message: string): string {
  const lowerMessage = message.toLowerCase();
  const monthYear = getMonthYearLabel();
  const bank = extractBankHint(message)?.display;
  const loanType = extractLoanType(message);
  
  if (lowerMessage.includes("loan") && (lowerMessage.includes("rate") || lowerMessage.includes("interest"))) {
    if (bank && loanType) {
      return `What is the current ${loanType} loan interest rate range offered by ${bank} in India as of ${monthYear}? Provide the rate (% p.a.), key conditions (loan amount/tenure/CIBIL if available), and the official page link. Return concise bullet points.`;
    }
    if (bank) {
      return `What are the current loan interest rates offered by ${bank} in India as of ${monthYear}? Provide rates for home, personal, car, and education loans (if available), and include official source link(s).`;
    }
    return `Current loan interest rates in India as of ${monthYear} - Include home loan, personal loan, car loan, and education loan rates from major banks like SBI, HDFC, ICICI, Axis. Provide specific percentages and cite sources.`;
  }
  
  if (lowerMessage.includes("fd") || lowerMessage.includes("fixed deposit")) {
    return `Current FD interest rates in India as of ${monthYear} - Best fixed deposit rates from major banks and small finance banks. Include 1 year, 3 year, 5 year rates, and cite sources.`;
  }
  
  if (lowerMessage.includes("mutual fund") || lowerMessage.includes("sip")) {
    return `Top performing mutual funds in India as of ${monthYear} - Best equity, debt, and hybrid funds with 1 year returns and ratings. Cite sources.`;
  }
  
  if (lowerMessage.includes("gold")) {
    return `Current gold price in India today (${monthYear}) - 24 karat and 22 karat gold rates per gram in INR. Cite sources.`;
  }
  
  if (lowerMessage.includes("nifty") || lowerMessage.includes("sensex") || lowerMessage.includes("stock")) {
    return `Current Nifty 50 and Sensex levels (${monthYear}) - Latest market data and performance. Cite sources.`;
  }
  
  if (lowerMessage.includes("rbi") || lowerMessage.includes("repo")) {
    return `Current RBI repo rate and monetary policy as of ${monthYear} - Latest interest rate decisions. Cite official sources.`;
  }
  
  if (lowerMessage.includes("insurance")) {
    return `Best insurance companies in India ${new Date().getFullYear()} - Claim settlement ratios and indicative premium ranges for life and health insurance. Cite sources.`;
  }
  
  // Default financial query
  return `Latest information about: ${message} - Focus on Indian financial context with current rates and data as of ${monthYear}. Cite sources.`;
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
    
    if (!messages || !Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
      return new Response(JSON.stringify({ error: "Invalid request: messages must be a non-empty array (max 50)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validRoles = ["user", "assistant", "system"];
    for (const msg of messages) {
      if (!msg || typeof msg.content !== "string" || !validRoles.includes(msg.role)) {
        return new Response(JSON.stringify({ error: "Invalid message format: each message must have a valid role and string content" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (msg.content.length > 10000) {
        return new Response(JSON.stringify({ error: "Message content too long (max 10000 characters)" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const lastUserMessage = messages.filter((m: Message) => m.role === "user").pop()?.content || "";
    console.log("Processing message for user:", verifiedUserId, "Message:", lastUserMessage.substring(0, 100));

    const bankHint = extractBankHint(lastUserMessage);
    const loanType = extractLoanType(lastUserMessage);

    // Fetch live data from Perplexity if needed
    let liveDataContext = "";
    if (PERPLEXITY_API_KEY && needsLiveData(lastUserMessage)) {
      const perplexityQuery = buildPerplexityQuery(lastUserMessage);
      const liveData = await fetchLiveDataFromPerplexity(perplexityQuery, PERPLEXITY_API_KEY);
      if (liveData) {
        liveDataContext = `\n\n### 📊 Live Data (Fetched from Internet - ${getMonthYearLabel()}):\n${liveData}\n`;
      }
    }

    // Search for relevant financial corpus data (RAG)
    let ragContext = "";
    try {
      const rawTerms = lastUserMessage
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((t: string) => t.length >= 4)
        .slice(0, 5);

      // Build a broad OR query across relevant columns using ilike.
      // Example: title.ilike.%loan%,content.ilike.%loan%,bank_name.ilike.%loan%,title.ilike.%sbi%,...
      const orParts = rawTerms.flatMap((term: string) => [
        `title.ilike.%${term}%`,
        `content.ilike.%${term}%`,
        `bank_name.ilike.%${term}%`,
        `category.ilike.%${term}%`,
        `subcategory.ilike.%${term}%`,
      ]);

      let corpusQuery = supabase
        .from("financial_corpus")
        .select("title, content, category, subcategory, bank_name")
        .limit(5);

      if (orParts.length > 0) corpusQuery = corpusQuery.or(orParts.join(","));

      const { data: corpusData, error: corpusError } = await corpusQuery;

      if (corpusError) {
        console.error("Corpus search error:", corpusError);
      }

      if (corpusData && corpusData.length > 0) {
        const relevantCorpus = corpusData.slice(0, 3);
        ragContext =
          "\n\n### Relevant Financial Data from our Database:\n" +
          relevantCorpus
            .map(
              (item) =>
                `**${item.title}** (${item.category}${item.bank_name ? ` - ${item.bank_name}` : ""}):\n${item.content}`
            )
            .join("\n\n");
      }
    } catch (ragError) {
      console.error("RAG search error:", ragError);
    }

    // Fetch bank data for context
    let bankContext = "";
    try {
      // If user asked about a specific bank, fetch that bank first for accuracy.
      let bankSpecificLine = "";
      if (bankHint) {
        const { data: bankRow } = await supabase
          .from("banks")
          .select(
            "name, personal_loan_rate, home_loan_rate, car_loan_rate, education_loan_rate, business_loan_rate, processing_fee, min_cibil_score, rating, website, updated_at"
          )
          .ilike("name", bankHint.ilike)
          .limit(1)
          .maybeSingle();

        if (bankRow) {
          const rateByType: Record<LoanType, number | null | undefined> = {
            education: bankRow.education_loan_rate,
            home: bankRow.home_loan_rate,
            personal: bankRow.personal_loan_rate,
            car: bankRow.car_loan_rate,
            business: bankRow.business_loan_rate,
            gold: null,
            agri: null,
          };
          const specificRate = loanType ? rateByType[loanType] : null;

          bankSpecificLine = `- **${bankRow.name}**: Personal ${bankRow.personal_loan_rate ?? "—"}%, Home ${bankRow.home_loan_rate ?? "—"}%, Car ${bankRow.car_loan_rate ?? "—"}%, Education ${bankRow.education_loan_rate ?? "—"}% | Processing: ${bankRow.processing_fee ?? "—"}% | Min CIBIL: ${bankRow.min_cibil_score ?? "—"} | Rating: ${bankRow.rating ?? "—"}/5`;

          // Promote a verified, bank+loan-type specific rate if present.
          if (loanType && typeof specificRate === "number") {
            bankContext +=
              `\n\n### ✅ Verified Rate (Bank Rates Database):\n` +
              `- Bank: **${bankRow.name}**\n` +
              `- Product: **${loanType} loan**\n` +
              `- Interest rate: **${specificRate}% p.a.**\n` +
              `${bankRow.updated_at ? `- Database updated: ${new Date(bankRow.updated_at).toLocaleDateString("en-IN")}\n` : ""}` +
              `${bankRow.website ? `- Official website: ${bankRow.website}\n` : ""}`;
          }
        }
      }

      const { data: banks } = await supabase
        .from("banks")
        .select(
          "name, personal_loan_rate, home_loan_rate, car_loan_rate, education_loan_rate, processing_fee, min_cibil_score, rating, website"
        )
        .order("rating", { ascending: false })
        .limit(10);

      if (banks && banks.length > 0) {
        // Ensure the bank-specific row appears first (if present).
        const listLines = banks
          .map(
            (b) =>
              `- **${b.name}**: Personal ${b.personal_loan_rate ?? "—"}%, Home ${b.home_loan_rate ?? "—"}%, Car ${b.car_loan_rate ?? "—"}%, Education ${b.education_loan_rate ?? "—"}% | Processing: ${b.processing_fee ?? "—"}% | Min CIBIL: ${b.min_cibil_score ?? "—"} | Rating: ${b.rating ?? "—"}/5`
          )
          .filter(Boolean);

        bankContext +=
          "\n\n### Current Bank Rates (Database):\n" +
          (bankSpecificLine ? [bankSpecificLine, ...listLines.filter((l) => l !== bankSpecificLine)].join("\n") : listLines.join("\n"));
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

    // Build enhanced system prompt - CONCISE responses
    const systemPrompt = `You are CredNest AI, a financial advisor for Indian users. Be CONCISE and ACCURATE.

## STRICT RESPONSE RULES:
1. **MAXIMUM 150 words** unless calculation tables are needed
2. **Use ONLY markdown** - NO HTML tags like <br> or <div>
3. **Direct answers first** - No unnecessary introductions
4. **Use bullet points** for lists (3-5 items max)
5. **Tables only for comparisons** with 3-5 rows max
6. **One actionable tip** at the end

## FORMAT TEMPLATE:
**Answer:** [Direct 1-2 sentence answer]

**Key Points:**
- Point 1
- Point 2
- Point 3

**Tip:** [One actionable recommendation]

## TOPICS: Loans, EMI, Investments (MF, SIP, FD), Insurance, Credit Score, Banking, Tax Planning

## DATA SOURCES AVAILABLE:
${liveDataContext ? "✅ Live Internet Data (use this first)" : ""}
${ragContext ? "✅ Financial Corpus Data" : ""}
${bankContext ? "✅ Bank Rates Database" : ""}
${toolResult ? "✅ Calculation Results (include prominently)" : ""}

${liveDataContext}${ragContext}${bankContext}${toolResult}

IMPORTANT: Keep responses SHORT. Users want quick, accurate answers. Decline non-financial questions politely in one sentence.`;

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
