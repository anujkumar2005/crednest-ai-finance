import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    console.log("Fetching live loan rates...");

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
            content: "You are a banking data expert. Return ONLY valid JSON, no explanations or markdown."
          },
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
                  name: { type: "string" },
                  personal_loan_rate: { type: "number" },
                  home_loan_rate: { type: "number" },
                  car_loan_rate: { type: "number" },
                  education_loan_rate: { type: "number" },
                  business_loan_rate: { type: "number" },
                  processing_fee: { type: "number" },
                  max_tenure_years: { type: "number" },
                  min_cibil_score: { type: "number" },
                  rating: { type: "number" }
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
      return new Response(
        JSON.stringify({ error: "Failed to fetch live rates" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("Received response from Perplexity");
    
    let banks: LoanRate[] = [];
    
    try {
      banks = typeof content === "string" ? JSON.parse(content) : content;
      
      // Validate and clean the data
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
      
      // Sort by home loan rate (lowest first)
      banks.sort((a, b) => a.home_loan_rate - b.home_loan_rate);
      
      console.log(`Successfully parsed ${banks.length} banks`);
      
    } catch (parseError) {
      console.error("Error parsing loan data:", parseError, "Content:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse loan data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        banks,
        lastUpdated: new Date().toISOString(),
        citations: data.citations || [],
      }),
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
