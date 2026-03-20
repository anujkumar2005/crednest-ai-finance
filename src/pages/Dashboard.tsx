import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet, TrendingUp, TrendingDown, Target, MessageSquare, ArrowRight,
  Sparkles, CreditCard, BarChart3, PieChart as PieChartIcon, Calendar,
  IndianRupee, Heart, Shield, Activity, Download, FileText, AlertTriangle,
  CheckCircle2, Loader2, Building2, Landmark,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, RadialBarChart, RadialBar,
} from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "hsl(var(--destructive))",
  "Transportation": "hsl(var(--info))",
  "Shopping": "hsl(var(--success))",
  "Bills & Utilities": "hsl(var(--warning))",
  "Entertainment": "hsl(var(--primary))",
  "Healthcare": "hsl(var(--accent-foreground))",
  "Education": "hsl(var(--secondary-foreground))",
  "Other": "hsl(var(--muted-foreground))",
  "Groceries": "#10b981",
  "Rent": "#f59e0b",
  "Travel": "#3b82f6",
  "Insurance": "#8b5cf6",
  "Investments": "#06b6d4",
};

interface UserLoan {
  principal_amount: number;
  emi_amount: number | null;
  tenure_months: number;
  interest_rate: number;
  status: string | null;
  loan_type: string;
}

interface SavingsGoal {
  name: string;
  current_amount: number | null;
  target_amount: number;
  is_completed: boolean;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<{ name: string | null; monthly_income: number | null; age: number | null } | null>(null);
  const [budgets, setBudgets] = useState<Array<{ category: string; planned_amount: number; spent_amount: number | null }>>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [incomes, setIncomes] = useState<Array<{ amount: number; date: string; source: string }>>([]);
  const [expenses, setExpenses] = useState<Array<{ amount: number; date: string; category: string; description: string | null }>>([]);
  const [userLoans, setUserLoans] = useState<UserLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    if (user) fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    const currentMonth = new Date().toISOString().slice(0, 7);

    const [profileRes, budgetsRes, savingsRes, incomesRes, expensesRes, loansRes] = await Promise.all([
      supabase.from("profiles").select("name, monthly_income, age").eq("user_id", user?.id).single(),
      supabase.from("budgets").select("category, planned_amount, spent_amount").eq("user_id", user?.id).eq("month", currentMonth),
      supabase.from("savings_goals").select("name, current_amount, target_amount, is_completed").eq("user_id", user?.id),
      supabase.from("incomes").select("amount, date, source").eq("user_id", user?.id),
      supabase.from("expenses").select("amount, date, category, description").eq("user_id", user?.id),
      supabase.from("user_loans").select("principal_amount, emi_amount, tenure_months, interest_rate, status, loan_type").eq("user_id", user?.id),
    ]);

    setProfile(profileRes.data);
    setBudgets(budgetsRes.data || []);
    setSavingsGoals(savingsRes.data || []);
    setIncomes(incomesRes.data || []);
    setExpenses(expensesRes.data || []);
    setUserLoans(loansRes.data || []);
    setLoading(false);
  };

  const displayName = profile?.name || user?.email?.split("@")[0] || "User";

  // === CORE CALCULATIONS ===
  const totalPlannedBudget = budgets.reduce((acc, b) => acc + (b.planned_amount || 0), 0);
  const totalSpentExpenses = budgets.reduce((acc, b) => acc + (b.spent_amount || 0), 0);
  const totalSaved = savingsGoals.reduce((acc, g) => acc + (g.current_amount || 0), 0);
  const totalSavingsTarget = savingsGoals.reduce((acc, g) => acc + g.target_amount, 0);
  const monthlyIncome = profile?.monthly_income || 0;
  const netSavings = monthlyIncome - totalSpentExpenses;
  const savingsRate = monthlyIncome > 0 ? Math.round((netSavings / monthlyIncome) * 100) : 0;

  // === NET WORTH CALCULATION ===
  const totalAssets = useMemo(() => {
    const savings = totalSaved;
    const totalIncomeReceived = incomes.reduce((acc, i) => acc + Number(i.amount), 0);
    return savings + totalIncomeReceived;
  }, [totalSaved, incomes]);

  const totalLiabilities = useMemo(() => {
    return userLoans
      .filter(l => l.status === "active")
      .reduce((acc, l) => acc + Number(l.principal_amount), 0);
  }, [userLoans]);

  const netWorth = totalAssets - totalLiabilities;

  // === FINANCIAL HEALTH SCORE (0-100) ===
  const healthScore = useMemo(() => {
    let score = 50; // base score
    const factors: { label: string; points: number; status: "good" | "warning" | "bad"; tip: string }[] = [];

    // 1. Savings Rate (0-25 pts)
    if (monthlyIncome > 0) {
      const rate = netSavings / monthlyIncome;
      if (rate >= 0.3) { score += 25; factors.push({ label: "Savings Rate", points: 25, status: "good", tip: "Excellent! You save 30%+ of income" }); }
      else if (rate >= 0.2) { score += 18; factors.push({ label: "Savings Rate", points: 18, status: "good", tip: "Good savings rate. Try to reach 30%" }); }
      else if (rate >= 0.1) { score += 10; factors.push({ label: "Savings Rate", points: 10, status: "warning", tip: "Aim to save at least 20% of income" }); }
      else { score -= 5; factors.push({ label: "Savings Rate", points: -5, status: "bad", tip: "Low savings rate. Review expenses urgently" }); }
    } else {
      factors.push({ label: "Savings Rate", points: 0, status: "warning", tip: "Set your monthly income in Profile" });
    }

    // 2. Budget Adherence (0-20 pts)
    if (budgets.length > 0) {
      const overBudget = budgets.filter(b => (b.spent_amount || 0) > b.planned_amount).length;
      const adherenceRate = 1 - (overBudget / budgets.length);
      if (adherenceRate >= 0.8) { score += 20; factors.push({ label: "Budget Discipline", points: 20, status: "good", tip: "Great budget control!" }); }
      else if (adherenceRate >= 0.5) { score += 10; factors.push({ label: "Budget Discipline", points: 10, status: "warning", tip: "Some categories over budget" }); }
      else { score -= 5; factors.push({ label: "Budget Discipline", points: -5, status: "bad", tip: "Multiple budgets exceeded. Review spending" }); }
    } else {
      score -= 10;
      factors.push({ label: "Budget Discipline", points: -10, status: "bad", tip: "No budgets set. Start budgeting now" });
    }

    // 3. Debt-to-Income (0-15 pts)
    const monthlyEMI = userLoans.filter(l => l.status === "active").reduce((acc, l) => acc + (Number(l.emi_amount) || 0), 0);
    if (monthlyIncome > 0) {
      const dti = monthlyEMI / monthlyIncome;
      if (dti === 0) { score += 15; factors.push({ label: "Debt-to-Income", points: 15, status: "good", tip: "No active EMIs. Excellent!" }); }
      else if (dti < 0.3) { score += 10; factors.push({ label: "Debt-to-Income", points: 10, status: "good", tip: "Debt is manageable" }); }
      else if (dti < 0.5) { score += 0; factors.push({ label: "Debt-to-Income", points: 0, status: "warning", tip: "EMIs consuming 30-50% of income" }); }
      else { score -= 10; factors.push({ label: "Debt-to-Income", points: -10, status: "bad", tip: "High debt burden. Consider debt consolidation" }); }
    }

    // 4. Savings Goals Progress (0-15 pts)
    if (savingsGoals.length > 0) {
      const avgProgress = savingsGoals.reduce((acc, g) => acc + ((g.current_amount || 0) / g.target_amount), 0) / savingsGoals.length;
      if (avgProgress >= 0.5) { score += 15; factors.push({ label: "Goals Progress", points: 15, status: "good", tip: "On track with savings goals!" }); }
      else if (avgProgress >= 0.2) { score += 8; factors.push({ label: "Goals Progress", points: 8, status: "warning", tip: "Increase contributions to goals" }); }
      else { score += 2; factors.push({ label: "Goals Progress", points: 2, status: "warning", tip: "Goals need more attention" }); }
    } else {
      score -= 5;
      factors.push({ label: "Goals Progress", points: -5, status: "bad", tip: "Set savings goals to track progress" });
    }

    // 5. Emergency Fund (0-10 pts)
    const emergencyFund = totalSaved;
    const monthsOfExpenses = totalSpentExpenses > 0 ? emergencyFund / totalSpentExpenses : 0;
    if (monthsOfExpenses >= 6) { score += 10; factors.push({ label: "Emergency Fund", points: 10, status: "good", tip: "6+ months of expenses covered!" }); }
    else if (monthsOfExpenses >= 3) { score += 5; factors.push({ label: "Emergency Fund", points: 5, status: "warning", tip: "Build up to 6 months of expenses" }); }
    else { score -= 5; factors.push({ label: "Emergency Fund", points: -5, status: "bad", tip: "Start an emergency fund immediately" }); }

    return { score: Math.max(0, Math.min(100, score)), factors };
  }, [monthlyIncome, netSavings, budgets, userLoans, savingsGoals, totalSaved, totalSpentExpenses]);

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Fair";
    if (score >= 30) return "Needs Work";
    return "Critical";
  };

  // === EXPENSE ANALYTICS ===
  const categoryBreakdown = useMemo(() => {
    const cats: Record<string, number> = {};
    expenses.forEach(e => {
      cats[e.category] = (cats[e.category] || 0) + Number(e.amount);
    });
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] || `hsl(${Math.random() * 360}, 60%, 50%)` }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const budgetBreakdown = budgets.map((b) => ({
    name: b.category,
    value: b.spent_amount || 0,
    color: CATEGORY_COLORS[b.category] || "hsl(var(--muted-foreground))",
  })).filter(b => b.value > 0);

  const savingsProgress = savingsGoals.filter(g => !g.is_completed).slice(0, 4).map((g) => ({
    name: g.name.length > 12 ? g.name.slice(0, 12) + "..." : g.name,
    saved: g.current_amount || 0,
    target: g.target_amount,
  }));

  // Monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const months: Record<string, { income: number; expenses: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      months[key] = { income: 0, expenses: 0 };
    }
    incomes.forEach(inc => {
      const key = inc.date.slice(0, 7);
      if (months[key]) months[key].income += Number(inc.amount);
    });
    expenses.forEach(exp => {
      const key = exp.date.slice(0, 7);
      if (months[key]) months[key].expenses += Number(exp.amount);
    });
    return Object.entries(months).map(([key, val]) => ({
      month: new Date(key + "-01").toLocaleString("default", { month: "short" }),
      income: val.income,
      expenses: val.expenses,
    }));
  }, [incomes, expenses]);

  // === NET WORTH BREAKDOWN ===
  const netWorthData = useMemo(() => [
    { name: "Savings", value: totalSaved, fill: "hsl(var(--success))" },
    { name: "Income Received", value: incomes.reduce((a, i) => a + Number(i.amount), 0), fill: "hsl(var(--primary))" },
    { name: "Active Loans", value: totalLiabilities, fill: "hsl(var(--destructive))" },
  ].filter(d => d.value > 0), [totalSaved, incomes, totalLiabilities]);

  // === EXPORT PDF ===
  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            profile: { name: displayName, monthly_income: monthlyIncome, age: profile?.age },
            budgets,
            savingsGoals,
            incomes: incomes.slice(0, 20),
            expenses: expenses.slice(0, 30),
            userLoans,
            healthScore: healthScore.score,
            healthFactors: healthScore.factors,
            netWorth,
            totalAssets,
            totalLiabilities,
            totalSaved,
            totalSpentExpenses,
            netSavings,
            savingsRate,
            categoryBreakdown: categoryBreakdown.slice(0, 10),
          }),
        }
      );

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CredNest_Report_${new Date().toISOString().slice(0, 7)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Report Exported", description: "Your financial report has been downloaded" });
    } catch (error) {
      console.error("Export error:", error);
      toast({ title: "Export Failed", description: "Could not generate report. Please try again.", variant: "destructive" });
    }
    setExportingPdf(false);
  };

  const formatCurrency = (val: number) => {
    if (Math.abs(val) >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (Math.abs(val) >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (Math.abs(val) >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: ₹{Number(entry.value).toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const scoreRadialData = [{ name: "Score", value: healthScore.score, fill: healthScore.score >= 75 ? "#10b981" : healthScore.score >= 50 ? "#f59e0b" : "#ef4444" }];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {displayName}! 👋</h1>
            <p className="text-muted-foreground mt-1">
              Here's your financial overview for {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleExportPdf} disabled={exportingPdf}>
              {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export Report
            </Button>
            <Link to="/chat">
              <Button variant="gold" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Ask AI Assistant
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Saved" value={formatCurrency(totalSaved)} change={`${totalSavingsTarget > 0 ? Math.round((totalSaved / totalSavingsTarget) * 100) : 0}% of goal`} changeType="positive" icon={Wallet} />
          <StatCard title="Monthly Income" value={formatCurrency(monthlyIncome)} change="From profile" changeType="positive" icon={TrendingUp} iconColor="text-success" />
          <StatCard title="Monthly Expenses" value={formatCurrency(totalSpentExpenses)} change={`${formatCurrency(totalPlannedBudget)} budgeted`} changeType={totalSpentExpenses > totalPlannedBudget ? "negative" : "positive"} icon={TrendingDown} iconColor="text-destructive" />
          <StatCard title="Net Worth" value={formatCurrency(netWorth)} change={netWorth >= 0 ? "Positive" : "Negative"} changeType={netWorth >= 0 ? "positive" : "negative"} icon={Landmark} iconColor="text-primary" />
        </div>

        {/* Tabbed Analytics Section */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="overview"><BarChart3 className="h-4 w-4 mr-1.5" />Overview</TabsTrigger>
            <TabsTrigger value="expenses"><PieChartIcon className="h-4 w-4 mr-1.5" />Expenses</TabsTrigger>
            <TabsTrigger value="health"><Activity className="h-4 w-4 mr-1.5" />Health Score</TabsTrigger>
            <TabsTrigger value="networth"><Landmark className="h-4 w-4 mr-1.5" />Net Worth</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Income vs Expenses Trend */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Income vs Expenses
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">Last 6 months</span>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrend}>
                        <defs>
                          <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="income" stroke="hsl(var(--success))" fill="url(#incomeGradient)" strokeWidth={2} name="Income" />
                        <Area type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" fill="url(#expenseGradient)" strokeWidth={2} name="Expenses" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Savings Goals Progress */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Savings Goals
                  </CardTitle>
                  <Link to="/savings"><Button variant="ghost" size="sm" className="gap-1">View All <ArrowRight className="h-4 w-4" /></Button></Link>
                </CardHeader>
                <CardContent>
                  {savingsProgress.length === 0 ? (
                    <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Target className="h-12 w-12 mx-auto mb-2 opacity-30" />
                        <p>No savings goals set</p>
                        <Link to="/savings"><Button variant="link" size="sm">Create one →</Button></Link>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={savingsProgress} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                          <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="saved" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} name="Saved" />
                          <Bar dataKey="target" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} name="Target" opacity={0.4} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bottom Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" />Recent Expenses</CardTitle>
                  <Link to="/budgeting"><Button variant="ghost" size="sm" className="gap-1">View All <ArrowRight className="h-4 w-4" /></Button></Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {expenses.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No expenses recorded yet</p>
                    ) : (
                      expenses.slice(0, 5).map((expense, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-lg">💸</div>
                            <div>
                              <p className="font-medium">{expense.category}</p>
                              <p className="text-xs text-muted-foreground">{expense.description || new Date(expense.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <p className="font-semibold text-foreground">-₹{Number(expense.amount).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Quick Actions</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <Link to="/chat" className="block"><Button variant="glass" className="w-full justify-start gap-3 h-auto py-3"><MessageSquare className="h-5 w-5 text-primary" /><div className="text-left"><div className="font-medium">AI Financial Advisor</div><div className="text-xs text-muted-foreground">Get personalized advice</div></div></Button></Link>
                    <Link to="/budgeting" className="block"><Button variant="glass" className="w-full justify-start gap-3 h-auto py-3"><Calendar className="h-5 w-5 text-warning" /><div className="text-left"><div className="font-medium">Manage Budget</div><div className="text-xs text-muted-foreground">Add expenses & budgets</div></div></Button></Link>
                    <Link to="/savings" className="block"><Button variant="glass" className="w-full justify-start gap-3 h-auto py-3"><Target className="h-5 w-5 text-success" /><div className="text-left"><div className="font-medium">Savings Goals</div><div className="text-xs text-muted-foreground">Track your progress</div></div></Button></Link>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-warning" />Budget Categories</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {budgets.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4 text-sm">No budgets set</p>
                    ) : budgets.slice(0, 3).map((budget, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                        <div>
                          <p className="font-medium text-sm">{budget.category}</p>
                          <p className="text-xs text-muted-foreground">Spent: ₹{(budget.spent_amount || 0).toLocaleString()}</p>
                        </div>
                        <p className="font-semibold text-warning">₹{budget.planned_amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* EXPENSE ANALYTICS TAB */}
          <TabsContent value="expenses" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5 text-primary" />Spending by Category</CardTitle>
                  <CardDescription>All-time expense breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryBreakdown.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">No expenses to analyze</div>
                  ) : (
                    <div className="h-[300px] flex items-center">
                      <ResponsiveContainer width="55%" height="100%">
                        <PieChart>
                          <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2} dataKey="value">
                            {categoryBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, '']} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {categoryBreakdown.slice(0, 6).map(item => (
                          <div key={item.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-muted-foreground truncate max-w-[100px]">{item.name}</span>
                            </div>
                            <span className="font-medium">₹{item.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Monthly Spending Trend</CardTitle>
                  <CardDescription>How your spending changed over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `₹${v / 1000}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Expenses" />
                        <Bar dataKey="income" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Income" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Expense Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Top Spending Categories</CardTitle>
                <CardDescription>Where your money goes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryBreakdown.slice(0, 5).map((cat, i) => {
                    const totalExp = expenses.reduce((a, e) => a + Number(e.amount), 0);
                    const pct = totalExp > 0 ? Math.round((cat.value / totalExp) * 100) : 0;
                    return (
                      <div key={cat.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{cat.name}</span>
                          <span className="text-sm text-muted-foreground">₹{cat.value.toLocaleString()} ({pct}%)</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                    );
                  })}
                  {categoryBreakdown.length === 0 && <p className="text-center text-muted-foreground py-4">No expense data available</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HEALTH SCORE TAB */}
          <TabsContent value="health" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader className="text-center">
                  <CardTitle>Financial Health Score</CardTitle>
                  <CardDescription>Based on your financial data</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="relative w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270} data={scoreRadialData}>
                        <RadialBar background dataKey="value" cornerRadius={10} max={100} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-4xl font-bold ${getScoreColor(healthScore.score)}`}>{healthScore.score}</span>
                      <span className="text-sm text-muted-foreground">{getScoreLabel(healthScore.score)}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`mt-4 ${healthScore.score >= 70 ? "border-emerald-500 text-emerald-500" : healthScore.score >= 50 ? "border-amber-500 text-amber-500" : "border-red-500 text-red-500"}`}>
                    {getScoreLabel(healthScore.score)}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Score Breakdown & Tips</CardTitle>
                  <CardDescription>Detailed analysis of your financial health</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {healthScore.factors.map((factor, i) => (
                      <div key={i} className={`p-4 rounded-lg border ${factor.status === "good" ? "border-emerald-500/20 bg-emerald-500/5" : factor.status === "warning" ? "border-amber-500/20 bg-amber-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {factor.status === "good" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : factor.status === "warning" ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <AlertTriangle className="h-4 w-4 text-red-500" />}
                            <span className="font-medium">{factor.label}</span>
                          </div>
                          <Badge variant="outline" className={factor.points >= 0 ? "text-emerald-500" : "text-red-500"}>
                            {factor.points > 0 ? "+" : ""}{factor.points} pts
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground ml-6">{factor.tip}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* NET WORTH TAB */}
          <TabsContent value="networth" className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="border-emerald-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-emerald-500/10"><TrendingUp className="h-6 w-6 text-emerald-500" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Assets</p>
                      <p className="text-2xl font-bold text-emerald-500">{formatCurrency(totalAssets)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-red-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-red-500/10"><TrendingDown className="h-6 w-6 text-red-500" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Liabilities</p>
                      <p className="text-2xl font-bold text-red-500">{formatCurrency(totalLiabilities)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10"><Wallet className="h-6 w-6 text-primary" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Net Worth</p>
                      <p className={`text-2xl font-bold ${netWorth >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatCurrency(netWorth)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Assets vs Liabilities</CardTitle>
                  <CardDescription>Visual breakdown of your net worth</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {netWorthData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">No financial data yet</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={netWorthData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => formatCurrency(v)} />
                          <Tooltip formatter={(value: number) => [formatCurrency(value), ""]} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {netWorthData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Loans</CardTitle>
                  <CardDescription>Your current liabilities</CardDescription>
                </CardHeader>
                <CardContent>
                  {userLoans.filter(l => l.status === "active").length === 0 ? (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      <div className="text-center">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-emerald-500 opacity-50" />
                        <p>No active loans — great!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userLoans.filter(l => l.status === "active").map((loan, i) => (
                        <div key={i} className="p-4 rounded-lg border border-border bg-secondary/20">
                          <div className="flex justify-between items-center mb-2">
                            <Badge variant="outline">{loan.loan_type}</Badge>
                            <span className="text-sm font-medium">{loan.interest_rate}% p.a.</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Principal</span>
                            <span className="font-medium">{formatCurrency(Number(loan.principal_amount))}</span>
                          </div>
                          {loan.emi_amount && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Monthly EMI</span>
                              <span className="font-medium">{formatCurrency(Number(loan.emi_amount))}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
