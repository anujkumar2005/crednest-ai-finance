import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
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
  Legend,
} from "recharts";

// Monthly expense trend data
const monthlyTrend = [
  { month: "Jul", income: 82000, expenses: 58000 },
  { month: "Aug", income: 85000, expenses: 54000 },
  { month: "Sep", income: 85000, expenses: 62000 },
  { month: "Oct", income: 88000, expenses: 49000 },
  { month: "Nov", income: 85000, expenses: 55000 },
  { month: "Dec", income: 92000, expenses: 52300 },
];

// Budget category breakdown
const budgetBreakdown = [
  { name: "Food", value: 8500, color: "hsl(var(--destructive))" },
  { name: "Rent/EMI", value: 25000, color: "hsl(var(--primary))" },
  { name: "Transport", value: 3200, color: "hsl(var(--info))" },
  { name: "Shopping", value: 4500, color: "hsl(var(--success))" },
  { name: "Bills", value: 7800, color: "hsl(var(--warning))" },
  { name: "Others", value: 3300, color: "hsl(var(--muted-foreground))" },
];

// Savings vs Target data
const savingsProgress = [
  { name: "Emergency", saved: 180000, target: 300000 },
  { name: "Vacation", saved: 85000, target: 200000 },
  { name: "Home", saved: 450000, target: 1000000 },
  { name: "Education", saved: 120000, target: 500000 },
];

const recentTransactions = [
  { id: 1, name: "Grocery Store", amount: -2450, category: "Food", date: "Today", icon: "🛒" },
  { id: 2, name: "Salary Credit", amount: 92000, category: "Income", date: "Dec 20", icon: "💰" },
  { id: 3, name: "Netflix Subscription", amount: -649, category: "Entertainment", date: "Dec 19", icon: "🎬" },
  { id: 4, name: "Uber Ride", amount: -320, category: "Transportation", date: "Dec 18", icon: "🚗" },
  { id: 5, name: "Electricity Bill", amount: -2100, category: "Bills", date: "Dec 17", icon: "💡" },
];

const upcomingBills = [
  { name: "Credit Card EMI", amount: 15000, dueDate: "Dec 28", status: "upcoming" },
  { name: "Internet Bill", amount: 1499, dueDate: "Jan 2", status: "upcoming" },
  { name: "Insurance Premium", amount: 5000, dueDate: "Jan 5", status: "upcoming" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ name: string | null } | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", user?.id)
      .single();
    setProfile(data);
  };

  const displayName = profile?.name || user?.email?.split("@")[0] || "User";
  const totalExpenses = budgetBreakdown.reduce((acc, item) => acc + item.value, 0);

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
              Here's your financial overview for December 2024
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
            title="Total Balance"
            value="₹2,45,000"
            change="+12.5% from last month"
            changeType="positive"
            icon={Wallet}
          />
          <StatCard
            title="Monthly Income"
            value="₹92,000"
            change="+8.2% increase"
            changeType="positive"
            icon={TrendingUp}
            iconColor="text-success"
          />
          <StatCard
            title="Monthly Expenses"
            value={`₹${totalExpenses.toLocaleString()}`}
            change="-5.2% from last month"
            changeType="positive"
            icon={TrendingDown}
            iconColor="text-destructive"
          />
          <StatCard
            title="Net Savings"
            value={`₹${(92000 - totalExpenses).toLocaleString()}`}
            change="45% savings rate"
            changeType="positive"
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
          {/* Recent Transactions */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Recent Transactions
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-lg">
                        {transaction.icon}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.name}</p>
                        <p className="text-xs text-muted-foreground">{transaction.category} • {transaction.date}</p>
                      </div>
                    </div>
                    <p
                      className={`font-semibold ${
                        transaction.amount > 0 ? "text-success" : "text-foreground"
                      }`}
                    >
                      {transaction.amount > 0 ? "+" : ""}₹
                      {Math.abs(transaction.amount).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions & Upcoming Bills */}
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
                <Link to="/loans" className="block">
                  <Button variant="glass" className="w-full justify-start gap-3 h-auto py-3">
                    <IndianRupee className="h-5 w-5 text-success" />
                    <div className="text-left">
                      <div className="font-medium">Compare Loans</div>
                      <div className="text-xs text-muted-foreground">Find best rates</div>
                    </div>
                  </Button>
                </Link>
                <Link to="/investments" className="block">
                  <Button variant="glass" className="w-full justify-start gap-3 h-auto py-3">
                    <TrendingUp className="h-5 w-5 text-info" />
                    <div className="text-left">
                      <div className="font-medium">Investments</div>
                      <div className="text-xs text-muted-foreground">Track portfolio</div>
                    </div>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Upcoming Bills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-warning" />
                  Upcoming Bills
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingBills.map((bill, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                    <div>
                      <p className="font-medium text-sm">{bill.name}</p>
                      <p className="text-xs text-muted-foreground">Due: {bill.dueDate}</p>
                    </div>
                    <p className="font-semibold text-warning">₹{bill.amount.toLocaleString()}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
