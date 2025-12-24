import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Star,
  Info,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface MutualFund {
  id: string;
  name: string;
  amc: string;
  type: "Equity" | "Debt" | "Hybrid";
  nav: number;
  return1yr: number;
  return3yr: number;
  return5yr: number;
  expenseRatio: number;
  minInvestment: number;
  minSIP: number;
  riskLevel: "Low" | "Medium" | "High";
  rating: number;
}

const mutualFunds: MutualFund[] = [
  {
    id: "1",
    name: "Mirae Asset Large Cap Fund",
    amc: "Mirae Asset",
    type: "Equity",
    nav: 92.34,
    return1yr: 18.5,
    return3yr: 15.2,
    return5yr: 14.8,
    expenseRatio: 1.62,
    minInvestment: 5000,
    minSIP: 500,
    riskLevel: "High",
    rating: 5,
  },
  {
    id: "2",
    name: "Axis Bluechip Fund",
    amc: "Axis Mutual Fund",
    type: "Equity",
    nav: 48.56,
    return1yr: 16.2,
    return3yr: 14.8,
    return5yr: 13.9,
    expenseRatio: 1.56,
    minInvestment: 5000,
    minSIP: 500,
    riskLevel: "High",
    rating: 5,
  },
  {
    id: "3",
    name: "HDFC Balanced Advantage Fund",
    amc: "HDFC Mutual Fund",
    type: "Hybrid",
    nav: 312.45,
    return1yr: 14.8,
    return3yr: 12.5,
    return5yr: 11.2,
    expenseRatio: 1.71,
    minInvestment: 5000,
    minSIP: 500,
    riskLevel: "Medium",
    rating: 4,
  },
  {
    id: "4",
    name: "SBI Equity Hybrid Fund",
    amc: "SBI Mutual Fund",
    type: "Hybrid",
    nav: 215.32,
    return1yr: 13.5,
    return3yr: 11.8,
    return5yr: 10.9,
    expenseRatio: 1.45,
    minInvestment: 5000,
    minSIP: 500,
    riskLevel: "Medium",
    rating: 4,
  },
  {
    id: "5",
    name: "ICICI Pru Corporate Bond Fund",
    amc: "ICICI Prudential",
    type: "Debt",
    nav: 25.67,
    return1yr: 7.2,
    return3yr: 7.8,
    return5yr: 8.1,
    expenseRatio: 0.45,
    minInvestment: 5000,
    minSIP: 1000,
    riskLevel: "Low",
    rating: 4,
  },
  {
    id: "6",
    name: "Parag Parikh Flexi Cap Fund",
    amc: "PPFAS Mutual Fund",
    type: "Equity",
    nav: 58.92,
    return1yr: 22.3,
    return3yr: 18.6,
    return5yr: 17.2,
    expenseRatio: 0.89,
    minInvestment: 1000,
    minSIP: 1000,
    riskLevel: "High",
    rating: 5,
  },
];

export default function Investments() {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "text-success bg-success/10";
      case "Medium":
        return "text-warning bg-warning/10";
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Investment Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Compare mutual funds and track returns
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
                  <p className="text-xl font-bold">
                    {mutualFunds.filter((f) => f.type === "Equity").length}
                  </p>
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
                  <p className="text-xl font-bold">
                    {mutualFunds.filter((f) => f.type === "Hybrid").length}
                  </p>
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
                  <p className="text-xl font-bold">
                    {mutualFunds.filter((f) => f.type === "Debt").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funds Grid */}
        <div className="space-y-4">
          {mutualFunds.map((fund) => (
            <Card key={fund.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Fund Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{fund.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                          fund.type
                        )}`}
                      >
                        {fund.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRiskColor(
                          fund.riskLevel
                        )}`}
                      >
                        {fund.riskLevel} Risk
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{fund.amc}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < fund.rating
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
                      <p className="text-lg font-semibold">₹{fund.nav}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">1Y Return</p>
                      <p className="text-lg font-semibold text-success">
                        +{fund.return1yr}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">3Y Return</p>
                      <p className="text-lg font-semibold text-success">
                        +{fund.return3yr}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">5Y Return</p>
                      <p className="text-lg font-semibold text-success">
                        +{fund.return5yr}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Expense</p>
                      <p className="text-lg font-semibold">{fund.expenseRatio}%</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Info className="h-4 w-4" />
                      Details
                    </Button>
                    <Button variant="gold" size="sm" className="gap-1">
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
                      ₹{fund.minInvestment.toLocaleString()}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    Min SIP:{" "}
                    <span className="text-foreground font-medium">
                      ₹{fund.minSIP.toLocaleString()}
                    </span>
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
