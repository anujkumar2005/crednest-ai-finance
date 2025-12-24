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
} from "lucide-react";
import { Link } from "react-router-dom";

// Sample data - will be replaced with real data from backend
const budgetCategories = [
  { name: "Food & Dining", spent: 8500, budget: 12000, color: "bg-destructive" },
  { name: "Transportation", spent: 3200, budget: 5000, color: "bg-info" },
  { name: "Shopping", spent: 4500, budget: 6000, color: "bg-success" },
  { name: "Entertainment", spent: 2100, budget: 3000, color: "bg-warning" },
];

const recentTransactions = [
  { id: 1, name: "Grocery Store", amount: -2450, category: "Food", date: "Today" },
  { id: 2, name: "Salary Credit", amount: 85000, category: "Income", date: "Dec 20" },
  { id: 3, name: "Netflix Subscription", amount: -649, category: "Entertainment", date: "Dec 19" },
  { id: 4, name: "Uber Ride", amount: -320, category: "Transportation", date: "Dec 18" },
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back! 👋</h1>
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
            value="₹85,000"
            change="Salary + Investments"
            changeType="neutral"
            icon={TrendingUp}
            iconColor="text-success"
          />
          <StatCard
            title="Monthly Expenses"
            value="₹52,300"
            change="-8.2% from last month"
            changeType="positive"
            icon={TrendingDown}
            iconColor="text-destructive"
          />
          <StatCard
            title="Savings Goal"
            value="₹1,20,000"
            change="68% achieved"
            changeType="positive"
            icon={Target}
            iconColor="text-primary"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Budget Overview */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Budget Overview
              </CardTitle>
              <Link to="/budgeting">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-6">
              {budgetCategories.map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-muted-foreground">
                      ₹{category.spent.toLocaleString()} / ₹{category.budget.toLocaleString()}
                    </span>
                  </div>
                  <ProgressBar value={category.spent} max={category.budget} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/chat" className="block">
                <Button variant="glass" className="w-full justify-start gap-3">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <div className="font-medium">AI Financial Advisor</div>
                    <div className="text-xs text-muted-foreground">Get personalized advice</div>
                  </div>
                </Button>
              </Link>
              <Link to="/savings" className="block">
                <Button variant="glass" className="w-full justify-start gap-3">
                  <PiggyBank className="h-5 w-5 text-success" />
                  <div className="text-left">
                    <div className="font-medium">Savings Goals</div>
                    <div className="text-xs text-muted-foreground">Track your progress</div>
                  </div>
                </Button>
              </Link>
              <Link to="/loans" className="block">
                <Button variant="glass" className="w-full justify-start gap-3">
                  <TrendingUp className="h-5 w-5 text-info" />
                  <div className="text-left">
                    <div className="font-medium">Compare Loans</div>
                    <div className="text-xs text-muted-foreground">Find the best rates</div>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.amount > 0 ? "bg-success/20" : "bg-muted"
                      }`}
                    >
                      {transaction.amount > 0 ? (
                        <TrendingUp className="h-5 w-5 text-success" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.name}</p>
                      <p className="text-sm text-muted-foreground">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        transaction.amount > 0 ? "text-success" : "text-foreground"
                      }`}
                    >
                      {transaction.amount > 0 ? "+" : ""}₹
                      {Math.abs(transaction.amount).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">{transaction.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
