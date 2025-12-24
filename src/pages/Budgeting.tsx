import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
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
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface BudgetCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  planned: number;
  spent: number;
}

const defaultCategories: BudgetCategory[] = [
  { id: "1", name: "Food & Dining", icon: Utensils, color: "bg-destructive", planned: 12000, spent: 8500 },
  { id: "2", name: "Transportation", icon: Car, color: "bg-info", planned: 5000, spent: 3200 },
  { id: "3", name: "Shopping", icon: ShoppingBag, color: "bg-success", planned: 6000, spent: 4500 },
  { id: "4", name: "Entertainment", icon: Tv, color: "bg-warning", planned: 3000, spent: 2100 },
  { id: "5", name: "Bills & Utilities", icon: Lightbulb, color: "bg-chart-4", planned: 8000, spent: 7800 },
  { id: "6", name: "Healthcare", icon: Heart, color: "bg-pink-500", planned: 2000, spent: 500 },
  { id: "7", name: "Education", icon: GraduationCap, color: "bg-chart-2", planned: 5000, spent: 3000 },
  { id: "8", name: "Rent/EMI", icon: Home, color: "bg-primary", planned: 25000, spent: 25000 },
  { id: "9", name: "Savings", icon: PiggyBank, color: "bg-success", planned: 15000, spent: 15000 },
  { id: "10", name: "Others", icon: MoreHorizontal, color: "bg-muted-foreground", planned: 4000, spent: 2400 },
];

export default function Budgeting() {
  const [categories, setCategories] = useState<BudgetCategory[]>(defaultCategories);
  const [newExpense, setNewExpense] = useState({ category: "", amount: "", description: "" });
  const { toast } = useToast();

  const totalPlanned = categories.reduce((acc, cat) => acc + cat.planned, 0);
  const totalSpent = categories.reduce((acc, cat) => acc + cat.spent, 0);
  const remaining = totalPlanned - totalSpent;

  const handleAddExpense = () => {
    if (!newExpense.category || !newExpense.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === newExpense.category
          ? { ...cat, spent: cat.spent + parseFloat(newExpense.amount) }
          : cat
      )
    );

    toast({
      title: "Expense Added",
      description: `₹${parseFloat(newExpense.amount).toLocaleString()} added to ${
        categories.find((c) => c.id === newExpense.category)?.name
      }`,
    });

    setNewExpense({ category: "", amount: "", description: "" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Budgeting</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage your monthly budget
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="gold" className="gap-2">
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
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, category: e.target.value })
                    }
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
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, amount: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Input
                    placeholder="What was this expense for?"
                    value={newExpense.description}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, description: e.target.value })
                    }
                  />
                </div>
                <Button variant="gold" className="w-full" onClick={handleAddExpense}>
                  Add Expense
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

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
            <ProgressBar value={totalSpent} max={totalPlanned} showLabel />
          </CardContent>
        </Card>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const percentage = (category.spent / category.planned) * 100;
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
                    max={category.planned}
                    variant={isOverBudget ? "danger" : percentage >= 75 ? "warning" : "default"}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
