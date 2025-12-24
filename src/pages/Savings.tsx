import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  Plus,
  Target,
  Calendar,
  TrendingUp,
  Plane,
  Home,
  GraduationCap,
  Car,
  Heart,
  Gift,
} from "lucide-react";

interface SavingsGoal {
  id: string;
  name: string;
  icon: React.ElementType;
  target: number;
  saved: number;
  deadline: string;
  monthlyContribution: number;
}

const savingsGoals: SavingsGoal[] = [
  {
    id: "1",
    name: "Emergency Fund",
    icon: Heart,
    target: 300000,
    saved: 180000,
    deadline: "Dec 2025",
    monthlyContribution: 15000,
  },
  {
    id: "2",
    name: "Dream Vacation",
    icon: Plane,
    target: 200000,
    saved: 85000,
    deadline: "Jun 2025",
    monthlyContribution: 20000,
  },
  {
    id: "3",
    name: "Home Down Payment",
    icon: Home,
    target: 1000000,
    saved: 450000,
    deadline: "Dec 2026",
    monthlyContribution: 25000,
  },
  {
    id: "4",
    name: "Education Fund",
    icon: GraduationCap,
    target: 500000,
    saved: 120000,
    deadline: "Mar 2027",
    monthlyContribution: 10000,
  },
];

interface BankRate {
  name: string;
  savingsRate: number;
  fdRate1yr: number;
  fdRate3yr: number;
  fdRate5yr: number;
  minBalance: number;
  rating: number;
}

const bankRates: BankRate[] = [
  { name: "SBI", savingsRate: 2.7, fdRate1yr: 6.8, fdRate3yr: 7.0, fdRate5yr: 6.5, minBalance: 3000, rating: 4.5 },
  { name: "HDFC Bank", savingsRate: 3.0, fdRate1yr: 6.6, fdRate3yr: 7.0, fdRate5yr: 7.0, minBalance: 10000, rating: 4.7 },
  { name: "ICICI Bank", savingsRate: 3.0, fdRate1yr: 6.7, fdRate3yr: 7.0, fdRate5yr: 7.0, minBalance: 10000, rating: 4.6 },
  { name: "Axis Bank", savingsRate: 3.0, fdRate1yr: 6.7, fdRate3yr: 7.1, fdRate5yr: 7.0, minBalance: 10000, rating: 4.4 },
  { name: "Kotak Bank", savingsRate: 3.5, fdRate1yr: 6.2, fdRate3yr: 6.4, fdRate5yr: 6.5, minBalance: 0, rating: 4.3 },
  { name: "IndusInd Bank", savingsRate: 4.0, fdRate1yr: 7.25, fdRate3yr: 7.5, fdRate5yr: 7.25, minBalance: 10000, rating: 4.2 },
];

export default function Savings() {
  const totalSaved = savingsGoals.reduce((acc, goal) => acc + goal.saved, 0);
  const totalTarget = savingsGoals.reduce((acc, goal) => acc + goal.target, 0);

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
          {savingsGoals.map((goal) => {
            const Icon = goal.icon;
            const percentage = (goal.saved / goal.target) * 100;

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
                          Target: {goal.deadline}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>

                  <ProgressBar value={goal.saved} max={goal.target} className="mb-4" />

                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="text-muted-foreground">Saved</p>
                      <p className="font-semibold text-success">
                        ₹{goal.saved.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">Monthly</p>
                      <p className="font-semibold">
                        ₹{goal.monthlyContribution.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Target</p>
                      <p className="font-semibold">₹{goal.target.toLocaleString()}</p>
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
            <CardTitle>Best Savings Account Rates</CardTitle>
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
                        {bank.savingsRate}%
                      </td>
                      <td className="py-4 px-4 text-center">{bank.fdRate1yr}%</td>
                      <td className="py-4 px-4 text-center">{bank.fdRate3yr}%</td>
                      <td className="py-4 px-4 text-center">{bank.fdRate5yr}%</td>
                      <td className="py-4 px-4 text-center text-muted-foreground">
                        ₹{bank.minBalance.toLocaleString()}
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
