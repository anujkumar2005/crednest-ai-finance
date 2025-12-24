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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client that bypasses RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all table counts
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

    // Fetch recent activity
    const { data: recentChats } = await supabaseAdmin
      .from("chat_messages")
      .select("id, role, created_at, content")
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
          message: `${chat.role === "user" ? "User" : "AI"} message: "${chat.content?.substring(0, 50)}..."`,
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
