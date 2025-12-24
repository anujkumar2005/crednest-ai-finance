import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

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
  { icon: Heart, label: "Life Insurance", color: "text-destructive" },
  { icon: Shield, label: "Health Insurance", color: "text-success" },
  { icon: Car, label: "Vehicle Insurance", color: "text-info" },
  { icon: Home, label: "Home Insurance", color: "text-primary" },
];

export default function Insurance() {
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [loading, setLoading] = useState(true);

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
    return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}/month`;
  };

  const formatCoverage = (company: InsuranceCompany): string => {
    if (!company.coverage_amount_min) return "Contact for details";
    const minL = (company.coverage_amount_min / 100000).toFixed(0);
    const maxL = company.coverage_amount_max 
      ? (company.coverage_amount_max / 10000000).toFixed(0) + "Cr"
      : "varies";
    return `₹${minL}L - ₹${maxL}`;
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
          <h1 className="text-3xl font-bold">Insurance Comparison</h1>
          <p className="text-muted-foreground mt-1">
            Compare {companies.length}+ insurance providers and find the best coverage
          </p>
        </div>

        {/* Insurance Types */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {insuranceTypes.map((type) => (
            <Card key={type.label} className="glass-card cursor-pointer hover:border-primary/30 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-secondary">
                    <type.icon className={`h-6 w-6 ${type.color}`} />
                  </div>
                  <span className="font-medium">{type.label}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Companies List */}
        <div className="space-y-4">
          {companies.map((company) => (
            <Card key={company.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Company Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{company.name}</h3>
                      {(company.claim_settlement_ratio || 0) >= 98 && (
                        <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-medium">
                          Top Rated
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(company.rating || 0)
                              ? "text-primary fill-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                      <span className="text-sm text-muted-foreground ml-1">
                        {company.rating}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getTypes(company).map((type) => (
                        <span
                          key={type}
                          className="px-2 py-1 rounded-full bg-secondary text-xs"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-6">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-xs">Claim Settlement</span>
                      </div>
                      <p
                        className={`text-xl font-bold ${
                          (company.claim_settlement_ratio || 0) >= 95
                            ? "text-success"
                            : (company.claim_settlement_ratio || 0) >= 80
                            ? "text-warning"
                            : "text-destructive"
                        }`}
                      >
                        {company.claim_settlement_ratio}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Premium Range</p>
                      <p className="font-medium">{formatPremiumRange(company)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Coverage</p>
                      <p className="font-medium">{formatCoverage(company)}</p>
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
                    {parseFeatures(company.features).slice(0, 4).map((feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-sm"
                      >
                        <CheckCircle className="h-3 w-3 text-success" />
                        {feature}
                      </span>
                    ))}
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