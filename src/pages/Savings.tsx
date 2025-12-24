import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus,
  Target,
  Calendar,
  TrendingUp,
  Plane,
  Home,
  GraduationCap,
  Heart,
  Loader2,
} from "lucide-react";

interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string | null;
  color: string | null;
  is_completed: boolean;
}

interface BankRate {
  name: string;
  savings_rate: number | null;
  fd_rate_1yr: number | null;
  fd_rate_3yr: number | null;
  fd_rate_5yr: number | null;
  min_balance: number | null;
}

const iconMap: Record<string, React.ElementType> = {
  heart: Heart,
  plane: Plane,
  home: Home,
  graduation: GraduationCap,
  target: Target,
};

export default function Savings() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [bankRates, setBankRates] = useState<BankRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch user's savings goals
      const { data: goalsData } = await supabase
        .from("savings_goals")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      // Fetch bank rates for comparison
      const { data: banksData } = await supabase
        .from("banks")
        .select("name, savings_rate, fd_rate_1yr, fd_rate_3yr, fd_rate_5yr, min_balance")
        .order("savings_rate", { ascending: false })
        .limit(8);

      setGoals(goalsData || []);
      setBankRates(banksData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sample goals if user has none
  const displayGoals = goals.length > 0 ? goals : [
    {
      id: "1",
      name: "Emergency Fund",
      target_amount: 300000,
      current_amount: 180000,
      deadline: "2025-12-31",
      icon: "heart",
      color: null,
      is_completed: false,
    },
    {
      id: "2",
      name: "Dream Vacation",
      target_amount: 200000,
      current_amount: 85000,
      deadline: "2025-06-30",
      icon: "plane",
      color: null,
      is_completed: false,
    },
    {
      id: "3",
      name: "Home Down Payment",
      target_amount: 1000000,
      current_amount: 450000,
      deadline: "2026-12-31",
      icon: "home",
      color: null,
      is_completed: false,
    },
    {
      id: "4",
      name: "Education Fund",
      target_amount: 500000,
      current_amount: 120000,
      deadline: "2027-03-31",
      icon: "graduation",
      color: null,
      is_completed: false,
    },
  ];

  const totalSaved = displayGoals.reduce((acc, goal) => acc + goal.current_amount, 0);
  const totalTarget = displayGoals.reduce((acc, goal) => acc + goal.target_amount, 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Savings Goals</h1>
            <p className="text-muted-foreground mt-1">
              Track your progress towards financial goals
            </p>
          </div>
          <Button variant="gold" className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Goal
          </Button>
        </div>

        {/* Overview */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Saved</p>
                  <p className="text-2xl font-bold text-success">
                    ₹{totalSaved.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Target</p>
                  <p className="text-2xl font-bold">₹{totalTarget.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Progress</p>
                  <p className="text-2xl font-bold">
                    {((totalSaved / totalTarget) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-info/10">
                  <Calendar className="h-6 w-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {displayGoals.map((goal) => {
            const Icon = iconMap[goal.icon || "target"] || Target;
            const percentage = (goal.current_amount / goal.target_amount) * 100;
            const monthlyNeeded = goal.deadline 
              ? Math.round((goal.target_amount - goal.current_amount) / 
                  Math.max(1, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000))))
              : 0;

            return (
              <Card key={goal.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{goal.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Target: {goal.deadline ? new Date(goal.deadline).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "No deadline"}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>

                  <ProgressBar value={goal.current_amount} max={goal.target_amount} className="mb-4" />

                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="text-muted-foreground">Saved</p>
                      <p className="font-semibold text-success">
                        ₹{goal.current_amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">Monthly Needed</p>
                      <p className="font-semibold">
                        ₹{monthlyNeeded.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Target</p>
                      <p className="font-semibold">₹{goal.target_amount.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bank Rates Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Best Savings Account & FD Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Bank
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                      Savings Rate
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                      FD (1 Year)
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                      FD (3 Years)
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                      FD (5 Years)
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                      Min Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bankRates.map((bank) => (
                    <tr
                      key={bank.name}
                      className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-4 px-4 font-medium">{bank.name}</td>
                      <td className="py-4 px-4 text-center text-success font-semibold">
                        {bank.savings_rate}%
                      </td>
                      <td className="py-4 px-4 text-center">{bank.fd_rate_1yr}%</td>
                      <td className="py-4 px-4 text-center">{bank.fd_rate_3yr}%</td>
                      <td className="py-4 px-4 text-center">{bank.fd_rate_5yr}%</td>
                      <td className="py-4 px-4 text-center text-muted-foreground">
                        ₹{(bank.min_balance || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}