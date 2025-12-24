import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Car,
  Gift,
  Smartphone,
  Briefcase,
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
  car: Car,
  gift: Gift,
  smartphone: Smartphone,
  briefcase: Briefcase,
};

const iconOptions = [
  { name: "heart", label: "Emergency Fund", icon: Heart },
  { name: "plane", label: "Vacation", icon: Plane },
  { name: "home", label: "Home", icon: Home },
  { name: "graduation", label: "Education", icon: GraduationCap },
  { name: "car", label: "Vehicle", icon: Car },
  { name: "gift", label: "Gift/Event", icon: Gift },
  { name: "smartphone", label: "Gadget", icon: Smartphone },
  { name: "briefcase", label: "Business", icon: Briefcase },
  { name: "target", label: "Other", icon: Target },
];

export default function Savings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [bankRates, setBankRates] = useState<BankRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [addSavingsOpen, setAddSavingsOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: "",
    target_amount: "",
    deadline: "",
    icon: "target",
  });
  const [newSavings, setNewSavings] = useState({
    goal_id: "",
    amount: "",
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch user's savings goals
      const { data: goalsData, error: goalsError } = await supabase
        .from("savings_goals")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (goalsError) throw goalsError;

      // Fetch bank rates for comparison
      const { data: banksData, error: banksError } = await supabase
        .from("banks")
        .select("name, savings_rate, fd_rate_1yr, fd_rate_3yr, fd_rate_5yr, min_balance")
        .order("savings_rate", { ascending: false })
        .limit(8);

      if (banksError) throw banksError;

      setGoals(goalsData || []);
      setBankRates(banksData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load savings data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.name || !newGoal.target_amount) {
      toast({
        title: "Error",
        description: "Please fill in goal name and target amount",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("savings_goals")
        .insert({
          user_id: user?.id,
          name: newGoal.name,
          target_amount: parseFloat(newGoal.target_amount),
          current_amount: 0,
          deadline: newGoal.deadline || null,
          icon: newGoal.icon,
          is_completed: false,
        })
        .select()
        .single();

      if (error) throw error;

      setGoals((prev) => [data, ...prev]);

      toast({
        title: "Goal Created",
        description: `${newGoal.name} goal has been added`,
      });

      setNewGoal({ name: "", target_amount: "", deadline: "", icon: "target" });
      setAddGoalOpen(false);
    } catch (error) {
      console.error("Error adding goal:", error);
      toast({
        title: "Error",
        description: "Failed to create goal",
        variant: "destructive",
      });
    }
  };

  const handleAddSavings = async () => {
    if (!newSavings.goal_id || !newSavings.amount) {
      toast({
        title: "Error",
        description: "Please select a goal and enter amount",
        variant: "destructive",
      });
      return;
    }

    const goal = goals.find((g) => g.id === newSavings.goal_id);
    if (!goal) return;

    const addAmount = parseFloat(newSavings.amount);
    const newCurrentAmount = (goal.current_amount || 0) + addAmount;
    const isCompleted = newCurrentAmount >= goal.target_amount;

    try {
      const { error } = await supabase
        .from("savings_goals")
        .update({
          current_amount: newCurrentAmount,
          is_completed: isCompleted,
        })
        .eq("id", goal.id);

      if (error) throw error;

      setGoals((prev) =>
        prev.map((g) =>
          g.id === goal.id
            ? { ...g, current_amount: newCurrentAmount, is_completed: isCompleted }
            : g
        )
      );

      toast({
        title: "Savings Added",
        description: `₹${addAmount.toLocaleString()} added to ${goal.name}${isCompleted ? " - Goal Completed! 🎉" : ""}`,
      });

      setNewSavings({ goal_id: "", amount: "" });
      setAddSavingsOpen(false);
    } catch (error) {
      console.error("Error adding savings:", error);
      toast({
        title: "Error",
        description: "Failed to add savings",
        variant: "destructive",
      });
    }
  };

  const totalSaved = goals.reduce((acc, goal) => acc + (goal.current_amount || 0), 0);
  const totalTarget = goals.reduce((acc, goal) => acc + goal.target_amount, 0);

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
          <div className="flex gap-2">
            <Dialog open={addSavingsOpen} onOpenChange={setAddSavingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2" disabled={goals.length === 0}>
                  <TrendingUp className="h-4 w-4" />
                  Add Savings
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Add to Savings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Goal</label>
                    <select
                      className="w-full h-11 rounded-lg border border-border/50 bg-card/50 px-4 py-2 text-base"
                      value={newSavings.goal_id}
                      onChange={(e) => setNewSavings({ ...newSavings, goal_id: e.target.value })}
                    >
                      <option value="">Select goal</option>
                      {goals
                        .filter((g) => !g.is_completed)
                        .map((goal) => (
                          <option key={goal.id} value={goal.id}>
                            {goal.name} (₹{(goal.current_amount || 0).toLocaleString()} / ₹{goal.target_amount.toLocaleString()})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount (₹)</label>
                    <Input
                      type="number"
                      placeholder="Enter amount to add"
                      value={newSavings.amount}
                      onChange={(e) => setNewSavings({ ...newSavings, amount: e.target.value })}
                    />
                  </div>
                  <Button variant="gold" className="w-full" onClick={handleAddSavings}>
                    Add Savings
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={addGoalOpen} onOpenChange={setAddGoalOpen}>
              <DialogTrigger asChild>
                <Button variant="gold" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add New Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Create New Savings Goal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Goal Name</label>
                    <Input
                      placeholder="e.g., Dream Vacation, New Car"
                      value={newGoal.name}
                      onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Target Amount (₹)</label>
                    <Input
                      type="number"
                      placeholder="Enter target amount"
                      value={newGoal.target_amount}
                      onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Target Date (Optional)</label>
                    <Input
                      type="date"
                      value={newGoal.deadline}
                      onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Icon</label>
                    <div className="grid grid-cols-5 gap-2">
                      {iconOptions.map((opt) => {
                        const IconComp = opt.icon;
                        return (
                          <button
                            key={opt.name}
                            type="button"
                            onClick={() => setNewGoal({ ...newGoal, icon: opt.name })}
                            className={`p-3 rounded-lg border transition-colors ${
                              newGoal.icon === opt.name
                                ? "border-primary bg-primary/10"
                                : "border-border/50 hover:border-primary/50"
                            }`}
                            title={opt.label}
                          >
                            <IconComp className="h-5 w-5 mx-auto" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Button variant="gold" className="w-full" onClick={handleAddGoal}>
                    Create Goal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Empty State */}
        {goals.length === 0 && (
          <Card className="glass-card">
            <CardContent className="pt-6 text-center py-12">
              <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Savings Goals Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first savings goal to start tracking progress
              </p>
              <Button variant="gold" onClick={() => setAddGoalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Goal
              </Button>
            </CardContent>
          </Card>
        )}

        {goals.length > 0 && (
          <>
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
                        {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}%
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
              {goals.map((goal) => {
                const Icon = iconMap[goal.icon || "target"] || Target;
                const percentage = goal.target_amount > 0 
                  ? ((goal.current_amount || 0) / goal.target_amount) * 100 
                  : 0;
                const monthlyNeeded = goal.deadline
                  ? Math.round(
                      (goal.target_amount - (goal.current_amount || 0)) /
                        Math.max(
                          1,
                          Math.ceil(
                            (new Date(goal.deadline).getTime() - Date.now()) /
                              (30 * 24 * 60 * 60 * 1000)
                          )
                        )
                    )
                  : 0;

                return (
                  <Card
                    key={goal.id}
                    className={`hover:border-primary/30 transition-colors ${
                      goal.is_completed ? "border-success/50 bg-success/5" : ""
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-primary/10">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              {goal.name}
                              {goal.is_completed && (
                                <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                                  Completed
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Target:{" "}
                              {goal.deadline
                                ? new Date(goal.deadline).toLocaleDateString("en-IN", {
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "No deadline"}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-primary">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>

                      <ProgressBar
                        value={goal.current_amount || 0}
                        max={goal.target_amount || 1}
                        className="mb-4"
                      />

                      <div className="flex justify-between text-sm">
                        <div>
                          <p className="text-muted-foreground">Saved</p>
                          <p className="font-semibold text-success">
                            ₹{(goal.current_amount || 0).toLocaleString()}
                          </p>
                        </div>
                        {!goal.is_completed && monthlyNeeded > 0 && (
                          <div className="text-center">
                            <p className="text-muted-foreground">Monthly Needed</p>
                            <p className="font-semibold">₹{monthlyNeeded.toLocaleString()}</p>
                          </div>
                        )}
                        <div className="text-right">
                          <p className="text-muted-foreground">Target</p>
                          <p className="font-semibold">
                            ₹{goal.target_amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Bank Rates Comparison */}
        {bankRates.length > 0 && (
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
                          {bank.savings_rate ?? "-"}%
                        </td>
                        <td className="py-4 px-4 text-center">
                          {bank.fd_rate_1yr ?? "-"}%
                        </td>
                        <td className="py-4 px-4 text-center">
                          {bank.fd_rate_3yr ?? "-"}%
                        </td>
                        <td className="py-4 px-4 text-center">
                          {bank.fd_rate_5yr ?? "-"}%
                        </td>
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
        )}
      </div>
    </DashboardLayout>
  );
}
