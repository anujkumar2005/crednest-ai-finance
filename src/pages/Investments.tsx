import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isJwtExpiredError, retryOnJwtExpired } from "@/lib/supabaseRetry";
import {
  TrendingUp,
  Star,
  Info,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Search,
  Calculator,
  PiggyBank,
  BarChart3,
  IndianRupee,
  Target,
  RefreshCw,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MutualFund {
  id: string;
  name: string;
  fund_type: string;
  amc: string | null;
  logo_url: string | null;
  nav: number | null;
  returns_1yr: number | null;
  returns_3yr: number | null;
  returns_5yr: number | null;
  expense_ratio: number | null;
  min_investment: number | null;
  min_sip: number | null;
  risk_level: string | null;
  rating: number | null;
  aum: number | null;
  features: unknown;
  description: string | null;
  website: string | null;
}

interface LiveFundRate {
  name: string;
  fund_type: string;
  amc: string;
  nav: number;
  returns_1yr: number;
  returns_3yr: number;
  returns_5yr: number;
  expense_ratio: number;
  risk_level: string;
  rating: number;
}

const fundTypes = ["All", "Equity", "Debt", "Hybrid", "Index"];

export default function Investments() {
  const [funds, setFunds] = useState<MutualFund[]>([]);
  const [liveFunds, setLiveFunds] = useState<LiveFundRate[]>([]);
  const [liveUpdated, setLiveUpdated] = useState<string | null>(null);
  const [loadingLive, setLoadingLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sipCalc, setSipCalc] = useState({
    amount: 5000,
    years: 10,
    expectedReturn: 12,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchFunds();
    fetchLiveFunds();
  }, []);

  const fetchFunds = async () => {
    setLoading(true);
    try {
      const { data, error } = await retryOnJwtExpired<MutualFund[]>(() =>
        supabase
          .from("investment_funds")
          .select("*")
          .order("rating", { ascending: false })
      );

      if (error) throw error;
      setFunds(data || []);
    } catch (error: any) {
      console.error("Error fetching funds:", error);

      if (isJwtExpiredError(error)) {
        toast({
          title: "Session expired",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
      } else {
        toast({
          title: "Could not load funds",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveFunds = async () => {
    setLoadingLive(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/live-investment-rates`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch live investment rates");
      }

      const data = await response.json();
      
      if (data.funds && data.funds.length > 0) {
        setLiveFunds(data.funds);
        setLiveUpdated(data.lastUpdated);
        toast({
          title: "Live Rates Updated",
          description: "Investment fund data has been refreshed",
        });
      }
    } catch (error) {
      console.error("Error fetching live funds:", error);
    } finally {
      setLoadingLive(false);
    }
  };

  // SIP Calculator
  const calculateSIP = () => {
    const P = sipCalc.amount;
    const r = sipCalc.expectedReturn / 12 / 100;
    const n = sipCalc.years * 12;
    const futureValue = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const totalInvested = P * n;
    const gains = futureValue - totalInvested;
    return { futureValue, totalInvested, gains };
  };

  const sipResult = calculateSIP();

  // Generate growth chart data
  const generateGrowthData = () => {
    const data = [];
    const P = sipCalc.amount;
    const r = sipCalc.expectedReturn / 12 / 100;
    
    for (let year = 0; year <= sipCalc.years; year++) {
      const n = year * 12;
      const invested = P * n;
      const value = n === 0 ? 0 : P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
      data.push({
        year: `Y${year}`,
        invested: Math.round(invested),
        value: Math.round(value),
      });
    }
    return data;
  };

  const growthData = generateGrowthData();

  const getRiskColor = (risk: string | null) => {
    switch (risk) {
      case "Low":
        return "text-success bg-success/10 border-success/20";
      case "Moderate":
      case "Medium":
        return "text-warning bg-warning/10 border-warning/20";
      case "Moderately High":
      case "High":
        return "text-destructive bg-destructive/10 border-destructive/20";
      default:
        return "text-muted-foreground bg-muted border-muted";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Equity":
        return "text-info bg-info/10";
      case "Debt":
        return "text-success bg-success/10";
      case "Hybrid":
        return "text-primary bg-primary/10";
      case "Index":
        return "text-warning bg-warning/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const filteredFunds = funds
    .filter((fund) => selectedType === "All" || fund.fund_type === selectedType)
    .filter((fund) => fund.name.toLowerCase().includes(searchQuery.toLowerCase()));

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const equityCount = funds.filter((f) => f.fund_type === "Equity").length;
  const hybridCount = funds.filter((f) => f.fund_type === "Hybrid").length;
  const debtCount = funds.filter((f) => f.fund_type === "Debt").length;
  const indexCount = funds.filter((f) => f.fund_type === "Index").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Investment Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Compare {funds.length}+ mutual funds and plan your investments
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-4 gap-4">
          <Card className="glass-card cursor-pointer hover:border-info/30 transition-colors" onClick={() => setSelectedType("Equity")}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-info/10">
                  <TrendingUp className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Equity Funds</p>
                  <p className="text-xl font-bold">{equityCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card cursor-pointer hover:border-success/30 transition-colors" onClick={() => setSelectedType("Debt")}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-success/10">
                  <PiggyBank className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Debt Funds</p>
                  <p className="text-xl font-bold">{debtCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setSelectedType("Hybrid")}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hybrid Funds</p>
                  <p className="text-xl font-bold">{hybridCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card cursor-pointer hover:border-warning/30 transition-colors" onClick={() => setSelectedType("Index")}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-warning/10">
                  <Target className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Index Funds</p>
                  <p className="text-xl font-bold">{indexCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SIP Calculator */}
        <Card className="gold-glow overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              SIP Calculator - Plan Your Wealth
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Inputs */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-primary" />
                      Monthly SIP Amount
                    </label>
                    <span className="text-xl font-bold text-primary">
                      ₹{sipCalc.amount.toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    value={[sipCalc.amount]}
                    onValueChange={(v) => setSipCalc({ ...sipCalc, amount: v[0] })}
                    min={500}
                    max={100000}
                    step={500}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>₹500</span>
                    <span>₹1,00,000</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Investment Period</label>
                    <span className="text-xl font-bold text-primary">{sipCalc.years} Years</span>
                  </div>
                  <Slider
                    value={[sipCalc.years]}
                    onValueChange={(v) => setSipCalc({ ...sipCalc, years: v[0] })}
                    min={1}
                    max={30}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 Year</span>
                    <span>30 Years</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Expected Return (% p.a.)</label>
                    <span className="text-xl font-bold text-primary">{sipCalc.expectedReturn}%</span>
                  </div>
                  <Slider
                    value={[sipCalc.expectedReturn]}
                    onValueChange={(v) => setSipCalc({ ...sipCalc, expectedReturn: v[0] })}
                    min={6}
                    max={25}
                    step={0.5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>6%</span>
                    <span>25%</span>
                  </div>
                </div>

                {/* Results */}
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center p-4 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Invested</p>
                    <p className="text-lg font-bold">₹{Math.round(sipResult.totalInvested).toLocaleString()}</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-success/10">
                    <p className="text-xs text-muted-foreground mb-1">Est. Returns</p>
                    <p className="text-lg font-bold text-success">₹{Math.round(sipResult.gains).toLocaleString()}</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-primary/10">
                    <p className="text-xs text-muted-foreground mb-1">Total Value</p>
                    <p className="text-lg font-bold text-primary">₹{Math.round(sipResult.futureValue).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData}>
                    <defs>
                      <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${(v/100000).toFixed(0)}L`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="invested"
                      stroke="hsl(var(--muted-foreground))"
                      fill="url(#investedGradient)"
                      strokeWidth={2}
                      name="Invested"
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="url(#valueGradient)"
                      strokeWidth={2}
                      name="Value"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Fund Rates Section */}
        {liveFunds.length > 0 && (
          <Card className="border-success/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  Live Market Data - Top Performing Funds
                  <Badge variant="outline" className="gap-1 text-success border-success/30 bg-success/10">
                    <Zap className="h-3 w-3" />
                    Live
                  </Badge>
                </CardTitle>
                {liveUpdated && (
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(liveUpdated).toLocaleString("en-IN")}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLiveFunds}
                disabled={loadingLive}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loadingLive ? "animate-spin" : ""}`} />
                {loadingLive ? "Fetching..." : "Refresh"}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Fund Name</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Type</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">NAV</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">1Y Return</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">3Y Return</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">5Y Return</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveFunds.map((fund, index) => (
                      <tr
                        key={`${fund.name}-${index}`}
                        className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium">{fund.name}</p>
                            <p className="text-xs text-muted-foreground">{fund.amc}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(fund.fund_type)}`}>
                            {fund.fund_type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center font-semibold">₹{fund.nav?.toFixed(2)}</td>
                        <td className={`py-4 px-4 text-center font-semibold ${fund.returns_1yr >= 0 ? "text-success" : "text-destructive"}`}>
                          {fund.returns_1yr >= 0 ? "+" : ""}{fund.returns_1yr}%
                        </td>
                        <td className={`py-4 px-4 text-center font-semibold ${fund.returns_3yr >= 0 ? "text-success" : "text-destructive"}`}>
                          {fund.returns_3yr >= 0 ? "+" : ""}{fund.returns_3yr}%
                        </td>
                        <td className={`py-4 px-4 text-center font-semibold ${fund.returns_5yr >= 0 ? "text-success" : "text-destructive"}`}>
                          {fund.returns_5yr >= 0 ? "+" : ""}{fund.returns_5yr}%
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < fund.rating ? "text-primary fill-primary" : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search mutual funds..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Tabs value={selectedType} onValueChange={setSelectedType}>
            <TabsList className="bg-secondary">
              {fundTypes.map((type) => (
                <TabsTrigger key={type} value={type}>
                  {type}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Funds Grid */}
        <div className="space-y-4">
          {filteredFunds.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No funds found</p>
            </Card>
          ) : (
            filteredFunds.map((fund, index) => (
              <Card key={fund.id} className={`hover:border-primary/30 transition-colors ${index === 0 ? "border-success/50 bg-success/5" : ""}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Fund Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{fund.name}</h3>
                        {index === 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-medium flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Top Pick
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{fund.amc}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(fund.fund_type)}`}>
                          {fund.fund_type}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(fund.risk_level)}`}>
                          {fund.risk_level} Risk
                        </span>
                        <div className="flex items-center gap-0.5 ml-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < (fund.rating || 0)
                                  ? "text-primary fill-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Returns */}
                    <div className="flex flex-wrap gap-4 lg:gap-6">
                      <div className="text-center min-w-[70px]">
                        <p className="text-xs text-muted-foreground mb-1">NAV</p>
                        <p className="text-lg font-semibold">₹{fund.nav?.toFixed(2)}</p>
                      </div>
                      <div className="text-center min-w-[70px]">
                        <p className="text-xs text-muted-foreground mb-1">1Y Return</p>
                        <p className={`text-lg font-semibold ${(fund.returns_1yr || 0) >= 0 ? "text-success" : "text-destructive"}`}>
                          {(fund.returns_1yr || 0) >= 0 ? "+" : ""}{fund.returns_1yr}%
                        </p>
                      </div>
                      <div className="text-center min-w-[70px]">
                        <p className="text-xs text-muted-foreground mb-1">3Y Return</p>
                        <p className={`text-lg font-semibold ${(fund.returns_3yr || 0) >= 0 ? "text-success" : "text-destructive"}`}>
                          {(fund.returns_3yr || 0) >= 0 ? "+" : ""}{fund.returns_3yr}%
                        </p>
                      </div>
                      <div className="text-center min-w-[70px]">
                        <p className="text-xs text-muted-foreground mb-1">5Y Return</p>
                        <p className={`text-lg font-semibold ${(fund.returns_5yr || 0) >= 0 ? "text-success" : "text-destructive"}`}>
                          {(fund.returns_5yr || 0) >= 0 ? "+" : ""}{fund.returns_5yr}%
                        </p>
                      </div>
                      <div className="text-center min-w-[70px]">
                        <p className="text-xs text-muted-foreground mb-1">Expense</p>
                        <p className="text-lg font-semibold">{fund.expense_ratio}%</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Info className="h-4 w-4" />
                        Details
                      </Button>
                      <Button
                        variant="gold"
                        size="sm"
                        className="gap-1"
                        onClick={() => window.open(fund.website || "#", "_blank")}
                      >
                        Invest
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Details Row */}
                  <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Min Investment: <span className="text-foreground font-medium">₹{fund.min_investment?.toLocaleString()}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Min SIP: <span className="text-foreground font-medium">₹{fund.min_sip?.toLocaleString()}</span>
                    </span>
                    {fund.aum && (
                      <span className="text-muted-foreground">
                        AUM: <span className="text-foreground font-medium">₹{(fund.aum / 10000000).toFixed(0)} Cr</span>
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
