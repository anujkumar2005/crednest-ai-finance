import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield,
  Heart,
  Car,
  Home,
  Star,
  ExternalLink,
  Phone,
  CheckCircle,
  TrendingUp,
  Loader2,
  Search,
  Calculator,
  BadgeCheck,
  Users,
  IndianRupee,
  Plane,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface InsuranceCompany {
  id: string;
  name: string;
  logo_url: string | null;
  claim_settlement_ratio: number | null;
  life_premium_min: number | null;
  life_premium_max: number | null;
  health_premium_min: number | null;
  health_premium_max: number | null;
  vehicle_premium_min: number | null;
  vehicle_premium_max: number | null;
  home_premium_min: number | null;
  home_premium_max: number | null;
  coverage_amount_min: number | null;
  coverage_amount_max: number | null;
  features: unknown;
  description: string | null;
  website: string | null;
  apply_url: string | null;
  customer_care: string | null;
  rating: number | null;
}

const insuranceTypes = [
  { value: "All", icon: Shield, label: "All", color: "text-primary" },
  { value: "Life", icon: Heart, label: "Life", color: "text-destructive" },
  { value: "Health", icon: Users, label: "Health", color: "text-success" },
  { value: "Vehicle", icon: Car, label: "Vehicle", color: "text-info" },
  { value: "Home", icon: Home, label: "Home", color: "text-warning" },
  { value: "Travel", icon: Plane, label: "Travel", color: "text-primary" },
];

export default function Insurance() {
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [premiumCalc, setPremiumCalc] = useState({
    age: 30,
    coverage: 5000000,
    term: 20,
    type: "Term",
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from("insurance_companies")
        .select("*")
        .order("claim_settlement_ratio", { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error("Error fetching insurance companies:", error);
    } finally {
      setLoading(false);
    }
  };

  // Estimate premium (simplified calculation)
  const estimatePremium = () => {
    const baseRate = premiumCalc.type === "Term" ? 0.003 : 0.025;
    const ageFactor = 1 + (premiumCalc.age - 25) * 0.03;
    const annualPremium = premiumCalc.coverage * baseRate * ageFactor;
    const monthlyPremium = annualPremium / 12;
    return { annual: annualPremium, monthly: monthlyPremium };
  };

  const premiumResult = estimatePremium();

  const pieData = [
    { name: "Premium", value: premiumResult.annual * premiumCalc.term, color: "hsl(var(--destructive))" },
    { name: "Coverage", value: premiumCalc.coverage, color: "hsl(var(--success))" },
  ];

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

  const getTypes = (company: InsuranceCompany): string[] => {
    const types: string[] = [];
    if (company.life_premium_min) types.push("Life");
    if (company.health_premium_min) types.push("Health");
    if (company.vehicle_premium_min) types.push("Vehicle");
    if (company.home_premium_min) types.push("Home");
    return types;
  };

  const formatPremiumRange = (company: InsuranceCompany): string => {
    const mins = [
      company.life_premium_min,
      company.health_premium_min,
      company.vehicle_premium_min,
      company.home_premium_min,
    ].filter(Boolean);
    const maxs = [
      company.life_premium_max,
      company.health_premium_max,
      company.vehicle_premium_max,
      company.home_premium_max,
    ].filter(Boolean);
    
    if (mins.length === 0) return "Contact for quote";
    const min = Math.min(...(mins as number[]));
    const max = Math.max(...(maxs as number[]));
    return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}/mo`;
  };

  const formatCoverage = (company: InsuranceCompany): string => {
    if (!company.coverage_amount_min) return "Contact for details";
    const minL = (company.coverage_amount_min / 100000).toFixed(0);
    const maxL = company.coverage_amount_max 
      ? (company.coverage_amount_max / 10000000).toFixed(0) + " Cr"
      : "varies";
    return `₹${minL}L - ₹${maxL}`;
  };

  const filteredCompanies = companies
    .filter((company) => company.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((company) => {
      if (selectedType === "All") return true;
      return getTypes(company).includes(selectedType);
    });

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
          <h1 className="text-3xl font-bold">Insurance Comparison</h1>
          <p className="text-muted-foreground mt-1">
            Compare {companies.length}+ insurance providers and find the best coverage for you
          </p>
        </div>

        {/* Insurance Type Cards */}
        <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {insuranceTypes.map((type) => (
            <Card
              key={type.value}
              className={`glass-card cursor-pointer transition-all duration-300 ${
                selectedType === type.value 
                  ? "border-primary bg-primary/5" 
                  : "hover:border-primary/30"
              }`}
              onClick={() => setSelectedType(type.value)}
            >
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-secondary`}>
                  <type.icon className={`h-5 w-5 ${type.color}`} />
                </div>
                <span className="font-medium text-sm">{type.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Premium Calculator */}
        <Card className="gold-glow overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Life Insurance Premium Estimator
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Inputs */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Your Age</label>
                      <span className="text-xl font-bold text-primary">{premiumCalc.age} years</span>
                    </div>
                    <Slider
                      value={[premiumCalc.age]}
                      onValueChange={(v) => setPremiumCalc({ ...premiumCalc, age: v[0] })}
                      min={18}
                      max={65}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>18 yrs</span>
                      <span>65 yrs</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Policy Term</label>
                      <span className="text-xl font-bold text-primary">{premiumCalc.term} years</span>
                    </div>
                    <Slider
                      value={[premiumCalc.term]}
                      onValueChange={(v) => setPremiumCalc({ ...premiumCalc, term: v[0] })}
                      min={5}
                      max={40}
                      step={5}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>5 yrs</span>
                      <span>40 yrs</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-primary" />
                      Coverage Amount
                    </label>
                    <span className="text-xl font-bold text-primary">
                      ₹{(premiumCalc.coverage / 10000000).toFixed(1)} Cr
                    </span>
                  </div>
                  <Slider
                    value={[premiumCalc.coverage]}
                    onValueChange={(v) => setPremiumCalc({ ...premiumCalc, coverage: v[0] })}
                    min={2500000}
                    max={50000000}
                    step={2500000}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>₹25 Lakhs</span>
                    <span>₹5 Crore</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    variant={premiumCalc.type === "Term" ? "gold" : "outline"}
                    onClick={() => setPremiumCalc({ ...premiumCalc, type: "Term" })}
                    className="flex-1"
                  >
                    Term Insurance
                  </Button>
                  <Button
                    variant={premiumCalc.type === "ULIP" ? "gold" : "outline"}
                    onClick={() => setPremiumCalc({ ...premiumCalc, type: "ULIP" })}
                    className="flex-1"
                  >
                    ULIP
                  </Button>
                </div>

                {/* Results */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center p-4 rounded-xl bg-primary/10">
                    <p className="text-xs text-muted-foreground mb-1">Monthly Premium</p>
                    <p className="text-2xl font-bold text-primary">
                      ₹{Math.round(premiumResult.monthly).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-success/10">
                    <p className="text-xs text-muted-foreground mb-1">Annual Premium</p>
                    <p className="text-2xl font-bold text-success">
                      ₹{Math.round(premiumResult.annual).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Visualization */}
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
                  <p className="text-xs text-muted-foreground">Coverage vs Total Premium</p>
                  <p className="text-sm font-medium mt-1">
                    Pay ₹{Math.round(premiumResult.annual * premiumCalc.term).toLocaleString()} for ₹{(premiumCalc.coverage / 10000000).toFixed(1)} Cr coverage
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search insurance companies..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Companies List */}
        <div className="space-y-4">
          {filteredCompanies.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No insurance companies found</p>
            </Card>
          ) : (
            filteredCompanies.map((company, index) => (
              <Card key={company.id} className={`hover:border-primary/30 transition-colors ${index === 0 ? "border-success/50 bg-success/5" : ""}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Company Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{company.name}</h3>
                        {(company.claim_settlement_ratio || 0) >= 98 && (
                          <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-medium flex items-center gap-1">
                            <BadgeCheck className="h-3 w-3" />
                            Top Rated
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < Math.floor(company.rating || 0)
                                  ? "text-primary fill-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">{company.rating}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {getTypes(company).map((type) => {
                          const typeInfo = insuranceTypes.find(t => t.value === type);
                          const Icon = typeInfo?.icon || Shield;
                          return (
                            <span
                              key={type}
                              className="px-2 py-1 rounded-full bg-secondary text-xs flex items-center gap-1"
                            >
                              <Icon className={`h-3 w-3 ${typeInfo?.color}`} />
                              {type}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <TrendingUp className="h-3 w-3" />
                          <span className="text-xs">Claim Settlement</span>
                        </div>
                        <p
                          className={`text-2xl font-bold ${
                            (company.claim_settlement_ratio || 0) >= 95
                              ? "text-success"
                              : (company.claim_settlement_ratio || 0) >= 85
                              ? "text-warning"
                              : "text-destructive"
                          }`}
                        >
                          {company.claim_settlement_ratio}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Premium Range</p>
                        <p className="font-medium text-lg">{formatPremiumRange(company)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Coverage</p>
                        <p className="font-medium text-lg">{formatCoverage(company)}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {company.customer_care && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => window.open(`tel:${company.customer_care}`)}
                        >
                          <Phone className="h-4 w-4" />
                          Call
                        </Button>
                      )}
                      <Button
                        variant="gold"
                        size="sm"
                        className="gap-1"
                        onClick={() => window.open(company.apply_url || company.website || "#", "_blank")}
                      >
                        Get Quote
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex flex-wrap gap-2">
                      {parseFeatures(company.features).slice(0, 5).map((feature) => (
                        <span
                          key={feature}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-xs"
                        >
                          <CheckCircle className="h-3 w-3 text-success" />
                          {feature}
                        </span>
                      ))}
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
