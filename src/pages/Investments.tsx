import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp,
  Star,
  Info,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";

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

export default function Investments() {
  const [funds, setFunds] = useState<MutualFund[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFunds();
  }, []);

  const fetchFunds = async () => {
    try {
      const { data, error } = await supabase
        .from("investment_funds")
        .select("*")
        .order("rating", { ascending: false });

      if (error) throw error;
      setFunds(data || []);
    } catch (error) {
      console.error("Error fetching funds:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string | null) => {
    switch (risk) {
      case "Low":
        return "text-success bg-success/10";
      case "Moderate":
      case "Medium":
        return "text-warning bg-warning/10";
      case "Moderately High":
      case "High":
        return "text-destructive bg-destructive/10";
      default:
        return "text-muted-foreground bg-muted";
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
      default:
        return "text-muted-foreground bg-muted";
    }
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Investment Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Compare {funds.length}+ mutual funds and track returns
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="glass-card">
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
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hybrid Funds</p>
                  <p className="text-xl font-bold">{hybridCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-success/10">
                  <AlertTriangle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Debt Funds</p>
                  <p className="text-xl font-bold">{debtCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funds Grid */}
        <div className="space-y-4">
          {funds.map((fund) => (
            <Card key={fund.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Fund Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{fund.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                          fund.fund_type
                        )}`}
                      >
                        {fund.fund_type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRiskColor(
                          fund.risk_level
                        )}`}
                      >
                        {fund.risk_level} Risk
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{fund.amc}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < (fund.rating || 0)
                              ? "text-primary fill-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Returns */}
                  <div className="flex flex-wrap gap-6">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">NAV</p>
                      <p className="text-lg font-semibold">₹{fund.nav?.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">1Y Return</p>
                      <p className="text-lg font-semibold text-success">
                        +{fund.returns_1yr}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">3Y Return</p>
                      <p className="text-lg font-semibold text-success">
                        +{fund.returns_3yr}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">5Y Return</p>
                      <p className="text-lg font-semibold text-success">
                        +{fund.returns_5yr}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Expense</p>
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
                    Min Investment:{" "}
                    <span className="text-foreground font-medium">
                      ₹{fund.min_investment?.toLocaleString()}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    Min SIP:{" "}
                    <span className="text-foreground font-medium">
                      ₹{fund.min_sip?.toLocaleString()}
                    </span>
                  </span>
                  {fund.aum && (
                    <span className="text-muted-foreground">
                      AUM:{" "}
                      <span className="text-foreground font-medium">
                        ₹{(fund.aum / 10000000000).toFixed(0)}K Cr
                      </span>
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}