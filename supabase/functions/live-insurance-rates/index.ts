import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InsuranceRate {
  name: string;
  claim_settlement_ratio: number;
  life_premium_min: number;
  health_premium_min: number;
  vehicle_premium_min: number;
  coverage_min_lakhs: number;
  coverage_max_cr: number;
  rating: number;
  types: string[];
}

async function fetchFromDatabase(supabaseUrl: string, serviceRoleKey: string): Promise<InsuranceRate[]> {
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await adminClient
    .from("insurance_companies")
    .select("name, claim_settlement_ratio, life_premium_min, health_premium_min, vehicle_premium_min, coverage_amount_min, coverage_amount_max, rating")
    .order("claim_settlement_ratio", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Database fallback error:", error);
    return [];
  }
  return (data || []).map(c => ({
    name: c.name,
    claim_settlement_ratio: c.claim_settlement_ratio ?? 95,
    life_premium_min: c.life_premium_min ?? 0,
    health_premium_min: c.health_premium_min ?? 0,
    vehicle_premium_min: c.vehicle_premium_min ?? 0,
    coverage_min_lakhs: c.coverage_amount_min ? c.coverage_amount_min / 100000 : 25,
    coverage_max_cr: c.coverage_amount_max ? c.coverage_amount_max / 10000000 : 5,
    rating: c.rating ?? 4,
    types: ["Life", "Health"],
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
      const companies = await fetchFromDatabase(supabaseUrl, serviceRoleKey);
      return new Response(JSON.stringify({ companies, lastUpdated: new Date().toISOString(), citations: [], source: "database" }), {
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
          { role: "system", content: "You are an insurance data expert. Return ONLY valid JSON, no explanations or markdown." },
          {
            role: "user",
            content: `Get the current claim settlement ratios and premium information for the top 10 insurance companies in India as of ${currentDate}. Include a mix of life insurance, health insurance, and general insurance companies.
Return ONLY a JSON array with this exact structure, no other text:
[{"name":"LIC of India","claim_settlement_ratio":98.5,"life_premium_min":500,"health_premium_min":400,"vehicle_premium_min":2000,"coverage_min_lakhs":25,"coverage_max_cr":5,"rating":5,"types":["Life","Health"]}]
Use actual current claim settlement ratios from IRDAI data. Premium values should be monthly in INR. Rating should be 1-5 based on market reputation.`
          }
        ],
        search_recency_filter: "month",
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "insurance_rates",
            schema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" }, claim_settlement_ratio: { type: "number" },
                  life_premium_min: { type: "number" }, health_premium_min: { type: "number" },
                  vehicle_premium_min: { type: "number" }, coverage_min_lakhs: { type: "number" },
                  coverage_max_cr: { type: "number" }, rating: { type: "number" },
                  types: { type: "array", items: { type: "string" } }
                },
                required: ["name", "claim_settlement_ratio", "rating", "types"]
              }
            }
          }
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", response.status, errorText);
      const companies = await fetchFromDatabase(supabaseUrl, serviceRoleKey);
      return new Response(JSON.stringify({ companies, lastUpdated: new Date().toISOString(), citations: [], source: "database" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let companies: InsuranceRate[] = [];
    try {
      companies = typeof content === "string" ? JSON.parse(content) : content;
      companies = companies.map(company => ({
        name: String(company.name || "Unknown Company"),
        claim_settlement_ratio: typeof company.claim_settlement_ratio === "number" ? company.claim_settlement_ratio : 95,
        life_premium_min: typeof company.life_premium_min === "number" ? company.life_premium_min : 0,
        health_premium_min: typeof company.health_premium_min === "number" ? company.health_premium_min : 0,
        vehicle_premium_min: typeof company.vehicle_premium_min === "number" ? company.vehicle_premium_min : 0,
        coverage_min_lakhs: typeof company.coverage_min_lakhs === "number" ? company.coverage_min_lakhs : 25,
        coverage_max_cr: typeof company.coverage_max_cr === "number" ? company.coverage_max_cr : 5,
        rating: typeof company.rating === "number" ? Math.min(5, Math.max(1, company.rating)) : 4,
        types: Array.isArray(company.types) ? company.types : ["Life"],
      }));
      companies.sort((a, b) => b.claim_settlement_ratio - a.claim_settlement_ratio);
    } catch (parseError) {
      console.error("Error parsing insurance data:", parseError);
      const fallback = await fetchFromDatabase(supabaseUrl, serviceRoleKey);
      return new Response(JSON.stringify({ companies: fallback, lastUpdated: new Date().toISOString(), citations: [], source: "database" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ companies, lastUpdated: new Date().toISOString(), citations: data.citations || [], source: "live" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Live insurance rates error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
