import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BankRate {
  name: string;
  savings_rate: number | null;
  fd_rate_1yr: number | null;
  fd_rate_3yr: number | null;
  fd_rate_5yr: number | null;
  min_balance: number | null;
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
            content: "You are a financial data expert. Return ONLY valid JSON, no explanations."
          },
          {
            role: "user",
            content: `Get the current savings account interest rates and fixed deposit (FD) rates for the top 8 Indian banks as of ${currentDate}. Include: HDFC Bank, ICICI Bank, SBI, Axis Bank, Kotak Mahindra Bank, IDFC First Bank, Yes Bank, and IndusInd Bank. Return ONLY a JSON array with this exact structure, no other text:
[{"name":"Bank Name","savings_rate":3.5,"fd_rate_1yr":7.0,"fd_rate_3yr":7.25,"fd_rate_5yr":7.0,"min_balance":10000}]
Use actual current rates from official sources. For min_balance use 0 if no minimum.`
          }
        ],
        search_recency_filter: "week",
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "bank_rates",
            schema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  savings_rate: { type: "number" },
                  fd_rate_1yr: { type: "number" },
                  fd_rate_3yr: { type: "number" },
                  fd_rate_5yr: { type: "number" },
                  min_balance: { type: "number" }
                },
                required: ["name", "savings_rate", "fd_rate_1yr", "fd_rate_3yr", "fd_rate_5yr", "min_balance"]
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
    
    let rates: BankRate[] = [];
    
    try {
      // Parse the JSON response
      rates = typeof content === "string" ? JSON.parse(content) : content;
      
      // Validate and clean the data
      rates = rates.map(rate => ({
        name: String(rate.name || "Unknown Bank"),
        savings_rate: typeof rate.savings_rate === "number" ? rate.savings_rate : null,
        fd_rate_1yr: typeof rate.fd_rate_1yr === "number" ? rate.fd_rate_1yr : null,
        fd_rate_3yr: typeof rate.fd_rate_3yr === "number" ? rate.fd_rate_3yr : null,
        fd_rate_5yr: typeof rate.fd_rate_5yr === "number" ? rate.fd_rate_5yr : null,
        min_balance: typeof rate.min_balance === "number" ? rate.min_balance : 0,
      }));
      
      // Sort by savings rate
      rates.sort((a, b) => (b.savings_rate || 0) - (a.savings_rate || 0));
      
    } catch (parseError) {
      console.error("Error parsing rates:", parseError, "Content:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse rates data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        rates,
        lastUpdated: new Date().toISOString(),
        citations: data.citations || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Live rates error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
