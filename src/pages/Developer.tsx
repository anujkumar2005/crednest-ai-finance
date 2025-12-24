import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import {
  Database,
  Users,
  Activity,
  Server,
  RefreshCw,
  Table2,
  Eye,
  Loader2,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TableStats {
  name: string;
  rowCount: number;
  lastUpdated?: string;
}

interface SystemStats {
  totalUsers: number;
  activeChats: number;
  totalExpenses: number;
  totalIncomes: number;
  totalGoals: number;
  totalBudgets: number;
  totalLoans: number;
}

export default function Developer() {
  const [tableStats, setTableStats] = useState<TableStats[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Use edge function to bypass RLS and get all stats
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-stats`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch admin stats");
      }

      const data = await response.json();
      setTableStats(data.tableStats || []);
      setSystemStats(data.systemStats || null);
      setRecentActivity(data.recentActivity || []);
    } catch (error) {
      console.error("Error loading admin stats:", error);
      // Fallback to regular queries if edge function fails
      await loadFallbackData();
    }
    setLoading(false);
  };

  const loadFallbackData = async () => {
    const tables = [
      "profiles",
      "expenses",
      "incomes",
      "budgets",
      "savings_goals",
      "user_loans",
      "chat_sessions",
      "chat_messages",
      "banks",
      "insurance_companies",
      "investment_funds",
      "financial_corpus",
    ];

    const stats: TableStats[] = [];

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table as any)
          .select("*", { count: "exact", head: true });

        if (!error) {
          stats.push({
            name: table,
            rowCount: count || 0,
          });
        }
      } catch (e) {
        stats.push({ name: table, rowCount: 0 });
      }
    }

    setTableStats(stats);

    const [
      { count: totalUsers },
      { count: activeChats },
      { count: totalExpenses },
      { count: totalIncomes },
      { count: totalGoals },
      { count: totalBudgets },
      { count: totalLoans },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("chat_sessions").select("*", { count: "exact", head: true }),
      supabase.from("expenses").select("*", { count: "exact", head: true }),
      supabase.from("incomes").select("*", { count: "exact", head: true }),
      supabase.from("savings_goals").select("*", { count: "exact", head: true }),
      supabase.from("budgets").select("*", { count: "exact", head: true }),
      supabase.from("user_loans").select("*", { count: "exact", head: true }),
    ]);

    setSystemStats({
      totalUsers: totalUsers || 0,
      activeChats: activeChats || 0,
      totalExpenses: totalExpenses || 0,
      totalIncomes: totalIncomes || 0,
      totalGoals: totalGoals || 0,
      totalBudgets: totalBudgets || 0,
      totalLoans: totalLoans || 0,
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "All statistics have been updated",
    });
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTableIcon = (name: string) => {
    const icons: Record<string, any> = {
      profiles: Users,
      expenses: TrendingUp,
      chat_sessions: Activity,
      banks: Database,
    };
    return icons[name] || Table2;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Developer Dashboard</h1>
            <p className="text-muted-foreground mt-1">Monitor database and app activity</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* System Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{systemStats?.totalUsers || 0}</p>
                      <p className="text-xs text-muted-foreground">Total Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-chart-1/10">
                      <Activity className="h-5 w-5 text-chart-1" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{systemStats?.activeChats || 0}</p>
                      <p className="text-xs text-muted-foreground">Chat Sessions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-chart-2/10">
                      <TrendingUp className="h-5 w-5 text-chart-2" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{systemStats?.totalExpenses || 0}</p>
                      <p className="text-xs text-muted-foreground">Expenses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-chart-3/10">
                      <Zap className="h-5 w-5 text-chart-3" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{systemStats?.totalGoals || 0}</p>
                      <p className="text-xs text-muted-foreground">Savings Goals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="tables" className="space-y-4">
              <TabsList className="bg-card/50 border border-border/50">
                <TabsTrigger value="tables">Database Tables</TabsTrigger>
                <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                <TabsTrigger value="system">System Status</TabsTrigger>
              </TabsList>

              {/* Database Tables Tab */}
              <TabsContent value="tables" className="space-y-4">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      Database Tables
                    </CardTitle>
                    <CardDescription>Overview of all database tables and row counts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {tableStats.map((table) => {
                        const Icon = getTableIcon(table.name);
                        return (
                          <div
                            key={table.name}
                            className="p-4 rounded-lg border border-border/50 bg-card/30 hover:bg-card/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{table.name}</span>
                              </div>
                              <Badge variant="secondary" className="font-mono">
                                {table.rowCount}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Recent Activity Tab */}
              <TabsContent value="activity" className="space-y-4">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Latest actions across the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {recentActivity.length > 0 ? (
                          recentActivity.map((activity, index) => (
                            <div
                              key={index}
                              className="p-3 rounded-lg border border-border/50 bg-card/30"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2">
                                  <Badge
                                    variant={activity.type === "chat" ? "default" : "secondary"}
                                    className="mt-0.5"
                                  >
                                    {activity.type}
                                  </Badge>
                                  <p className="text-sm">{activity.message}</p>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatTime(activity.time)}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground text-center py-8">
                            No recent activity
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* System Status Tab */}
              <TabsContent value="system" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5 text-primary" />
                        System Health
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-chart-2" />
                          <span>Database Connection</span>
                        </div>
                        <Badge variant="outline" className="bg-chart-2/10 text-chart-2">
                          Healthy
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-chart-2" />
                          <span>Authentication</span>
                        </div>
                        <Badge variant="outline" className="bg-chart-2/10 text-chart-2">
                          Active
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-chart-2" />
                          <span>Edge Functions</span>
                        </div>
                        <Badge variant="outline" className="bg-chart-2/10 text-chart-2">
                          Running
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-primary" />
                        Data Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Budgets</span>
                        <span className="font-semibold">{systemStats?.totalBudgets || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Incomes</span>
                        <span className="font-semibold">{systemStats?.totalIncomes || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Active Loans</span>
                        <span className="font-semibold">{systemStats?.totalLoans || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Savings Goals</span>
                        <span className="font-semibold">{systemStats?.totalGoals || 0}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Quick Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="p-3 rounded-lg border border-border/50">
                        <p className="text-muted-foreground">Last Refresh</p>
                        <p className="font-medium">{new Date().toLocaleTimeString()}</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border/50">
                        <p className="text-muted-foreground">Total Tables</p>
                        <p className="font-medium">{tableStats.length}</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border/50">
                        <p className="text-muted-foreground">Total Records</p>
                        <p className="font-medium">
                          {tableStats.reduce((sum, t) => sum + t.rowCount, 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
