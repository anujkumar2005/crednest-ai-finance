import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus,
  Utensils,
  Car,
  ShoppingBag,
  Tv,
  Lightbulb,
  Heart,
  GraduationCap,
  Home,
  PiggyBank,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  planned: number;
  spent: number;
}

const iconMap: Record<string, React.ElementType> = {
  Utensils: Utensils,
  Car: Car,
  ShoppingBag: ShoppingBag,
  Tv: Tv,
  Lightbulb: Lightbulb,
  Heart: Heart,
  GraduationCap: GraduationCap,
  Home: Home,
  PiggyBank: PiggyBank,
  MoreHorizontal: MoreHorizontal,
};

const defaultCategoryOptions = [
  { name: "Food & Dining", icon: "Utensils", color: "bg-destructive" },
  { name: "Transportation", icon: "Car", color: "bg-info" },
  { name: "Shopping", icon: "ShoppingBag", color: "bg-success" },
  { name: "Entertainment", icon: "Tv", color: "bg-warning" },
  { name: "Bills & Utilities", icon: "Lightbulb", color: "bg-chart-4" },
  { name: "Healthcare", icon: "Heart", color: "bg-pink-500" },
  { name: "Education", icon: "GraduationCap", color: "bg-chart-2" },
  { name: "Rent/EMI", icon: "Home", color: "bg-primary" },
  { name: "Savings", icon: "PiggyBank", color: "bg-success" },
  { name: "Others", icon: "MoreHorizontal", color: "bg-muted-foreground" },
];

export default function Budgeting() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newExpense, setNewExpense] = useState({ category: "", amount: "", description: "" });
  const [newBudget, setNewBudget] = useState({ category: "", amount: "" });
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [addBudgetOpen, setAddBudgetOpen] = useState(false);
  const { toast } = useToast();

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

  useEffect(() => {
    if (user) {
      fetchBudgets();
    }
  }, [user]);

  const fetchBudgets = async () => {
    try {
      const { data: budgetsData, error: budgetsError } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user?.id)
        .eq("month", currentMonth);

      if (budgetsError) throw budgetsError;

      const formattedCategories: BudgetCategory[] = (budgetsData || []).map((b) => ({
        id: b.id,
        name: b.category,
        icon: b.icon || "MoreHorizontal",
        color: b.color || "bg-primary",
        planned: Number(b.planned_amount) || 0,
        spent: Number(b.spent_amount) || 0,
      }));

      setCategories(formattedCategories);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      toast({
        title: "Error",
        description: "Failed to load budgets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudget = async () => {
    if (!newBudget.category || !newBudget.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const selectedCategory = defaultCategoryOptions.find((c) => c.name === newBudget.category);
    if (!selectedCategory) {
      toast({
        title: "Error",
        description: "Please select a valid category",
        variant: "destructive",
      });
      return;
    }

    // Check if budget already exists for this category
    const existingBudget = categories.find((c) => c.name === newBudget.category);
    if (existingBudget) {
      toast({
        title: "Error",
        description: "Budget already exists for this category. Add expense instead.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("budgets")
        .insert({
          user_id: user?.id,
          category: selectedCategory.name,
          planned_amount: parseFloat(newBudget.amount),
          spent_amount: 0,
          month: currentMonth,
          icon: selectedCategory.icon,
          color: selectedCategory.color,
        })
        .select()
        .single();

      if (error) throw error;

      setCategories((prev) => [
        ...prev,
        {
          id: data.id,
          name: data.category,
          icon: data.icon || "MoreHorizontal",
          color: data.color || "bg-primary",
          planned: Number(data.planned_amount) || 0,
          spent: Number(data.spent_amount) || 0,
        },
      ]);

      toast({
        title: "Budget Added",
        description: `₹${parseFloat(newBudget.amount).toLocaleString()} budget set for ${selectedCategory.name}`,
      });

      setNewBudget({ category: "", amount: "" });
      setAddBudgetOpen(false);
    } catch (error) {
      console.error("Error adding budget:", error);
      toast({
        title: "Error",
        description: "Failed to add budget",
        variant: "destructive",
      });
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.category || !newExpense.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const category = categories.find((c) => c.id === newExpense.category);
    if (!category) {
      toast({
        title: "Error",
        description: "Please select a valid category",
        variant: "destructive",
      });
      return;
    }

    const expenseAmount = parseFloat(newExpense.amount);
    const newSpent = category.spent + expenseAmount;

    try {
      // Update budget spent amount
      const { error: budgetError } = await supabase
        .from("budgets")
        .update({ spent_amount: newSpent })
        .eq("id", category.id);

      if (budgetError) throw budgetError;

      // Also record the expense in expenses table
      const { error: expenseError } = await supabase
        .from("expenses")
        .insert({
          user_id: user?.id,
          category: category.name,
          amount: expenseAmount,
          description: newExpense.description || null,
          date: new Date().toISOString().split('T')[0],
        });

      if (expenseError) throw expenseError;

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === newExpense.category ? { ...cat, spent: newSpent } : cat
        )
      );

      toast({
        title: "Expense Added",
        description: `₹${expenseAmount.toLocaleString()} added to ${category.name}`,
      });

      setNewExpense({ category: "", amount: "", description: "" });
      setAddExpenseOpen(false);
    } catch (error) {
      console.error("Error adding expense:", error);
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      });
    }
  };

  const totalPlanned = categories.reduce((acc, cat) => acc + cat.planned, 0);
  const totalSpent = categories.reduce((acc, cat) => acc + cat.spent, 0);
  const remaining = totalPlanned - totalSpent;

  // Get categories that haven't been added as budgets yet
  const availableCategories = defaultCategoryOptions.filter(
    (opt) => !categories.find((c) => c.name === opt.name)
  );

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
            <h1 className="text-3xl font-bold">Budgeting</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage your monthly budget for {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={addBudgetOpen} onOpenChange={setAddBudgetOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Budget
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Add New Budget Category</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <select
                      className="w-full h-11 rounded-lg border border-border/50 bg-card/50 px-4 py-2 text-base"
                      value={newBudget.category}
                      onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                    >
                      <option value="">Select category</option>
                      {availableCategories.map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Budget Amount (₹)</label>
                    <Input
                      type="number"
                      placeholder="Enter planned budget"
                      value={newBudget.amount}
                      onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                    />
                  </div>
                  <Button variant="gold" className="w-full" onClick={handleAddBudget}>
                    Add Budget
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
              <DialogTrigger asChild>
                <Button variant="gold" className="gap-2" disabled={categories.length === 0}>
                  <Plus className="h-4 w-4" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Add New Expense</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <select
                      className="w-full h-11 rounded-lg border border-border/50 bg-card/50 px-4 py-2 text-base"
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount (₹)</label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description (Optional)</label>
                    <Input
                      placeholder="What was this expense for?"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    />
                  </div>
                  <Button variant="gold" className="w-full" onClick={handleAddExpense}>
                    Add Expense
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <Card className="glass-card">
            <CardContent className="pt-6 text-center py-12">
              <PiggyBank className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Budgets Set</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding budget categories for this month
              </p>
              <Button variant="gold" onClick={() => setAddBudgetOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Budget
              </Button>
            </CardContent>
          </Card>
        )}

        {categories.length > 0 && (
          <>
            {/* Overview Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Budget</p>
                      <p className="text-2xl font-bold">₹{totalPlanned.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-primary/10">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                      <p className="text-2xl font-bold">₹{totalSpent.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-destructive/10">
                      <TrendingDown className="h-6 w-6 text-destructive" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className={`text-2xl font-bold ${remaining >= 0 ? "text-success" : "text-destructive"}`}>
                        ₹{remaining.toLocaleString()}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${remaining >= 0 ? "bg-success/10" : "bg-destructive/10"}`}>
                      <PiggyBank className={`h-6 w-6 ${remaining >= 0 ? "text-success" : "text-destructive"}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Overall Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Budget Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressBar value={totalSpent} max={totalPlanned || 1} showLabel />
              </CardContent>
            </Card>

            {/* Categories Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {categories.map((category) => {
                const Icon = iconMap[category.icon] || MoreHorizontal;
                const percentage = category.planned > 0 ? (category.spent / category.planned) * 100 : 0;
                const isOverBudget = percentage > 100;

                return (
                  <Card key={category.id} className="hover:border-primary/30 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl ${category.color}/20`}>
                            <Icon className={`h-5 w-5 ${category.color.replace("bg-", "text-")}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold">{category.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              ₹{category.spent.toLocaleString()} of ₹{category.planned.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-sm font-medium px-2 py-1 rounded-full ${
                            isOverBudget
                              ? "bg-destructive/20 text-destructive"
                              : percentage >= 75
                              ? "bg-warning/20 text-warning"
                              : "bg-success/20 text-success"
                          }`}
                        >
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                      <ProgressBar
                        value={category.spent}
                        max={category.planned || 1}
                        variant={isOverBudget ? "danger" : percentage >= 75 ? "warning" : "default"}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
