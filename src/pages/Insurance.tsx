import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

interface InsuranceCompany {
  id: string;
  name: string;
  claimSettlementRatio: number;
  types: string[];
  premiumRange: string;
  coverageRange: string;
  features: string[];
  rating: number;
  website: string;
  customerCare: string;
}

const insuranceCompanies: InsuranceCompany[] = [
  {
    id: "1",
    name: "LIC of India",
    claimSettlementRatio: 98.5,
    types: ["Life", "Health", "Term"],
    premiumRange: "₹500 - ₹50,000/month",
    coverageRange: "₹5L - ₹5Cr",
    features: ["Highest CSR", "Wide network", "Maturity benefits"],
    rating: 4.5,
    website: "https://licindia.in/",
    customerCare: "1800-22-4040",
  },
  {
    id: "2",
    name: "HDFC Life",
    claimSettlementRatio: 98.0,
    types: ["Life", "Term", "ULIP"],
    premiumRange: "₹400 - ₹40,000/month",
    coverageRange: "₹10L - ₹10Cr",
    features: ["Quick claim process", "Online services", "Riders available"],
    rating: 4.6,
    website: "https://www.hdfclife.com/",
    customerCare: "1800-266-9777",
  },
  {
    id: "3",
    name: "ICICI Prudential",
    claimSettlementRatio: 97.8,
    types: ["Life", "Term", "Health"],
    premiumRange: "₹350 - ₹35,000/month",
    coverageRange: "₹5L - ₹5Cr",
    features: ["Digital first", "Flexible plans", "Easy renewal"],
    rating: 4.4,
    website: "https://www.iciciprulife.com/",
    customerCare: "1800-200-4444",
  },
  {
    id: "4",
    name: "Star Health",
    claimSettlementRatio: 67.2,
    types: ["Health"],
    premiumRange: "₹300 - ₹20,000/month",
    coverageRange: "₹2L - ₹1Cr",
    features: ["No medical check-up", "Cashless claims", "Wide hospital network"],
    rating: 4.2,
    website: "https://www.starhealth.in/",
    customerCare: "1800-425-2255",
  },
  {
    id: "5",
    name: "Bajaj Allianz",
    claimSettlementRatio: 98.4,
    types: ["Life", "Health", "Car", "Home"],
    premiumRange: "₹250 - ₹30,000/month",
    coverageRange: "₹1L - ₹5Cr",
    features: ["Multi-product", "Quick settlement", "Mobile app"],
    rating: 4.3,
    website: "https://www.bajajallianz.com/",
    customerCare: "1800-209-5858",
  },
  {
    id: "6",
    name: "Tata AIG",
    claimSettlementRatio: 96.5,
    types: ["Health", "Car", "Home", "Travel"],
    premiumRange: "₹200 - ₹25,000/month",
    coverageRange: "₹2L - ₹2Cr",
    features: ["Comprehensive plans", "24x7 support", "Global coverage"],
    rating: 4.4,
    website: "https://www.tataaig.com/",
    customerCare: "1800-266-7780",
  },
];

const insuranceTypes = [
  { icon: Heart, label: "Life Insurance", color: "text-destructive" },
  { icon: Shield, label: "Health Insurance", color: "text-success" },
  { icon: Car, label: "Vehicle Insurance", color: "text-info" },
  { icon: Home, label: "Home Insurance", color: "text-primary" },
];

export default function Insurance() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Insurance Comparison</h1>
          <p className="text-muted-foreground mt-1">
            Compare insurance providers and find the best coverage
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
          {insuranceCompanies.map((company, index) => (
            <Card key={company.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Company Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{company.name}</h3>
                      {company.claimSettlementRatio >= 98 && (
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
                            i < Math.floor(company.rating)
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
                      {company.types.map((type) => (
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
                          company.claimSettlementRatio >= 95
                            ? "text-success"
                            : company.claimSettlementRatio >= 80
                            ? "text-warning"
                            : "text-destructive"
                        }`}
                      >
                        {company.claimSettlementRatio}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Premium Range</p>
                      <p className="font-medium">{company.premiumRange}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Coverage</p>
                      <p className="font-medium">{company.coverageRange}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => window.open(`tel:${company.customerCare}`)}
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </Button>
                    <Button
                      variant="gold"
                      size="sm"
                      className="gap-1"
                      onClick={() => window.open(company.website, "_blank")}
                    >
                      Get Quote
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex flex-wrap gap-2">
                    {company.features.map((feature) => (
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
