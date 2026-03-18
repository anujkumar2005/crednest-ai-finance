import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LoanRate {
  name: string;
  personal_loan_rate: number;
  home_loan_rate: number;
  car_loan_rate: number;
  education_loan_rate: number;
  business_loan_rate: number;
  processing_fee: number;
  max_tenure_years: number;
  min_cibil_score: number;
  rating: number;
}

async function fetchFromDatabase(supabaseUrl: string, serviceRoleKey: string): Promise<LoanRate[]> {
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await adminClient
    .from("banks")
    .select("name, personal_loan_rate, home_loan_rate, car_loan_rate, education_loan_rate, business_loan_rate, processing_fee, max_tenure_years, min_cibil_score, rating")
    .order("home_loan_rate", { ascending: true })
    .limit(10);

  if (error) {
    console.error("Database fallback error:", error);
    return [];
  }
  return (data || []).map(b => ({
    name: b.name,
    personal_loan_rate: b.personal_loan_rate ?? 12,
    home_loan_rate: b.home_loan_rate ?? 8.5,
    car_loan_rate: b.car_loan_rate ?? 9,
    education_loan_rate: b.education_loan_rate ?? 8,
    business_loan_rate: b.business_loan_rate ?? 10,
    processing_fee: b.processing_fee ?? 1,
    max_tenure_years: b.max_tenure_years ?? 30,
    min_cibil_score: b.min_cibil_score ?? 700,
    rating: b.rating ?? 4,
  }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
    const { error: authError } = await supabaseAuth.auth.getUser(jwt);
    if (authError) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    if (!PERPLEXITY_API_KEY) {
      const banks = await fetchFromDatabase(supabaseUrl, serviceRoleKey);
      return new Response(JSON.stringify({ banks, lastUpdated: new Date().toISOString(), citations: [], source: "database" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "You are a banking data expert. Return ONLY valid JSON, no explanations or markdown." },
          {
            role: "user",
            content: `Get the current loan interest rates for the top 10 banks in India as of ${currentDate}. Include major banks like SBI, HDFC, ICICI, Axis, Kotak, PNB, Bank of Baroda, etc.
Return ONLY a JSON array with this exact structure, no other text:
[{"name":"State Bank of India","personal_loan_rate":11.15,"home_loan_rate":8.5,"car_loan_rate":8.65,"education_loan_rate":8.15,"business_loan_rate":10.25,"processing_fee":1.0,"max_tenure_years":30,"min_cibil_score":700,"rating":5}]
Use actual current interest rates from official bank websites. Rating should be 1-5 based on market reputation. Processing fee as percentage.`
          }
        ],
        search_recency_filter: "week",
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "loan_rates",
            schema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" }, personal_loan_rate: { type: "number" }, home_loan_rate: { type: "number" },
                  car_loan_rate: { type: "number" }, education_loan_rate: { type: "number" }, business_loan_rate: { type: "number" },
                  processing_fee: { type: "number" }, max_tenure_years: { type: "number" }, min_cibil_score: { type: "number" }, rating: { type: "number" }
                },
                required: ["name", "personal_loan_rate", "home_loan_rate", "car_loan_rate", "rating"]
              }
            }
          }
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", response.status, errorText);
      const banks = await fetchFromDatabase(supabaseUrl, serviceRoleKey);
      return new Response(JSON.stringify({ banks, lastUpdated: new Date().toISOString(), citations: [], source: "database" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let banks: LoanRate[] = [];
    try {
      banks = typeof content === "string" ? JSON.parse(content) : content;
      banks = banks.map(bank => ({
        name: String(bank.name || "Unknown Bank"),
        personal_loan_rate: typeof bank.personal_loan_rate === "number" ? bank.personal_loan_rate : 12,
        home_loan_rate: typeof bank.home_loan_rate === "number" ? bank.home_loan_rate : 8.5,
        car_loan_rate: typeof bank.car_loan_rate === "number" ? bank.car_loan_rate : 9,
        education_loan_rate: typeof bank.education_loan_rate === "number" ? bank.education_loan_rate : 8,
        business_loan_rate: typeof bank.business_loan_rate === "number" ? bank.business_loan_rate : 10,
        processing_fee: typeof bank.processing_fee === "number" ? bank.processing_fee : 1,
        max_tenure_years: typeof bank.max_tenure_years === "number" ? bank.max_tenure_years : 30,
        min_cibil_score: typeof bank.min_cibil_score === "number" ? bank.min_cibil_score : 700,
        rating: typeof bank.rating === "number" ? Math.min(5, Math.max(1, bank.rating)) : 4,
      }));
      banks.sort((a, b) => a.home_loan_rate - b.home_loan_rate);
    } catch (parseError) {
      console.error("Error parsing loan data:", parseError);
      const fallback = await fetchFromDatabase(supabaseUrl, serviceRoleKey);
      return new Response(JSON.stringify({ banks: fallback, lastUpdated: new Date().toISOString(), citations: [], source: "database" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ banks, lastUpdated: new Date().toISOString(), citations: data.citations || [], source: "live" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Live loan rates error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
