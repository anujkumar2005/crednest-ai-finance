import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    
    if (!PERPLEXITY_API_KEY) {
      console.error("PERPLEXITY_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Perplexity API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    console.log("Fetching live insurance rates...");

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "You are an insurance data expert. Return ONLY valid JSON, no explanations or markdown."
          },
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
                  name: { type: "string" },
                  claim_settlement_ratio: { type: "number" },
                  life_premium_min: { type: "number" },
                  health_premium_min: { type: "number" },
                  vehicle_premium_min: { type: "number" },
                  coverage_min_lakhs: { type: "number" },
                  coverage_max_cr: { type: "number" },
                  rating: { type: "number" },
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
      return new Response(
        JSON.stringify({ error: "Failed to fetch live rates" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("Received response from Perplexity");
    
    let companies: InsuranceRate[] = [];
    
    try {
      companies = typeof content === "string" ? JSON.parse(content) : content;
      
      // Validate and clean the data
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
      
      // Sort by claim settlement ratio
      companies.sort((a, b) => b.claim_settlement_ratio - a.claim_settlement_ratio);
      
      console.log(`Successfully parsed ${companies.length} insurance companies`);
      
    } catch (parseError) {
      console.error("Error parsing insurance data:", parseError, "Content:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse insurance data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        companies,
        lastUpdated: new Date().toISOString(),
        citations: data.citations || [],
      }),
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
