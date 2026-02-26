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

// Tax calculation helpers
function calculateTaxOldRegime(income: number, deductions: number): number {
  const taxable = Math.max(0, income - deductions - 50000); // 50K standard deduction
  const slabs = [
    { min: 0, max: 250000, rate: 0 },
    { min: 250001, max: 500000, rate: 5 },
    { min: 500001, max: 1000000, rate: 20 },
    { min: 1000001, max: Infinity, rate: 30 },
  ];
  let tax = 0;
  let remaining = taxable;
  for (const slab of slabs) {
    if (remaining <= 0) break;
    const slabWidth = slab.max === Infinity ? remaining : slab.max - slab.min + 1;
    const taxableInSlab = Math.min(remaining, slabWidth);
    tax += (taxableInSlab * slab.rate) / 100;
    remaining -= taxableInSlab;
  }
  // Rebate u/s 87A
  if (taxable <= 500000) tax = Math.max(0, tax - 12500);
  return Math.round(tax * 1.04); // 4% cess
}

function calculateTaxNewRegime(income: number): number {
  const taxable = Math.max(0, income - 75000); // 75K standard deduction
  const slabs = [
    { min: 0, max: 400000, rate: 0 },
    { min: 400001, max: 800000, rate: 5 },
    { min: 800001, max: 1200000, rate: 10 },
    { min: 1200001, max: 1600000, rate: 15 },
    { min: 1600001, max: 2000000, rate: 20 },
    { min: 2000001, max: 2400000, rate: 25 },
    { min: 2400001, max: Infinity, rate: 30 },
  ];
  let tax = 0;
  let remaining = taxable;
  for (const slab of slabs) {
    if (remaining <= 0) break;
    const slabWidth = slab.max === Infinity ? remaining : slab.max - slab.min + 1;
    const taxableInSlab = Math.min(remaining, slabWidth);
    tax += (taxableInSlab * slab.rate) / 100;
    remaining -= taxableInSlab;
  }
  // Rebate u/s 87A (new regime - up to ₹60,000)
  if (taxable <= 1200000) tax = Math.max(0, tax - 60000);
  return Math.round(tax * 1.04);
}

function calculateLatePenalty(taxDue: number, monthsLate: number, income: number): string {
  const interest234A = Math.ceil(taxDue * 0.01 * monthsLate);
  const lateFee234F = income <= 500000 ? 1000 : monthsLate <= 5 ? 5000 : 10000;
  return `| Component | Amount |
|-----------|--------|
| Interest u/s 234A (1% × ${monthsLate} months) | ₹${interest234A.toLocaleString("en-IN")} |
| Late Fee u/s 234F | ₹${lateFee234F.toLocaleString("en-IN")} |
| **Total Penalty** | **₹${(interest234A + lateFee234F).toLocaleString("en-IN")}** |`;
}

// Detect ITR-related tool calls
function detectToolCall(message: string): string {
  const lower = message.toLowerCase();

  // Tax calculation
  if ((lower.includes("tax") || lower.includes("income")) && lower.match(/\d/)) {
    const numbers = message.match(/\d+\.?\d*/g) || [];
    if (numbers.length >= 1) {
      let income = parseFloat(numbers[0]);
      if (income < 1000) income *= 100000; // assume lakhs
      else if (income < 100000 && lower.includes("lakh")) income *= 100000;

      const deductions = numbers.length >= 2 ? parseFloat(numbers[1]) : 150000;
      const adjustedDeductions = deductions < 1000 ? deductions * 100000 : deductions;

      const oldTax = calculateTaxOldRegime(income, adjustedDeductions);
      const newTax = calculateTaxNewRegime(income);
      const savings = oldTax - newTax;

      return `\n\n### 📊 Tax Calculation (FY 2025-26):
| Regime | Tax Payable |
|--------|------------|
| Old Regime (with ₹${adjustedDeductions.toLocaleString("en-IN")} deductions) | ₹${oldTax.toLocaleString("en-IN")} |
| New Regime | ₹${newTax.toLocaleString("en-IN")} |
| **Savings** | **₹${Math.abs(savings).toLocaleString("en-IN")}** (${savings > 0 ? "New" : "Old"} regime better) |

*Including 4% Health & Education Cess*`;
    }
  }

  // Penalty calculation
  if (lower.includes("penalty") || lower.includes("late") || lower.includes("234")) {
    const numbers = message.match(/\d+\.?\d*/g) || [];
    if (numbers.length >= 2) {
      let taxDue = parseFloat(numbers[0]);
      if (taxDue < 1000) taxDue *= 100000;
      const months = Math.min(parseFloat(numbers[1]), 12);
      const income = numbers.length >= 3 ? parseFloat(numbers[2]) : 800000;
      return `\n\n### 📋 Late Filing Penalty Estimate:\n${calculateLatePenalty(taxDue, months, income)}`;
    }
  }

  // ITR form suggestion
  if (lower.includes("which itr") || lower.includes("which form") || lower.includes("itr form")) {
    if (lower.includes("salary") || lower.includes("salaried")) {
      if (lower.includes("capital gain") || lower.includes("stock") || lower.includes("mutual fund")) {
        return "\n\n### 📋 Recommended: **ITR-2**\nFor salaried individuals with capital gains from stocks, mutual funds, or property.";
      }
      return "\n\n### 📋 Recommended: **ITR-1 (Sahaj)**\nFor salaried individuals with income up to ₹50L from salary, one house property, and other sources (interest, dividends).";
    }
    if (lower.includes("business") || lower.includes("freelanc") || lower.includes("profession")) {
      if (lower.includes("presumptive") || lower.includes("44ad")) {
        return "\n\n### 📋 Recommended: **ITR-4 (Sugam)**\nFor presumptive taxation under Sec 44AD/44ADA/44AE.";
      }
      return "\n\n### 📋 Recommended: **ITR-3**\nFor individuals/HUFs with business or professional income.";
    }
  }

  return "";
}

// Fetch live ITR/tax data from Perplexity
async function fetchLiveITRData(query: string, perplexityKey: string): Promise<string> {
  try {
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
            content: "You are an Indian income tax expert. Provide accurate, current information about ITR filing, tax rules, deductions, and compliance in India. Be concise and factual with specific section references.",
          },
          { role: "user", content: query },
        ],
        search_recency_filter: "month",
      }),
    });

    if (!response.ok) return "";
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];
    let result = content;
    if (citations.length > 0) {
      result += "\n\n**Sources:** " + citations.slice(0, 3).join(", ");
    }
    return result;
  } catch {
    return "";
  }
}

function needsLiveData(message: string): boolean {
  const keywords = [
    "latest", "current", "update", "change", "new rule", "budget",
    "deadline", "due date", "notification", "circular", "cbdt",
    "fy 2025", "fy 2026", "ay 2026", "ay 2027", "this year",
  ];
  return keywords.some((k) => message.toLowerCase().includes(k));
}

function buildITRQuery(message: string): string {
  const monthYear = new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });
  return `Indian Income Tax: ${message} - Provide accurate information as of ${monthYear} for FY 2025-26 / AY 2026-27. Include specific section numbers and cite official sources.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify JWT
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { messages } = body;
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lastUserMessage = messages.filter((m: Message) => m.role === "user").pop()?.content || "";

    // Tool calls
    const toolResult = detectToolCall(lastUserMessage);

    // Live data from Perplexity if needed
    let liveDataContext = "";
    if (PERPLEXITY_API_KEY && needsLiveData(lastUserMessage)) {
      const liveData = await fetchLiveITRData(buildITRQuery(lastUserMessage), PERPLEXITY_API_KEY);
      if (liveData) {
        liveDataContext = `\n\n### 📊 Live Data (Current):\n${liveData}\n`;
      }
    }

    // Search financial corpus for ITR/tax content
    let ragContext = "";
    try {
      const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const terms = lastUserMessage.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((t: string) => t.length >= 3).slice(0, 5);
      const orParts = terms.flatMap((term: string) => [
        `title.ilike.%${term}%`,
        `content.ilike.%${term}%`,
        `category.ilike.%${term}%`,
      ]);

      if (orParts.length > 0) {
        const { data: corpus } = await supabase
          .from("financial_corpus")
          .select("title, content, category")
          .or(orParts.join(","))
          .limit(3);

        if (corpus && corpus.length > 0) {
          ragContext = "\n\n### Knowledge Base:\n" + corpus.map((c) => `**${c.title}** (${c.category}):\n${c.content}`).join("\n\n");
        }
      }
    } catch (e) {
      console.error("RAG error:", e);
    }

    const systemPrompt = `You are **CredNest ITR Assistant**, an expert AI specialized EXCLUSIVELY in Indian Income Tax Returns, tax filing, and compliance.

## YOUR EXPERTISE:
- ITR form selection (ITR-1 to ITR-7) and eligibility criteria
- Step-by-step ITR filing process on incometax.gov.in
- Tax regime comparison (Old vs New) for FY 2025-26
- Deductions: Sec 80C, 80D, 80CCD, 80E, 80G, 80TTA/TTB, 24(b), HRA
- Capital gains taxation (STCG/LTCG) for equity, debt MF, property
- Advance tax (234B/234C), late filing penalties (234A/234F)
- Form 26AS, AIS, TIS reconciliation
- e-Verification methods and deadlines
- Revised returns (139(5)), Updated returns (ITR-U under 139(8A))
- TDS provisions and Form 16/16A
- Presumptive taxation (44AD/44ADA/44AE)
- Assessment proceedings and notices (143(1), 143(3), 148)
- Refund tracking and interest (244A)
- NRI taxation and DTAA provisions

## STRICT RULES:
1. **ONLY answer ITR, income tax, and tax filing questions** — Politely decline ALL other topics
2. **Maximum 200 words** (excluding tables/calculations)
3. **Use ONLY markdown** — NO HTML
4. **Always cite relevant Income Tax Act sections** when applicable
5. **Reference current FY 2025-26 / AY 2026-27** rules
6. **Direct answer first**, then supporting details
7. **Include one actionable tip** at the end

## RESPONSE FORMAT:
**Answer:** [Direct 1-2 sentence answer with section reference]

**Details:**
- Key point 1
- Key point 2
- Key point 3

**💡 Tip:** [One actionable recommendation]

## DATA SOURCES:
${liveDataContext ? "✅ Live Internet Data" : ""}
${ragContext ? "✅ Knowledge Base" : ""}
${toolResult ? "✅ Calculation Results" : ""}

${liveDataContext}${ragContext}${toolResult}

## NON-TAX QUERIES:
If user asks about loans, investments, insurance, or anything not related to income tax/ITR, respond:
"I specialize exclusively in ITR filing and income tax matters. For [topic], please use the main AI Assistant or the relevant module in CredNest."`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-15), // Keep more history for context
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("ITR chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
