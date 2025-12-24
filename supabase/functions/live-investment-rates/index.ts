import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FundRate {
  name: string;
  fund_type: string;
  amc: string;
  nav: number;
  returns_1yr: number;
  returns_3yr: number;
  returns_5yr: number;
  expense_ratio: number;
  risk_level: string;
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

    console.log("Fetching live investment fund rates...");

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
            content: "You are a financial data expert. Return ONLY valid JSON, no explanations or markdown."
          },
          {
            role: "user",
            content: `Get the current NAV and returns for the top 10 best performing Indian mutual funds as of ${currentDate}. Include a mix of:
- 4 Equity funds (large cap, mid cap, small cap, flexi cap)
- 3 Index funds (Nifty 50, Sensex, Nifty Next 50)
- 2 Hybrid funds
- 1 Debt fund

Return ONLY a JSON array with this exact structure, no other text:
[{"name":"Fund Name","fund_type":"Equity","amc":"AMC Name","nav":150.5,"returns_1yr":25.5,"returns_3yr":18.2,"returns_5yr":15.8,"expense_ratio":0.5,"risk_level":"High","rating":5}]

Use actual current NAV and returns from official sources like AMFI, Value Research, or fund house websites. Rating should be 1-5.`
          }
        ],
        search_recency_filter: "week",
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "fund_rates",
            schema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  fund_type: { type: "string" },
                  amc: { type: "string" },
                  nav: { type: "number" },
                  returns_1yr: { type: "number" },
                  returns_3yr: { type: "number" },
                  returns_5yr: { type: "number" },
                  expense_ratio: { type: "number" },
                  risk_level: { type: "string" },
                  rating: { type: "number" }
                },
                required: ["name", "fund_type", "amc", "nav", "returns_1yr", "returns_3yr", "returns_5yr", "expense_ratio", "risk_level", "rating"]
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
    
    let funds: FundRate[] = [];
    
    try {
      funds = typeof content === "string" ? JSON.parse(content) : content;
      
      // Validate and clean the data
      funds = funds.map(fund => ({
        name: String(fund.name || "Unknown Fund"),
        fund_type: String(fund.fund_type || "Equity"),
        amc: String(fund.amc || "Unknown AMC"),
        nav: typeof fund.nav === "number" ? fund.nav : 0,
        returns_1yr: typeof fund.returns_1yr === "number" ? fund.returns_1yr : 0,
        returns_3yr: typeof fund.returns_3yr === "number" ? fund.returns_3yr : 0,
        returns_5yr: typeof fund.returns_5yr === "number" ? fund.returns_5yr : 0,
        expense_ratio: typeof fund.expense_ratio === "number" ? fund.expense_ratio : 0.5,
        risk_level: String(fund.risk_level || "Moderate"),
        rating: typeof fund.rating === "number" ? Math.min(5, Math.max(1, fund.rating)) : 4,
      }));
      
      // Sort by 1-year returns
      funds.sort((a, b) => b.returns_1yr - a.returns_1yr);
      
      console.log(`Successfully parsed ${funds.length} funds`);
      
    } catch (parseError) {
      console.error("Error parsing funds:", parseError, "Content:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse funds data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        funds,
        lastUpdated: new Date().toISOString(),
        citations: data.citations || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Live investment rates error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
