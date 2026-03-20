import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
    const { error: authError } = await supabaseAuth.auth.getUser(jwt);
    if (authError) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await req.json();
    const {
      profile, budgets, savingsGoals, incomes, expenses, userLoans,
      healthScore, healthFactors, netWorth, totalAssets, totalLiabilities,
      totalSaved, totalSpentExpenses, netSavings, savingsRate, categoryBreakdown,
    } = data;

    const now = new Date();
    const reportMonth = now.toLocaleString("en-IN", { month: "long", year: "numeric" });
    const formatCurrency = (val: number) => `₹${Number(val).toLocaleString("en-IN")}`;

    const scoreColor = healthScore >= 75 ? "#10b981" : healthScore >= 50 ? "#f59e0b" : "#ef4444";
    const scoreLabel = healthScore >= 85 ? "Excellent" : healthScore >= 70 ? "Good" : healthScore >= 50 ? "Fair" : healthScore >= 30 ? "Needs Work" : "Critical";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CredNest AI - Financial Report - ${reportMonth}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a2e; background: #f8f9fa; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 30px; background: white; }
    .header { text-align: center; border-bottom: 3px solid #6366f1; padding-bottom: 24px; margin-bottom: 30px; }
    .header h1 { font-size: 28px; color: #6366f1; margin-bottom: 4px; }
    .header p { color: #666; font-size: 14px; }
    h2 { font-size: 20px; color: #1a1a2e; margin: 30px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { padding: 16px; border-radius: 10px; text-align: center; }
    .stat-card .value { font-size: 22px; font-weight: 700; }
    .stat-card .label { font-size: 12px; color: #666; margin-top: 4px; }
    .green { background: #ecfdf5; border: 1px solid #a7f3d0; }
    .green .value { color: #059669; }
    .red { background: #fef2f2; border: 1px solid #fecaca; }
    .red .value { color: #dc2626; }
    .blue { background: #eff6ff; border: 1px solid #bfdbfe; }
    .blue .value { color: #2563eb; }
    .purple { background: #f5f3ff; border: 1px solid #ddd6fe; }
    .purple .value { color: #7c3aed; }
    .score-section { text-align: center; padding: 24px; background: #fafafa; border-radius: 12px; margin-bottom: 24px; }
    .score-circle { display: inline-flex; align-items: center; justify-content: center; width: 100px; height: 100px; border-radius: 50%; font-size: 36px; font-weight: 800; color: white; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    th { background: #f9fafb; font-weight: 600; color: #374151; }
    tr:hover { background: #f9fafb; }
    .tip { padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; font-size: 13px; }
    .tip-good { background: #ecfdf5; border-left: 4px solid #10b981; }
    .tip-warning { background: #fffbeb; border-left: 4px solid #f59e0b; }
    .tip-bad { background: #fef2f2; border-left: 4px solid #ef4444; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #999; font-size: 12px; }
    @media print { body { background: white; } .container { padding: 20px; } }
    @media (max-width: 600px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 CredNest AI Financial Report</h1>
      <p><strong>${profile?.name || "User"}</strong> · ${reportMonth} · Generated on ${now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
    </div>

    <div class="stat-grid">
      <div class="stat-card green"><div class="value">${formatCurrency(totalSaved)}</div><div class="label">Total Saved</div></div>
      <div class="stat-card blue"><div class="value">${formatCurrency(profile?.monthly_income || 0)}</div><div class="label">Monthly Income</div></div>
      <div class="stat-card red"><div class="value">${formatCurrency(totalSpentExpenses)}</div><div class="label">Monthly Expenses</div></div>
      <div class="stat-card purple"><div class="value">${formatCurrency(netWorth)}</div><div class="label">Net Worth</div></div>
    </div>

    <h2>📊 Financial Health Score</h2>
    <div class="score-section">
      <div class="score-circle" style="background:${scoreColor}">${healthScore}</div>
      <div style="font-size:18px;font-weight:600;color:${scoreColor}">${scoreLabel}</div>
      <p style="color:#666;font-size:13px;margin-top:4px">Savings Rate: ${savingsRate}% · Net Savings: ${formatCurrency(netSavings)}</p>
    </div>

    ${(healthFactors || []).length > 0 ? `
    <h2>💡 Financial Health Tips</h2>
    ${(healthFactors || []).map((f: any) => `
      <div class="tip tip-${f.status}">
        <strong>${f.label}</strong> (${f.points > 0 ? '+' : ''}${f.points} pts) — ${f.tip}
      </div>
    `).join('')}
    ` : ''}

    <h2>🏦 Net Worth Breakdown</h2>
    <div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
      <div class="stat-card green"><div class="value">${formatCurrency(totalAssets)}</div><div class="label">Total Assets</div></div>
      <div class="stat-card red"><div class="value">${formatCurrency(totalLiabilities)}</div><div class="label">Liabilities</div></div>
      <div class="stat-card ${netWorth >= 0 ? 'green' : 'red'}"><div class="value">${formatCurrency(netWorth)}</div><div class="label">Net Worth</div></div>
    </div>

    ${(categoryBreakdown || []).length > 0 ? `
    <h2>📈 Expense Breakdown by Category</h2>
    <table>
      <thead><tr><th>Category</th><th style="text-align:right">Amount</th><th style="text-align:right">%</th></tr></thead>
      <tbody>
        ${(() => {
          const total = (categoryBreakdown || []).reduce((a: number, c: any) => a + c.value, 0);
          return (categoryBreakdown || []).map((c: any) => `
            <tr><td>${c.name}</td><td style="text-align:right">${formatCurrency(c.value)}</td><td style="text-align:right">${total > 0 ? Math.round((c.value / total) * 100) : 0}%</td></tr>
          `).join('');
        })()}
      </tbody>
    </table>
    ` : ''}

    ${(budgets || []).length > 0 ? `
    <h2>📋 Budget Summary</h2>
    <table>
      <thead><tr><th>Category</th><th style="text-align:right">Planned</th><th style="text-align:right">Spent</th><th style="text-align:right">Status</th></tr></thead>
      <tbody>
        ${(budgets || []).map((b: any) => {
          const over = (b.spent_amount || 0) > b.planned_amount;
          return `<tr><td>${b.category}</td><td style="text-align:right">${formatCurrency(b.planned_amount)}</td><td style="text-align:right">${formatCurrency(b.spent_amount || 0)}</td><td style="text-align:right;color:${over ? '#dc2626' : '#059669'}">${over ? '⚠️ Over' : '✅ OK'}</td></tr>`;
        }).join('')}
      </tbody>
    </table>
    ` : ''}

    ${(savingsGoals || []).length > 0 ? `
    <h2>🎯 Savings Goals</h2>
    <table>
      <thead><tr><th>Goal</th><th style="text-align:right">Saved</th><th style="text-align:right">Target</th><th style="text-align:right">Progress</th></tr></thead>
      <tbody>
        ${(savingsGoals || []).map((g: any) => {
          const pct = g.target_amount > 0 ? Math.round(((g.current_amount || 0) / g.target_amount) * 100) : 0;
          return `<tr><td>${g.name}</td><td style="text-align:right">${formatCurrency(g.current_amount || 0)}</td><td style="text-align:right">${formatCurrency(g.target_amount)}</td><td style="text-align:right">${pct}%</td></tr>`;
        }).join('')}
      </tbody>
    </table>
    ` : ''}

    ${(userLoans || []).filter((l: any) => l.status === 'active').length > 0 ? `
    <h2>🏦 Active Loans</h2>
    <table>
      <thead><tr><th>Type</th><th style="text-align:right">Principal</th><th style="text-align:right">Rate</th><th style="text-align:right">EMI</th></tr></thead>
      <tbody>
        ${(userLoans || []).filter((l: any) => l.status === 'active').map((l: any) => `
          <tr><td>${l.loan_type}</td><td style="text-align:right">${formatCurrency(l.principal_amount)}</td><td style="text-align:right">${l.interest_rate}%</td><td style="text-align:right">${l.emi_amount ? formatCurrency(l.emi_amount) : 'N/A'}</td></tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}

    <div class="footer">
      <p>Generated by <strong>CredNest AI</strong> · This report is for personal reference only</p>
      <p>Data as of ${now.toLocaleDateString("en-IN")} · © ${now.getFullYear()} CredNest AI</p>
    </div>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="CredNest_Report_${now.toISOString().slice(0, 7)}.html"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate report" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
