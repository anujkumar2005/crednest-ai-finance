import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { isJwtExpiredError, retryOnJwtExpired } from "@/lib/supabaseRetry";
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
  Loader2,
  IndianRupee,
  TrendingDown,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface Bank {
  id: string;
  name: string;
  logo_url: string | null;
  personal_loan_rate: number | null;
  home_loan_rate: number | null;
  car_loan_rate: number | null;
  education_loan_rate: number | null;
  business_loan_rate: number | null;
  processing_fee: number | null;
  min_cibil_score: number | null;
  max_loan_amount: number | null;
  max_tenure_years: number | null;
  features: unknown;
  rating: number | null;
  website: string | null;
  apply_url: string | null;
  customer_care: string | null;
}

const loanTypes = [
  { value: "All", label: "All Loans" },
  { value: "Personal", label: "Personal" },
  { value: "Home", label: "Home" },
  { value: "Car", label: "Car" },
  { value: "Education", label: "Education" },
  { value: "Business", label: "Business" },
];

export default function Loans() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLoanType, setSelectedLoanType] = useState("All");
  const [emiCalc, setEmiCalc] = useState({
    amount: 1000000,
    rate: 10.5,
    tenure: 60,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const { data, error } = await retryOnJwtExpired<Bank[]>(() =>
        supabase.from("banks").select("*").order("rating", { ascending: false })
      );

      if (error) throw error;
      setBanks(data || []);
    } catch (error: any) {
      console.error("Error fetching banks:", error);

      if (isJwtExpiredError(error)) {
        toast({
          title: "Session expired",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
      } else {
        toast({
          title: "Could not load banks",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateEMI = () => {
    const P = emiCalc.amount;
    const r = emiCalc.rate / 12 / 100;
    const n = emiCalc.tenure;

    if (r === 0) return P / n;
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return emi;
  };

  const emi = calculateEMI();
  const totalAmount = emi * emiCalc.tenure;
  const totalInterest = totalAmount - emiCalc.amount;

  const pieData = [
    { name: "Principal", value: emiCalc.amount, color: "hsl(var(--primary))" },
    { name: "Interest", value: totalInterest, color: "hsl(var(--destructive))" },
  ];

  const getRateForType = (bank: Bank): number => {
    switch (selectedLoanType) {
      case "Personal":
        return bank.personal_loan_rate || 0;
      case "Home":
        return bank.home_loan_rate || 0;
      case "Car":
        return bank.car_loan_rate || 0;
      case "Education":
        return bank.education_loan_rate || 0;
      case "Business":
        return bank.business_loan_rate || 0;
      default:
        return bank.personal_loan_rate || 0;
    }
  };

  const filteredBanks = banks
    .filter((bank) =>
      bank.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((bank) => {
      if (selectedLoanType === "All") return true;
      return getRateForType(bank) > 0;
    })
    .sort((a, b) => getRateForType(a) - getRateForType(b));

  const parseFeatures = (features: unknown): string[] => {
    if (Array.isArray(features)) return features;
    if (typeof features === "string") {
      try {
        return JSON.parse(features);
      } catch {
        return [];
      }
    }
    return [];
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Loan Comparison & EMI Calculator</h1>
          <p className="text-muted-foreground mt-1">
            Compare interest rates from {banks.length}+ banks and calculate your EMI instantly
          </p>
        </div>

        {/* EMI Calculator */}
        <Card className="gold-glow overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Smart EMI Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Sliders */}
              <div className="lg:col-span-2 space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-primary" />
                      Loan Amount
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">
                        ₹{emiCalc.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Slider
                    value={[emiCalc.amount]}
                    onValueChange={(v) => setEmiCalc({ ...emiCalc, amount: v[0] })}
                    min={100000}
                    max={10000000}
                    step={50000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>₹1 Lakh</span>
                    <span>₹1 Crore</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Percent className="h-4 w-4 text-primary" />
                      Interest Rate (% p.a.)
                    </label>
                    <span className="text-2xl font-bold text-primary">{emiCalc.rate}%</span>
                  </div>
                  <Slider
                    value={[emiCalc.rate]}
                    onValueChange={(v) => setEmiCalc({ ...emiCalc, rate: v[0] })}
                    min={5}
                    max={24}
                    step={0.25}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5%</span>
                    <span>24%</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Loan Tenure
                    </label>
                    <span className="text-2xl font-bold text-primary">
                      {Math.floor(emiCalc.tenure / 12)} yrs {emiCalc.tenure % 12} mo
                    </span>
                  </div>
                  <Slider
                    value={[emiCalc.tenure]}
                    onValueChange={(v) => setEmiCalc({ ...emiCalc, tenure: v[0] })}
                    min={12}
                    max={360}
                    step={12}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 Year</span>
                    <span>30 Years</span>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="flex flex-col items-center justify-center">
                <div className="h-[180px] w-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-2">
                  <p className="text-sm text-muted-foreground">Monthly EMI</p>
                  <p className="text-3xl font-bold text-primary">
                    ₹{Math.round(emi).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-border/50">
              <div className="text-center p-4 rounded-xl bg-primary/5">
                <p className="text-sm text-muted-foreground mb-1">Principal Amount</p>
                <p className="text-xl font-bold text-primary">
                  ₹{emiCalc.amount.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 rounded-xl bg-destructive/5">
                <p className="text-sm text-muted-foreground mb-1">Total Interest</p>
                <p className="text-xl font-bold text-destructive">
                  ₹{Math.round(totalInterest).toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 rounded-xl bg-success/5">
                <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                <p className="text-xl font-bold">
                  ₹{Math.round(totalAmount).toLocaleString()}
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
            <TabsList className="bg-secondary h-auto flex-wrap">
              {loanTypes.map((type) => (
                <TabsTrigger key={type.value} value={type.value} className="text-xs sm:text-sm">
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Banks List */}
        <div className="space-y-4">
          {filteredBanks.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No banks found for this loan type</p>
            </Card>
          ) : (
            filteredBanks.map((bank, index) => (
              <Card
                key={bank.id}
                className={`hover:border-primary/30 transition-all duration-300 ${
                  index === 0 ? "border-success/50 bg-success/5" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Bank Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{bank.name}</h3>
                          {index === 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-medium flex items-center gap-1">
                              <BadgeCheck className="h-3 w-3" />
                              Best Rate
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < Math.floor(bank.rating || 0)
                                    ? "text-primary fill-primary"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {bank.rating} Rating
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rates */}
                    <div className="flex flex-wrap gap-6 lg:gap-8">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Percent className="h-3 w-3" />
                          <span className="text-xs">Interest Rate</span>
                        </div>
                        <p className="text-2xl font-bold text-primary">
                          {getRateForType(bank)}%
                        </p>
                        <p className="text-xs text-muted-foreground">per annum</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">Max Tenure</span>
                        </div>
                        <p className="text-2xl font-bold">{bank.max_tenure_years}</p>
                        <p className="text-xs text-muted-foreground">years</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <TrendingDown className="h-3 w-3" />
                          <span className="text-xs">Processing</span>
                        </div>
                        <p className="text-2xl font-bold">{bank.processing_fee}%</p>
                        <p className="text-xs text-muted-foreground">of loan</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 lg:ml-4">
                      {bank.customer_care && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => window.open(`tel:${bank.customer_care}`)}
                        >
                          <Phone className="h-4 w-4" />
                          Call
                        </Button>
                      )}
                      <Button
                        variant="gold"
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          setEmiCalc({ ...emiCalc, rate: getRateForType(bank) });
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Calculate EMI
                        <Calculator className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-1"
                        onClick={() => window.open(bank.apply_url || bank.website || "#", "_blank")}
                      >
                        Apply Now
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex flex-wrap items-center gap-2">
                      {parseFeatures(bank.features).slice(0, 4).map((feature) => (
                        <span
                          key={feature}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-xs"
                        >
                          <CheckCircle className="h-3 w-3 text-success" />
                          {feature}
                        </span>
                      ))}
                      <span className="text-xs text-muted-foreground ml-2">
                        Min CIBIL: <span className="font-medium text-foreground">{bank.min_cibil_score}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Max Amount: <span className="font-medium text-foreground">₹{((bank.max_loan_amount || 0) / 10000000).toFixed(0)} Cr</span>
                      </span>
                    </div>
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
