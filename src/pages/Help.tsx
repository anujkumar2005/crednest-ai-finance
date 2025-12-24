import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
  Search,
  HelpCircle,
  MessageSquare,
  CreditCard,
  PiggyBank,
  Shield,
  Calculator,
  FileText,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  ExternalLink,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const categories = [
  {
    icon: CreditCard,
    title: "Loans & EMI",
    description: "Learn about loan types, EMI calculations, and eligibility",
  },
  {
    icon: PiggyBank,
    title: "Savings & Investments",
    description: "Tips on saving money and investment strategies",
  },
  {
    icon: Shield,
    title: "Insurance",
    description: "Understanding different insurance policies",
  },
  {
    icon: Calculator,
    title: "Budgeting",
    description: "How to create and manage your budget",
  },
  {
    icon: MessageSquare,
    title: "AI Assistant",
    description: "Getting the most from CredNest AI",
  },
  {
    icon: FileText,
    title: "Account & Profile",
    description: "Managing your account settings",
  },
];

const faqs = [
  {
    category: "General",
    questions: [
      {
        q: "What is CredNest?",
        a: "CredNest is an AI-powered financial platform that helps you manage your finances, compare loans, track budgets, and get personalized financial advice. We partner with 50+ banks and financial institutions across India.",
      },
      {
        q: "Is CredNest free to use?",
        a: "Yes! CredNest is completely free for all users. We earn through partnerships with banks when you apply for financial products through our platform.",
      },
      {
        q: "Is my data safe with CredNest?",
        a: "Absolutely. We use bank-grade 256-bit encryption to protect your data. We never share your personal information without your consent.",
      },
    ],
  },
  {
    category: "Loans",
    questions: [
      {
        q: "How is EMI calculated?",
        a: "EMI (Equated Monthly Installment) is calculated using the formula: EMI = [P x R x (1+R)^N]/[(1+R)^N-1], where P is principal amount, R is monthly interest rate, and N is tenure in months. Our AI can calculate this instantly for you!",
      },
      {
        q: "What affects my loan eligibility?",
        a: "Key factors include: CIBIL score (750+ is ideal), monthly income, existing EMI obligations, employment stability, age, and the loan-to-value ratio for secured loans.",
      },
      {
        q: "Can I compare loans from different banks?",
        a: "Yes! Our Loans page shows real-time rates from 20+ banks. You can compare interest rates, processing fees, and features side by side.",
      },
      {
        q: "What documents are needed for a loan?",
        a: "Common documents include: Aadhaar card, PAN card, salary slips (last 3 months), bank statements (last 6 months), Form 16, and address proof. Requirements may vary by loan type and bank.",
      },
    ],
  },
  {
    category: "Savings & Investments",
    questions: [
      {
        q: "What is the 50-30-20 budget rule?",
        a: "It's a simple budgeting guideline: 50% of income for needs (rent, food, utilities), 30% for wants (entertainment, dining out), and 20% for savings and debt repayment.",
      },
      {
        q: "What is SIP and how does it work?",
        a: "SIP (Systematic Investment Plan) allows you to invest a fixed amount regularly in mutual funds. It helps average out market volatility and builds wealth over time through the power of compounding.",
      },
      {
        q: "How much emergency fund should I have?",
        a: "Financial experts recommend having 3-6 months of expenses as an emergency fund. If you have dependents or variable income, aim for 6-12 months.",
      },
    ],
  },
  {
    category: "Insurance",
    questions: [
      {
        q: "What's the difference between term and whole life insurance?",
        a: "Term insurance covers you for a specific period (10-30 years) at lower premiums. Whole life insurance covers you for lifetime and includes a savings component but costs more.",
      },
      {
        q: "How much health insurance coverage do I need?",
        a: "A general rule is to have coverage of at least 10x your annual salary, or minimum ₹5-10 lakhs for individuals and ₹15-25 lakhs for families. Consider your city's healthcare costs.",
      },
    ],
  },
  {
    category: "AI Assistant",
    questions: [
      {
        q: "What can the AI Assistant help me with?",
        a: "Our AI can calculate EMIs, check loan eligibility, provide personalized savings tips, answer financial questions, compare products, and give guidance based on your financial situation.",
      },
      {
        q: "Are AI responses accurate?",
        a: "Our AI uses verified financial data and follows RBI guidelines. However, for major financial decisions, we recommend consulting with a certified financial advisor.",
      },
    ],
  },
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqs.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (faq) =>
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.questions.length > 0);

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <HelpCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Help Center</span>
          </div>
          <h1 className="text-4xl font-bold">How can we help you?</h1>
          <p className="text-muted-foreground">
            Find answers to common questions or ask our AI assistant
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for help..."
            className="pl-12 h-12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Quick Help Categories */}
        {!searchQuery && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.title} className="hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <category.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{category.title}</h3>
                    <p className="text-xs text-muted-foreground">{category.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* FAQs */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">
            {searchQuery ? "Search Results" : "Frequently Asked Questions"}
          </h2>
          {filteredFaqs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No results found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Try different keywords or ask our AI assistant
                </p>
                <Link to="/chat">
                  <Button variant="gold" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Ask AI Assistant
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            filteredFaqs.map((category) => (
              <Card key={category.category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((faq, index) => (
                      <AccordionItem key={index} value={`${category.category}-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle>Still need help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Link to="/chat" className="block">
                <div className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-center">
                  <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium">Chat with AI</h4>
                  <p className="text-sm text-muted-foreground">Get instant answers</p>
                </div>
              </Link>
              <a href="mailto:support@crednest.in" className="block">
                <div className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-center">
                  <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium">Email Support</h4>
                  <p className="text-sm text-muted-foreground">support@crednest.in</p>
                </div>
              </a>
              <a href="tel:18001234567" className="block">
                <div className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-center">
                  <Phone className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium">Call Us</h4>
                  <p className="text-sm text-muted-foreground">1800-123-4567</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Quick Financial Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                "Always compare at least 3 loan offers before applying",
                "Maintain a CIBIL score above 750 for best loan rates",
                "Never exceed 40% of your income on EMIs",
                "Start SIP early - even ₹500/month can grow significantly",
                "Review your insurance coverage annually",
                "Keep 3-6 months expenses as emergency fund",
              ].map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary font-bold">{index + 1}.</span>
                  <span className="text-muted-foreground">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
