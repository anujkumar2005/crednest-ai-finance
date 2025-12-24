import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's JWT to verify identity
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id);

    // Create admin client to check role (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      console.error("Role check failed:", roleError);
      return new Response(
        JSON.stringify({ error: "Access denied. Admin role required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Admin access granted for user:", user.id);

    // Fetch all table counts (only accessible to admins)
    const tables = [
      "profiles",
      "expenses",
      "incomes",
      "budgets",
      "savings_goals",
      "user_loans",
      "chat_sessions",
      "chat_messages",
      "banks",
      "insurance_companies",
      "investment_funds",
      "financial_corpus",
      "user_roles",
    ];

    const tableStats = [];
    for (const table of tables) {
      const { count, error } = await supabaseAdmin
        .from(table)
        .select("*", { count: "exact", head: true });
      
      tableStats.push({
        name: table,
        rowCount: error ? 0 : (count || 0),
      });
    }

    // Fetch system stats
    const [
      { count: totalUsers },
      { count: activeChats },
      { count: totalExpenses },
      { count: totalIncomes },
      { count: totalGoals },
      { count: totalBudgets },
      { count: totalLoans },
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("chat_sessions").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("expenses").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("incomes").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("savings_goals").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("budgets").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("user_loans").select("*", { count: "exact", head: true }),
    ]);

    // Fetch recent activity (sanitized - no PII)
    const { data: recentChats } = await supabaseAdmin
      .from("chat_messages")
      .select("id, role, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: recentExpenses } = await supabaseAdmin
      .from("expenses")
      .select("id, category, amount, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const activity: any[] = [];

    if (recentChats) {
      recentChats.forEach((chat) => {
        activity.push({
          type: "chat",
          message: `${chat.role === "user" ? "User" : "AI"} message received`,
          time: chat.created_at,
        });
      });
    }

    if (recentExpenses) {
      recentExpenses.forEach((expense) => {
        activity.push({
          type: "expense",
          message: `Expense added: ₹${expense.amount} in ${expense.category}`,
          time: expense.created_at,
        });
      });
    }

    // Sort by time
    activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return new Response(
      JSON.stringify({
        tableStats,
        systemStats: {
          totalUsers: totalUsers || 0,
          activeChats: activeChats || 0,
          totalExpenses: totalExpenses || 0,
          totalIncomes: totalIncomes || 0,
          totalGoals: totalGoals || 0,
          totalBudgets: totalBudgets || 0,
          totalLoans: totalLoans || 0,
        },
        recentActivity: activity.slice(0, 15),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
