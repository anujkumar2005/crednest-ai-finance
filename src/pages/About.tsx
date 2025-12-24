import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Target,
  Shield,
  Users,
  TrendingUp,
  Award,
  CheckCircle,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Insights",
    description: "Get personalized financial advice powered by advanced AI technology",
  },
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "Your data is protected with enterprise-level encryption",
  },
  {
    icon: TrendingUp,
    title: "Smart Analytics",
    description: "Track your spending patterns and optimize your budget",
  },
  {
    icon: Target,
    title: "Goal Tracking",
    description: "Set and achieve your financial goals with intelligent tracking",
  },
];

const stats = [
  { value: "50+", label: "Partner Banks" },
  { value: "1M+", label: "Users Trust Us" },
  { value: "₹500Cr+", label: "Loans Facilitated" },
  { value: "4.8★", label: "App Rating" },
];

const team = [
  { name: "Rajesh Kumar", role: "CEO & Founder", image: "RK" },
  { name: "Priya Sharma", role: "CTO", image: "PS" },
  { name: "Amit Patel", role: "Head of Product", image: "AP" },
  { name: "Sneha Reddy", role: "Chief Financial Officer", image: "SR" },
];

export default function About() {
  return (
    <DashboardLayout>
      <div className="space-y-12 max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">About CredNest</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">
            Your Trusted Partner in
            <span className="gradient-text block">Financial Success</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            CredNest is India's leading AI-powered financial platform, helping millions
            achieve their financial goals through smart tools, personalized advice, and
            comprehensive banking solutions.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="text-center">
              <CardContent className="pt-6">
                <p className="text-3xl font-bold gradient-text">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mission */}
        <Card>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                <p className="text-muted-foreground mb-4">
                  To democratize financial services in India by leveraging AI and technology
                  to provide everyone access to smart financial tools and personalized guidance.
                </p>
                <ul className="space-y-2">
                  {[
                    "Make financial planning accessible to all",
                    "Provide unbiased loan and insurance comparisons",
                    "Empower users with AI-driven insights",
                    "Simplify complex financial decisions",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="w-full h-64 rounded-xl bg-gold-gradient opacity-20 absolute" />
                <div className="relative z-10 flex items-center justify-center h-64">
                  <Target className="h-32 w-32 text-primary opacity-50" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div>
          <h2 className="text-2xl font-bold text-center mb-8">Why Choose CredNest?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-6 flex gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 h-fit">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Team */}
        <div>
          <h2 className="text-2xl font-bold text-center mb-8">Meet Our Leadership</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {team.map((member) => (
              <Card key={member.name} className="text-center">
                <CardContent className="pt-6">
                  <div className="w-20 h-20 rounded-full bg-gold-gradient flex items-center justify-center mx-auto mb-4 text-xl font-bold text-primary-foreground">
                    {member.image}
                  </div>
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Awards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Awards & Recognition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { title: "Best Fintech App 2024", org: "Economic Times" },
                { title: "Innovation Award", org: "NASSCOM" },
                { title: "Customer Choice Award", org: "Banking Tech Awards" },
              ].map((award) => (
                <div key={award.title} className="p-4 rounded-lg bg-secondary/50 text-center">
                  <Award className="h-8 w-8 text-warning mx-auto mb-2" />
                  <h4 className="font-medium">{award.title}</h4>
                  <p className="text-sm text-muted-foreground">{award.org}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Get in Touch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">support@crednest.in</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">1800-123-4567</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">Mumbai, Maharashtra</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Your Financial Journey?</h2>
          <Link to="/chat">
            <Button variant="gold" size="lg" className="gap-2">
              Talk to AI Advisor <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
