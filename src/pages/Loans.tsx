import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Search,
  Calculator,
  Star,
  ExternalLink,
  Phone,
  Percent,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

interface Bank {
  id: string;
  name: string;
  logo: string;
  personalLoanRate: number;
  homeLoanRate: number;
  carLoanRate: number;
  educationLoanRate: number;
  processingFee: number;
  minCibilScore: number;
  maxLoanAmount: number;
  maxTenure: number;
  features: string[];
  rating: number;
  website: string;
  customerCare: string;
}

const banks: Bank[] = [
  {
    id: "1",
    name: "State Bank of India",
    logo: "🏦",
    personalLoanRate: 10.5,
    homeLoanRate: 8.5,
    carLoanRate: 8.75,
    educationLoanRate: 8.15,
    processingFee: 1.0,
    minCibilScore: 700,
    maxLoanAmount: 5000000,
    maxTenure: 30,
    features: ["No prepayment charges", "Quick approval", "Doorstep service"],
    rating: 4.5,
    website: "https://www.onlinesbi.sbi/",
    customerCare: "1800-11-2211",
  },
  {
    id: "2",
    name: "HDFC Bank",
    logo: "🏛️",
    personalLoanRate: 10.75,
    homeLoanRate: 8.35,
    carLoanRate: 8.5,
    educationLoanRate: 9.0,
    processingFee: 0.5,
    minCibilScore: 750,
    maxLoanAmount: 10000000,
    maxTenure: 30,
    features: ["Instant approval", "Flexible tenure", "Top-up facility"],
    rating: 4.7,
    website: "https://www.hdfcbank.com/personal/borrow/popular-loans/personal-loan",
    customerCare: "1800-22-4060",
  },
  {
    id: "3",
    name: "ICICI Bank",
    logo: "🔶",
    personalLoanRate: 10.5,
    homeLoanRate: 8.4,
    carLoanRate: 8.65,
    educationLoanRate: 8.5,
    processingFee: 0.75,
    minCibilScore: 720,
    maxLoanAmount: 7500000,
    maxTenure: 25,
    features: ["Digital processing", "Minimal documentation", "EMI holiday"],
    rating: 4.6,
    website: "https://www.icicibank.com/personal-banking/loans/personal-loan",
    customerCare: "1800-102-4242",
  },
  {
    id: "4",
    name: "Axis Bank",
    logo: "🔷",
    personalLoanRate: 10.49,
    homeLoanRate: 8.55,
    carLoanRate: 8.8,
    educationLoanRate: 9.5,
    processingFee: 1.0,
    minCibilScore: 700,
    maxLoanAmount: 5000000,
    maxTenure: 25,
    features: ["Express approval", "Part prepayment", "Balance transfer"],
    rating: 4.4,
    website: "https://www.axisbank.com/retail/loans/personal-loan",
    customerCare: "1800-419-5555",
  },
  {
    id: "5",
    name: "Kotak Mahindra Bank",
    logo: "🔴",
    personalLoanRate: 10.99,
    homeLoanRate: 8.7,
    carLoanRate: 9.0,
    educationLoanRate: 9.25,
    processingFee: 0.5,
    minCibilScore: 700,
    maxLoanAmount: 4000000,
    maxTenure: 20,
    features: ["Zero foreclosure", "Online tracking", "Flexi loan option"],
    rating: 4.3,
    website: "https://www.kotak.com/en/personal-banking/loans/personal-loan.html",
    customerCare: "1800-266-0811",
  },
];

const loanTypes = ["All", "Personal", "Home", "Car", "Education"];

export default function Loans() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLoanType, setSelectedLoanType] = useState("All");
  const [emiCalc, setEmiCalc] = useState({
    amount: "1000000",
    rate: "10.5",
    tenure: "60",
  });

  const calculateEMI = () => {
    const P = parseFloat(emiCalc.amount);
    const r = parseFloat(emiCalc.rate) / 12 / 100;
    const n = parseFloat(emiCalc.tenure);

    if (r === 0) return P / n;
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return emi;
  };

  const emi = calculateEMI();
  const totalAmount = emi * parseFloat(emiCalc.tenure);
  const totalInterest = totalAmount - parseFloat(emiCalc.amount);

  const getRateForType = (bank: Bank) => {
    switch (selectedLoanType) {
      case "Personal":
        return bank.personalLoanRate;
      case "Home":
        return bank.homeLoanRate;
      case "Car":
        return bank.carLoanRate;
      case "Education":
        return bank.educationLoanRate;
      default:
        return bank.personalLoanRate;
    }
  };

  const filteredBanks = banks
    .filter((bank) =>
      bank.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => getRateForType(a) - getRateForType(b));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Loan Comparison</h1>
          <p className="text-muted-foreground mt-1">
            Compare interest rates and find the best loan offers
          </p>
        </div>

        {/* EMI Calculator */}
        <Card className="gold-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              EMI Calculator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Loan Amount (₹)</label>
                <Input
                  type="number"
                  value={emiCalc.amount}
                  onChange={(e) =>
                    setEmiCalc({ ...emiCalc, amount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Interest Rate (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={emiCalc.rate}
                  onChange={(e) =>
                    setEmiCalc({ ...emiCalc, rate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tenure (Months)</label>
                <Input
                  type="number"
                  value={emiCalc.tenure}
                  onChange={(e) =>
                    setEmiCalc({ ...emiCalc, tenure: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col justify-end">
                <div className="glass-card p-4 text-center">
                  <p className="text-sm text-muted-foreground">Monthly EMI</p>
                  <p className="text-2xl font-bold text-primary">
                    ₹{emi.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Total Interest</p>
                <p className="text-lg font-semibold text-destructive">
                  ₹{totalInterest.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-lg font-semibold">
                  ₹{totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search banks..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Tabs value={selectedLoanType} onValueChange={setSelectedLoanType}>
            <TabsList className="bg-secondary">
              {loanTypes.map((type) => (
                <TabsTrigger key={type} value={type}>
                  {type}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Banks List */}
        <div className="space-y-4">
          {filteredBanks.map((bank, index) => (
            <Card
              key={bank.id}
              className="hover:border-primary/30 transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Bank Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-2xl">
                      {bank.logo}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{bank.name}</h3>
                        {index === 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-medium">
                            Best Rate
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 text-primary fill-primary" />
                        <span className="text-sm text-muted-foreground">
                          {bank.rating} Rating
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rates */}
                  <div className="flex flex-wrap gap-4 lg:gap-6">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Percent className="h-4 w-4" />
                        <span className="text-xs">Interest Rate</span>
                      </div>
                      <p className="text-xl font-bold text-primary">
                        {getRateForType(bank)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs">Max Tenure</span>
                      </div>
                      <p className="text-xl font-bold">{bank.maxTenure} yrs</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span className="text-xs">Processing</span>
                      </div>
                      <p className="text-xl font-bold">{bank.processingFee}%</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 lg:ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => window.open(`tel:${bank.customerCare}`)}
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </Button>
                    <Button
                      variant="gold"
                      size="sm"
                      className="gap-1"
                      onClick={() => window.open(bank.website, "_blank")}
                    >
                      Apply Now
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex flex-wrap gap-2">
                    {bank.features.map((feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-sm"
                      >
                        <CheckCircle className="h-3 w-3 text-success" />
                        {feature}
                      </span>
                    ))}
                    <span className="text-sm text-muted-foreground">
                      Min CIBIL: {bank.minCibilScore}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
