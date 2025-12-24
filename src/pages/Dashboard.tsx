import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  MessageSquare,
  ArrowRight,
  Sparkles,
  CreditCard,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  IndianRupee,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
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
};

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ name: string | null; monthly_income: number | null } | null>(null);
  const [budgets, setBudgets] = useState<Array<{ category: string; planned_amount: number; spent_amount: number | null }>>([]);
  const [savingsGoals, setSavingsGoals] = useState<Array<{ name: string; current_amount: number | null; target_amount: number }>>([]);
  const [incomes, setIncomes] = useState<Array<{ amount: number; date: string }>>([]);
  const [expenses, setExpenses] = useState<Array<{ amount: number; date: string; category: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const [profileRes, budgetsRes, savingsRes, incomesRes, expensesRes] = await Promise.all([
      supabase.from("profiles").select("name, monthly_income").eq("user_id", user?.id).single(),
      supabase.from("budgets").select("category, planned_amount, spent_amount").eq("user_id", user?.id).eq("month", currentMonth),
      supabase.from("savings_goals").select("name, current_amount, target_amount").eq("user_id", user?.id).eq("is_completed", false),
      supabase.from("incomes").select("amount, date").eq("user_id", user?.id),
      supabase.from("expenses").select("amount, date, category").eq("user_id", user?.id),
    ]);

    setProfile(profileRes.data);
    setBudgets(budgetsRes.data || []);
    setSavingsGoals(savingsRes.data || []);
    setIncomes(incomesRes.data || []);
    setExpenses(expensesRes.data || []);
    setLoading(false);
  };

  const displayName = profile?.name || user?.email?.split("@")[0] || "User";
  
  // Calculate totals from real data
  const totalPlannedBudget = budgets.reduce((acc, b) => acc + (b.planned_amount || 0), 0);
  const totalSpentExpenses = budgets.reduce((acc, b) => acc + (b.spent_amount || 0), 0);
  const totalSaved = savingsGoals.reduce((acc, g) => acc + (g.current_amount || 0), 0);
  const totalSavingsTarget = savingsGoals.reduce((acc, g) => acc + g.target_amount, 0);
  const monthlyIncome = profile?.monthly_income || 0;
  const netSavings = monthlyIncome - totalSpentExpenses;
  const savingsRate = monthlyIncome > 0 ? Math.round((netSavings / monthlyIncome) * 100) : 0;

  // Budget breakdown for pie chart
  const budgetBreakdown = budgets.map((b) => ({
    name: b.category,
    value: b.spent_amount || 0,
    color: CATEGORY_COLORS[b.category] || "hsl(var(--muted-foreground))",
  })).filter(b => b.value > 0);

  // Savings progress for bar chart
  const savingsProgress = savingsGoals.slice(0, 4).map((g) => ({
    name: g.name.length > 12 ? g.name.slice(0, 12) + "..." : g.name,
    saved: g.current_amount || 0,
    target: g.target_amount,
  }));

  // Monthly trend (last 6 months)
  const getMonthlyTrend = () => {
    const months: Record<string, { income: number; expenses: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleString("default", { month: "short" });
      months[key] = { income: 0, expenses: 0 };
    }
    incomes.forEach((inc) => {
      const key = inc.date.slice(0, 7);
      if (months[key]) months[key].income += Number(inc.amount);
    });
    expenses.forEach((exp) => {
      const key = exp.date.slice(0, 7);
      if (months[key]) months[key].expenses += Number(exp.amount);
    });
    return Object.entries(months).map(([key, val]) => ({
      month: new Date(key + "-01").toLocaleString("default", { month: "short" }),
      income: val.income,
      expenses: val.expenses,
    }));
  };

  const monthlyTrend = getMonthlyTrend();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: ₹{entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {displayName}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's your financial overview for {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
            </p>
          </div>
          <Link to="/chat">
            <Button variant="gold" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Ask AI Assistant
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Saved"
            value={`₹${totalSaved.toLocaleString()}`}
            change={`${totalSavingsTarget > 0 ? Math.round((totalSaved / totalSavingsTarget) * 100) : 0}% of goal`}
            changeType="positive"
            icon={Wallet}
          />
          <StatCard
            title="Monthly Income"
            value={`₹${monthlyIncome.toLocaleString()}`}
            change="From profile"
            changeType="positive"
            icon={TrendingUp}
            iconColor="text-success"
          />
          <StatCard
            title="Monthly Expenses"
            value={`₹${totalSpentExpenses.toLocaleString()}`}
            change={`₹${totalPlannedBudget.toLocaleString()} budgeted`}
            changeType={totalSpentExpenses > totalPlannedBudget ? "negative" : "positive"}
            icon={TrendingDown}
            iconColor="text-destructive"
          />
          <StatCard
            title="Net Savings"
            value={`₹${netSavings.toLocaleString()}`}
            change={`${savingsRate}% savings rate`}
            changeType={netSavings >= 0 ? "positive" : "negative"}
            icon={Target}
            iconColor="text-primary"
          />
        </div>

        {/* Charts Row */}
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
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="hsl(var(--success))"
                      fill="url(#incomeGradient)"
                      strokeWidth={2}
                      name="Income"
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="hsl(var(--destructive))"
                      fill="url(#expenseGradient)"
                      strokeWidth={2}
                      name="Expenses"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                Expense Breakdown
              </CardTitle>
              <span className="text-xs text-muted-foreground">This month</span>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] flex items-center">
                <ResponsiveContainer width="60%" height="100%">
                  <PieChart>
                    <Pie
                      data={budgetBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {budgetBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {budgetBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium">₹{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Savings Goals Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Savings Goals Progress
            </CardTitle>
            <Link to="/savings">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={savingsProgress} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="saved" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} name="Saved" />
                  <Bar dataKey="target" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} name="Target" opacity={0.4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Expenses */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Recent Expenses
              </CardTitle>
              <Link to="/budgeting">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No expenses recorded yet</p>
                ) : (
                  expenses.slice(0, 5).map((expense, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-lg">
                          💸
                        </div>
                        <div>
                          <p className="font-medium">{expense.category}</p>
                          <p className="text-xs text-muted-foreground">{new Date(expense.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-foreground">
                        -₹{Number(expense.amount).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions & Budget Summary */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/chat" className="block">
                  <Button variant="glass" className="w-full justify-start gap-3 h-auto py-3">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">AI Financial Advisor</div>
                      <div className="text-xs text-muted-foreground">Get personalized advice</div>
                    </div>
                  </Button>
                </Link>
                <Link to="/budgeting" className="block">
                  <Button variant="glass" className="w-full justify-start gap-3 h-auto py-3">
                    <Calendar className="h-5 w-5 text-warning" />
                    <div className="text-left">
                      <div className="font-medium">Manage Budget</div>
                      <div className="text-xs text-muted-foreground">Add expenses & budgets</div>
                    </div>
                  </Button>
                </Link>
                <Link to="/savings" className="block">
                  <Button variant="glass" className="w-full justify-start gap-3 h-auto py-3">
                    <Target className="h-5 w-5 text-success" />
                    <div className="text-left">
                      <div className="font-medium">Savings Goals</div>
                      <div className="text-xs text-muted-foreground">Track your progress</div>
                    </div>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Budget Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-warning" />
                  Budget Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {budgets.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">No budgets set</p>
                ) : (
                  budgets.slice(0, 3).map((budget, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                      <div>
                        <p className="font-medium text-sm">{budget.category}</p>
                        <p className="text-xs text-muted-foreground">
                          Spent: ₹{(budget.spent_amount || 0).toLocaleString()}
                        </p>
                      </div>
                      <p className="font-semibold text-warning">₹{budget.planned_amount.toLocaleString()}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
