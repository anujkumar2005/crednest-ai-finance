import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  IndianRupee,
  TrendingDown,
  Building2,
  PiggyBank,
  Heart,
  GraduationCap,
  Home,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Info,
  Landmark,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// FY 2025-26 Tax Slabs
const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250001, max: 500000, rate: 5 },
  { min: 500001, max: 1000000, rate: 20 },
  { min: 1000001, max: Infinity, rate: 30 },
];

const NEW_REGIME_SLABS = [
  { min: 0, max: 400000, rate: 0 },
  { min: 400001, max: 800000, rate: 5 },
  { min: 800001, max: 1200000, rate: 10 },
  { min: 1200001, max: 1600000, rate: 15 },
  { min: 1600001, max: 2000000, rate: 20 },
  { min: 2000001, max: 2400000, rate: 25 },
  { min: 2400001, max: Infinity, rate: 30 },
];

const SECTION_80C_ITEMS = [
  { key: "ppf", label: "PPF (Public Provident Fund)", icon: PiggyBank, maxLimit: 150000 },
  { key: "elss", label: "ELSS Mutual Funds", icon: TrendingDown, maxLimit: 150000 },
  { key: "lic", label: "Life Insurance Premium", icon: Heart, maxLimit: 150000 },
  { key: "nps_80ccd1", label: "NPS (under 80CCD(1))", icon: Landmark, maxLimit: 150000 },
  { key: "tuition", label: "Children Tuition Fees", icon: GraduationCap, maxLimit: 150000 },
  { key: "home_loan_principal", label: "Home Loan Principal", icon: Home, maxLimit: 150000 },
  { key: "sukanya", label: "Sukanya Samriddhi Yojana", icon: Heart, maxLimit: 150000 },
  { key: "fd_5yr", label: "5-Year Tax Saving FD", icon: Building2, maxLimit: 150000 },
];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1))",
];

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function calculateTax(income: number, slabs: typeof OLD_REGIME_SLABS): number {
  let tax = 0;
  for (const slab of slabs) {
    if (income <= 0) break;
    const taxableInSlab = Math.min(income, slab.max) - slab.min + 1;
    if (taxableInSlab > 0) {
      tax += (Math.min(taxableInSlab, slab.max - slab.min + 1) * slab.rate) / 100;
    }
    income -= slab.max - slab.min + 1;
  }
  return Math.max(0, tax);
}

function calculateTaxFromSlabs(taxableIncome: number, slabs: typeof OLD_REGIME_SLABS): number {
  let tax = 0;
  let remaining = taxableIncome;
  for (const slab of slabs) {
    if (remaining <= 0) break;
    const slabWidth = slab.max === Infinity ? remaining : slab.max - slab.min + 1;
    const taxable = Math.min(remaining, slabWidth);
    tax += (taxable * slab.rate) / 100;
    remaining -= taxable;
  }
  return Math.max(0, tax);
}

function addCess(tax: number): number {
  return tax + tax * 0.04; // 4% Health & Education Cess
}

export default function TaxPlanning() {
  // Regime comparison state
  const [grossIncome, setGrossIncome] = useState(1200000);
  const [deductions80C, setDeductions80C] = useState(150000);
  const [deductions80D, setDeductions80D] = useState(25000);
  const [deductionsHRA, setDeductionsHRA] = useState(0);
  const [standardDeduction] = useState(50000);
  const [nps80CCD1B, setNps80CCD1B] = useState(0);
  const [homeLoanInterest, setHomeLoanInterest] = useState(0);

  // 80C tracker state
  const [investments80C, setInvestments80C] = useState<Record<string, number>>(
    Object.fromEntries(SECTION_80C_ITEMS.map((item) => [item.key, 0]))
  );

  // HRA calculator state
  const [basicSalary, setBasicSalary] = useState(50000);
  const [hraReceived, setHraReceived] = useState(20000);
  const [rentPaid, setRentPaid] = useState(15000);
  const [isMetro, setIsMetro] = useState("yes");

  // Regime comparison calculations
  const regimeComparison = useMemo(() => {
    // Old regime
    const totalOldDeductions =
      Math.min(deductions80C, 150000) +
      Math.min(deductions80D, 100000) +
      deductionsHRA +
      standardDeduction +
      Math.min(nps80CCD1B, 50000) +
      Math.min(homeLoanInterest, 200000);

    const oldTaxableIncome = Math.max(0, grossIncome - totalOldDeductions);
    const oldTax = calculateTaxFromSlabs(oldTaxableIncome, OLD_REGIME_SLABS);
    const oldTaxWithCess = addCess(oldTax);

    // New regime (only standard deduction of ₹75,000 from FY 2024-25)
    const newStandardDeduction = 75000;
    const newTaxableIncome = Math.max(0, grossIncome - newStandardDeduction);
    let newTax = calculateTaxFromSlabs(newTaxableIncome, NEW_REGIME_SLABS);

    // Rebate u/s 87A for new regime (income up to ₹12L → tax rebate up to ₹60,000)
    if (newTaxableIncome <= 1200000) {
      newTax = Math.max(0, newTax - 60000);
    }

    const newTaxWithCess = addCess(newTax);

    const savings = oldTaxWithCess - newTaxWithCess;
    const recommended = savings > 0 ? "new" : "old";

    return {
      oldTaxableIncome,
      oldTax: oldTaxWithCess,
      totalOldDeductions,
      newTaxableIncome,
      newTax: newTaxWithCess,
      newStandardDeduction,
      savings: Math.abs(savings),
      recommended,
    };
  }, [grossIncome, deductions80C, deductions80D, deductionsHRA, standardDeduction, nps80CCD1B, homeLoanInterest]);

  // 80C calculations
  const total80C = useMemo(() => {
    return Object.values(investments80C).reduce((sum, val) => sum + val, 0);
  }, [investments80C]);

  const remaining80C = Math.max(0, 150000 - total80C);
  const utilization80C = Math.min(100, (total80C / 150000) * 100);

  // HRA calculation
  const hraExemption = useMemo(() => {
    const annualBasic = basicSalary * 12;
    const annualHRA = hraReceived * 12;
    const annualRent = rentPaid * 12;
    const metroPercent = isMetro === "yes" ? 0.5 : 0.4;

    const option1 = annualHRA;
    const option2 = metroPercent * annualBasic;
    const option3 = Math.max(0, annualRent - 0.1 * annualBasic);

    const exemption = Math.min(option1, option2, option3);

    return {
      option1,
      option2,
      option3,
      exemption,
      taxableHRA: annualHRA - exemption,
    };
  }, [basicSalary, hraReceived, rentPaid, isMetro]);

  // Chart data
  const comparisonChartData = [
    {
      name: "Old Regime",
      tax: Math.round(regimeComparison.oldTax),
      deductions: regimeComparison.totalOldDeductions,
    },
    {
      name: "New Regime",
      tax: Math.round(regimeComparison.newTax),
      deductions: regimeComparison.newStandardDeduction,
    },
  ];

  const deduction80CPieData = SECTION_80C_ITEMS.filter((item) => investments80C[item.key] > 0).map(
    (item, index) => ({
      name: item.label.split("(")[0].trim(),
      value: investments80C[item.key],
      fill: COLORS[index % COLORS.length],
    })
  );

  if (remaining80C > 0) {
    deduction80CPieData.push({
      name: "Remaining",
      value: remaining80C,
      fill: "hsl(var(--muted))",
    });
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold gradient-text flex items-center gap-2">
            <Calculator className="h-7 w-7" />
            Tax Planning - India
          </h1>
          <p className="text-muted-foreground mt-1">
            FY 2025-26 • Compare regimes, track deductions & plan your taxes
          </p>
        </div>

        <Tabs defaultValue="regime" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="regime" className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Old vs New</span>
              <span className="sm:hidden">Regime</span>
            </TabsTrigger>
            <TabsTrigger value="80c" className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              <span className="hidden sm:inline">80C/80D Tracker</span>
              <span className="sm:hidden">80C</span>
            </TabsTrigger>
            <TabsTrigger value="hra" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span>HRA</span>
            </TabsTrigger>
          </TabsList>

          {/* ========== Old vs New Regime ========== */}
          <TabsContent value="regime" className="space-y-6">
            {/* Income & Deductions Input */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Income Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Gross Annual Income</Label>
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={grossIncome}
                        onChange={(e) => setGrossIncome(Number(e.target.value))}
                      />
                    </div>
                    <Slider
                      value={[grossIncome]}
                      onValueChange={([v]) => setGrossIncome(v)}
                      min={0}
                      max={10000000}
                      step={50000}
                    />
                    <p className="text-xs text-muted-foreground text-right">{formatCurrency(grossIncome)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Deductions (Old Regime)</CardTitle>
                  <CardDescription>These apply only under the old regime</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">80C (max ₹1.5L)</Label>
                      <Input
                        type="number"
                        value={deductions80C}
                        onChange={(e) => setDeductions80C(Math.min(150000, Number(e.target.value)))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">80D Medical (max ₹1L)</Label>
                      <Input
                        type="number"
                        value={deductions80D}
                        onChange={(e) => setDeductions80D(Math.min(100000, Number(e.target.value)))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">HRA Exemption</Label>
                      <Input
                        type="number"
                        value={deductionsHRA}
                        onChange={(e) => setDeductionsHRA(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">NPS 80CCD(1B) (max ₹50K)</Label>
                      <Input
                        type="number"
                        value={nps80CCD1B}
                        onChange={(e) => setNps80CCD1B(Math.min(50000, Number(e.target.value)))}
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs">Home Loan Interest 24(b) (max ₹2L)</Label>
                      <Input
                        type="number"
                        value={homeLoanInterest}
                        onChange={(e) => setHomeLoanInterest(Math.min(200000, Number(e.target.value)))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendation Banner */}
            <Card className={regimeComparison.recommended === "new" ? "border-green-500/50 bg-green-500/5" : "border-primary/50 bg-primary/5"}>
              <CardContent className="py-4 flex flex-col sm:flex-row items-center gap-4">
                <CheckCircle2 className="h-8 w-8 text-green-500 shrink-0" />
                <div className="text-center sm:text-left">
                  <p className="font-semibold text-lg">
                    {regimeComparison.recommended === "new" ? "New Regime" : "Old Regime"} is better for you!
                  </p>
                  <p className="text-muted-foreground">
                    You save <span className="font-bold text-foreground">{formatCurrency(regimeComparison.savings)}</span> compared to the{" "}
                    {regimeComparison.recommended === "new" ? "old" : "new"} regime
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Side-by-side comparison */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className={regimeComparison.recommended === "old" ? "ring-2 ring-primary" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Old Regime</CardTitle>
                    {regimeComparison.recommended === "old" && <Badge>Recommended</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gross Income</span>
                    <span>{formatCurrency(grossIncome)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Deductions</span>
                    <span className="text-green-500">-{formatCurrency(regimeComparison.totalOldDeductions)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxable Income</span>
                    <span>{formatCurrency(regimeComparison.oldTaxableIncome)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Tax Payable</span>
                    <span className="text-destructive">{formatCurrency(Math.round(regimeComparison.oldTax))}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Including 4% Health & Education Cess</p>
                </CardContent>
              </Card>

              <Card className={regimeComparison.recommended === "new" ? "ring-2 ring-green-500" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">New Regime</CardTitle>
                    {regimeComparison.recommended === "new" && <Badge variant="secondary" className="bg-green-500/10 text-green-600">Recommended</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gross Income</span>
                    <span>{formatCurrency(grossIncome)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Standard Deduction</span>
                    <span className="text-green-500">-{formatCurrency(regimeComparison.newStandardDeduction)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxable Income</span>
                    <span>{formatCurrency(regimeComparison.newTaxableIncome)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Tax Payable</span>
                    <span className="text-destructive">{formatCurrency(Math.round(regimeComparison.newTax))}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Including 4% Cess • Rebate u/s 87A applied if eligible</p>
                </CardContent>
              </Card>
            </div>

            {/* Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tax Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="tax" name="Tax Payable" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="deductions" name="Deductions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tax Slabs Reference */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Old Regime Slabs (FY 2025-26)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {OLD_REGIME_SLABS.map((slab, i) => (
                      <div key={i} className="flex justify-between text-sm p-2 rounded-lg bg-muted/50">
                        <span>
                          {formatCurrency(slab.min)} - {slab.max === Infinity ? "Above" : formatCurrency(slab.max)}
                        </span>
                        <Badge variant="outline">{slab.rate}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">New Regime Slabs (FY 2025-26)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {NEW_REGIME_SLABS.map((slab, i) => (
                      <div key={i} className="flex justify-between text-sm p-2 rounded-lg bg-muted/50">
                        <span>
                          {formatCurrency(slab.min)} - {slab.max === Infinity ? "Above" : formatCurrency(slab.max)}
                        </span>
                        <Badge variant="outline">{slab.rate}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ========== 80C/80D Deduction Tracker ========== */}
          <TabsContent value="80c" className="space-y-6">
            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IndianRupee className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Invested</p>
                      <p className="text-2xl font-bold">{formatCurrency(Math.min(total80C, 150000))}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <TrendingDown className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tax Saved (30% slab)</p>
                      <p className="text-2xl font-bold text-green-500">
                        {formatCurrency(Math.round(Math.min(total80C, 150000) * 0.312))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${remaining80C > 0 ? "bg-amber-500/10" : "bg-green-500/10"}`}>
                      {remaining80C > 0 ? (
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining Limit</p>
                      <p className="text-2xl font-bold">{formatCurrency(remaining80C)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress */}
            <Card>
              <CardContent className="pt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Section 80C Utilization</span>
                  <span className="font-medium">{utilization80C.toFixed(0)}% of ₹1,50,000</span>
                </div>
                <Progress value={utilization80C} className="h-3" />
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Investment Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Track Your 80C Investments</CardTitle>
                  <CardDescription>Enter annual investment amounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {SECTION_80C_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.key} className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Label className="text-sm flex-1 min-w-0 truncate">{item.label}</Label>
                        <Input
                          type="number"
                          className="w-28"
                          value={investments80C[item.key] || ""}
                          placeholder="₹0"
                          onChange={(e) =>
                            setInvestments80C((prev) => ({
                              ...prev,
                              [item.key]: Number(e.target.value),
                            }))
                          }
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">80C Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  {deduction80CPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={deduction80CPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {deduction80CPieData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <PiggyBank className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Add investments to see allocation</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 80D Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Section 80D - Health Insurance
                </CardTitle>
                <CardDescription>
                  Additional deduction for health insurance premiums (above 80C limit)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                    <p className="text-sm text-muted-foreground">Self & Family</p>
                    <p className="font-semibold">Up to ₹25,000</p>
                    <p className="text-xs text-muted-foreground">₹50,000 if senior citizen</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                    <p className="text-sm text-muted-foreground">Parents</p>
                    <p className="font-semibold">Up to ₹25,000</p>
                    <p className="text-xs text-muted-foreground">₹50,000 if parents are senior citizens</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                    <p className="text-sm text-muted-foreground">Maximum Total</p>
                    <p className="font-semibold text-primary">Up to ₹1,00,000</p>
                    <p className="text-xs text-muted-foreground">If all members are senior citizens</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== HRA Calculator ========== */}
          <TabsContent value="hra" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">HRA Exemption Calculator</CardTitle>
                  <CardDescription>Calculate your House Rent Allowance tax exemption</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Basic Salary (Monthly)</Label>
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={basicSalary}
                        onChange={(e) => setBasicSalary(Number(e.target.value))}
                      />
                    </div>
                    <Slider
                      value={[basicSalary]}
                      onValueChange={([v]) => setBasicSalary(v)}
                      min={10000}
                      max={500000}
                      step={5000}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>HRA Received (Monthly)</Label>
                    <Input
                      type="number"
                      value={hraReceived}
                      onChange={(e) => setHraReceived(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rent Paid (Monthly)</Label>
                    <Input
                      type="number"
                      value={rentPaid}
                      onChange={(e) => setRentPaid(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>City Type</Label>
                    <Select value={isMetro} onValueChange={setIsMetro}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Metro (Delhi, Mumbai, Kolkata, Chennai)</SelectItem>
                        <SelectItem value="no">Non-Metro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">HRA Exemption Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">Actual HRA Received</p>
                        <p className="text-xs text-muted-foreground">Annual</p>
                      </div>
                      <span className="font-semibold">{formatCurrency(hraExemption.option1)}</span>
                    </div>

                    <div className="flex justify-between text-sm p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{isMetro === "yes" ? "50%" : "40%"} of Basic Salary</p>
                        <p className="text-xs text-muted-foreground">{isMetro === "yes" ? "Metro" : "Non-Metro"} city</p>
                      </div>
                      <span className="font-semibold">{formatCurrency(hraExemption.option2)}</span>
                    </div>

                    <div className="flex justify-between text-sm p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">Rent - 10% of Basic</p>
                        <p className="text-xs text-muted-foreground">Rent paid minus 10% basic salary</p>
                      </div>
                      <span className="font-semibold">{formatCurrency(hraExemption.option3)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <p className="font-semibold text-green-600 dark:text-green-400">HRA Exempt (Minimum of above 3)</p>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(hraExemption.exemption)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      per year ({formatCurrency(Math.round(hraExemption.exemption / 12))} / month)
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <p className="font-semibold text-destructive">Taxable HRA</p>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(hraExemption.taxableHRA)}</p>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      HRA exemption is available only under the Old Tax Regime. Under the New Regime, HRA is fully taxable.
                      Rent receipts are required if annual rent exceeds ₹1,00,000.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
