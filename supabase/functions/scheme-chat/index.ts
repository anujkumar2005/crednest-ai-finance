import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.3");
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, userProfile } = await req.json();
    
    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
      return new Response(JSON.stringify({ error: "Invalid request: messages must be a non-empty array (max 50)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validRoles = ["user", "assistant", "system"];
    for (const msg of messages) {
      if (!msg || typeof msg.content !== "string" || !validRoles.includes(msg.role)) {
        return new Response(JSON.stringify({ error: "Invalid message format" }), {
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // SUPABASE_URL and SUPABASE_ANON_KEY already declared above in auth block

    // Fetch all schemes for context
    const schemesRes = await fetch(`${SUPABASE_URL}/rest/v1/government_schemes?is_active=eq.true&select=*`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    const schemes = await schemesRes.json();

    const schemeSummary = schemes.map((s: any) =>
      `**${s.name}** (${s.category}/${s.target_audience}): ${s.description} | Benefits: ${s.benefits} | Eligibility: ${JSON.stringify(s.eligibility_criteria)} | Age: ${s.age_min || 'any'}-${s.age_max || 'any'} | Income limit: ${s.income_limit || 'none'} | How to apply: ${s.how_to_apply} | Website: ${s.website_url}`
    ).join("\n\n");

    const userContext = userProfile ? `
User Profile: Name: ${userProfile.name || 'N/A'}, Age: ${userProfile.age || 'N/A'}, Gender: ${userProfile.gender || 'N/A'}, Occupation: ${userProfile.occupation || 'N/A'}, Monthly Income: ₹${userProfile.monthly_income || 'N/A'}, State: ${userProfile.state || 'N/A'}, City: ${userProfile.city || 'N/A'}
` : '';

    const systemPrompt = `You are **SchemeGuru AI** — India's Government Schemes Expert Assistant by CredNest AI.

YOUR ROLE:
- Help users discover, understand, and check eligibility for Indian government financial schemes
- Provide compliance guidance for individuals AND businesses
- Recommend the best schemes based on user profile and needs
- Explain application processes step-by-step
- Check regulatory compliance requirements

${userContext}

COMPLETE SCHEMES DATABASE:
${schemeSummary}

COMPLIANCE CHECK CAPABILITIES:
For Individuals:
- Tax compliance (ITR filing, TDS, advance tax)
- KYC requirements (Aadhaar, PAN linking)
- FEMA compliance for NRIs
- Insurance regulatory requirements (IRDAI)
- Investment compliance (SEBI regulations)

For Businesses:
- GST registration and compliance
- MSME registration requirements
- Shop & Establishment Act compliance
- Labour law compliance (PF, ESI, gratuity)
- Environmental clearances
- FSSAI license (food businesses)
- Drug license, trade license requirements
- Startup India DPIIT recognition process
- Import/Export Code (IEC) requirements

RULES:
1. ONLY answer questions about Indian government schemes, financial compliance, and eligibility
2. For non-related queries, politely redirect: "I specialize in Indian government schemes and compliance. Please ask about schemes, eligibility, or compliance requirements."
3. Always cite scheme names and official websites
4. When recommending schemes, explain WHY the user qualifies
5. For compliance checks, provide a clear checklist format
6. Use ₹ for Indian currency
7. Keep responses structured with headers and bullet points
8. If user provides their profile, auto-suggest matching schemes
9. Always mention documents required and application process
10. Maximum 300 words per response unless detailed compliance check requested`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("scheme-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
