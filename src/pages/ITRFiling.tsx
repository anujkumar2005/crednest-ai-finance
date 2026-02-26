import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  FileText,
  Calendar,
  ClipboardList,
  Clock,
  ExternalLink,
  Users,
  Briefcase,
  Shield,
  CheckCircle2,
  AlertCircle,
  Info,
  IndianRupee,
  Calculator,
  Building2,
  Landmark,
  ArrowRight,
  CircleDollarSign,
  Scale,
  BookOpen,
  HelpCircle,
  Download,
  Eye,
} from "lucide-react";

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

// ITR Form data
const ITR_FORMS = [
  {
    form: "ITR-1 (Sahaj)",
    icon: Users,
    who: "Resident Individuals",
    eligibility: [
      "Total income up to ₹50 Lakhs",
      "Salary/Pension income",
      "One house property (not loss b/f)",
      "Other sources (interest, dividends, etc.)",
      "Agricultural income up to ₹5,000",
    ],
    notFor: [
      "Income from capital gains",
      "More than one house property",
      "Business or profession income",
      "Foreign income or foreign assets",
      "Director in a company",
      "Income from lottery/racehorses",
    ],
    filingMode: "Online (JSON upload or direct filing)",
    complexity: "Simple",
  },
  {
    form: "ITR-2",
    icon: Briefcase,
    who: "Individuals & HUFs without business income",
    eligibility: [
      "Income from salary/pension",
      "Multiple house properties",
      "Capital gains (STCG & LTCG)",
      "Foreign income & foreign assets",
      "Director in a company",
      "Unlisted equity share investment",
      "Income from any source (no business)",
    ],
    notFor: [
      "Income from business or profession",
      "Presumptive income under 44AD/44ADA/44AE",
    ],
    filingMode: "Online (JSON upload or direct filing)",
    complexity: "Moderate",
  },
  {
    form: "ITR-3",
    icon: Building2,
    who: "Individuals & HUFs with business/profession income",
    eligibility: [
      "Business or professional income",
      "Income from all sources including salary, capital gains",
      "Partner in a firm (share of profit)",
      "Freelancers and consultants",
      "Income from intraday trading or F&O",
    ],
    notFor: [
      "Presumptive income (use ITR-4 instead)",
      "Companies, firms, LLPs",
    ],
    filingMode: "Online (JSON upload or direct filing)",
    complexity: "Complex",
  },
  {
    form: "ITR-4 (Sugam)",
    icon: Calculator,
    who: "Individuals, HUFs & Firms (Presumptive Taxation)",
    eligibility: [
      "Business income under Sec 44AD (turnover ≤ ₹3 Cr)",
      "Professional income under Sec 44ADA (receipts ≤ ₹75L)",
      "Income from goods carriage Sec 44AE",
      "Salary/Pension + Presumptive business income",
      "One house property",
    ],
    notFor: [
      "Total income exceeding ₹50 Lakhs",
      "Capital gains income",
      "More than one house property",
      "Foreign income or assets",
      "Director of a company",
    ],
    filingMode: "Online (JSON upload or direct filing)",
    complexity: "Simple to Moderate",
  },
  {
    form: "ITR-5",
    icon: Users,
    who: "Partnership Firms, LLPs, AOPs, BOIs, Cooperatives",
    eligibility: [
      "Partnership firms",
      "Limited Liability Partnerships (LLPs)",
      "Association of Persons (AOP)",
      "Body of Individuals (BOI)",
      "Cooperative societies",
      "Local authorities",
    ],
    notFor: [
      "Individuals or HUFs",
      "Companies (use ITR-6)",
    ],
    filingMode: "Online (JSON upload only)",
    complexity: "Complex",
  },
  {
    form: "ITR-6",
    icon: Landmark,
    who: "Companies (other than Sec 11 claims)",
    eligibility: [
      "All companies registered under Companies Act",
      "Companies not claiming exemption under Sec 11",
      "Both Indian and foreign companies",
    ],
    notFor: [
      "Companies claiming Sec 11 exemption (use ITR-7)",
      "Individuals, HUFs, firms",
    ],
    filingMode: "Online (mandatory e-filing)",
    complexity: "Very Complex",
  },
  {
    form: "ITR-7",
    icon: Shield,
    who: "Trusts, Political Parties, Institutions, Colleges",
    eligibility: [
      "Persons including companies under Sec 139(4A/4B/4C/4D/4E/4F)",
      "Charitable & religious trusts",
      "Political parties",
      "Scientific research associations",
      "Universities & educational institutions",
    ],
    notFor: ["General taxpayers", "Regular companies without Sec 11"],
    filingMode: "Online (mandatory e-filing)",
    complexity: "Specialized",
  },
];

// Penalty calculator data
const PENALTY_SECTIONS = [
  {
    section: "234A",
    title: "Late Filing Interest",
    desc: "1% per month (or part) on unpaid tax from due date to actual filing date",
    rate: "1% per month",
  },
  {
    section: "234B",
    title: "Default in Advance Tax",
    desc: "1% per month on shortfall if advance tax paid is less than 90% of assessed tax",
    rate: "1% per month",
  },
  {
    section: "234C",
    title: "Deferment of Advance Tax",
    desc: "1% per month for each quarter of shortfall in advance tax installments",
    rate: "1% per month",
  },
  {
    section: "234F",
    title: "Late Filing Fee",
    desc: "₹5,000 if filed after due date but before 31 Dec; ₹10,000 after 31 Dec. If income ≤ ₹5L, max ₹1,000",
    rate: "₹1,000 - ₹10,000",
  },
];

const FILING_STEPS = [
  {
    step: 1,
    title: "Collect Documents",
    desc: "Form 16, Form 26AS, AIS (Annual Information Statement), TIS (Taxpayer Information Summary), bank statements, investment proofs, rent receipts, capital gains statements.",
    tip: "Download AIS from incometax.gov.in → AIS tab. It shows all your financial transactions reported to IT dept.",
  },
  {
    step: 2,
    title: "Reconcile Form 26AS & AIS",
    desc: "Cross-verify TDS entries in Form 26AS with your Form 16. Check AIS for any unreported high-value transactions like property purchases, mutual fund sales.",
    tip: "If AIS shows incorrect data, submit feedback on the portal to flag discrepancies before filing.",
  },
  {
    step: 3,
    title: "Choose Tax Regime",
    desc: "Decide between Old Regime (with deductions 80C/80D/HRA) and New Regime (lower rates, limited deductions). Use the Tax Planning module to compare.",
    tip: "New regime is default from FY 2023-24. You must explicitly opt for old regime while filing if beneficial.",
  },
  {
    step: 4,
    title: "Select Correct ITR Form",
    desc: "Choose ITR-1 for simple salary income (up to ₹50L), ITR-2 for capital gains, ITR-3 for business income, ITR-4 for presumptive taxation.",
    tip: "Wrong form selection leads to a defective return notice u/s 139(9). Always verify eligibility first.",
  },
  {
    step: 5,
    title: "Login & Start Filing",
    desc: "Visit incometax.gov.in → Login with PAN → e-File → Income Tax Returns → File Income Tax Return → Select AY, filing type (Original/Revised), and ITR form.",
    tip: "Use 'Pre-fill' option to auto-populate salary, TDS, and bank details from Form 26AS.",
  },
  {
    step: 6,
    title: "Fill Personal & Income Details",
    desc: "Enter personal info, employer details, salary breakup (Basic, HRA, DA, Special Allowance), house property income, capital gains, other sources.",
    tip: "For salaried: Basic + DA determines HRA exemption. Ensure correct breakup from Form 16 Part B.",
  },
  {
    step: 7,
    title: "Enter Deductions & Tax Payments",
    desc: "Claim deductions: 80C (₹1.5L), 80D (₹25K-₹1L), 80CCD(1B) NPS (₹50K), 80E education loan, 80G donations, 80TTA savings interest (₹10K).",
    tip: "Under new regime, only NPS employer contribution (80CCD(2)) and standard deduction of ₹75K are allowed.",
  },
  {
    step: 8,
    title: "Verify Tax Computation",
    desc: "Review auto-calculated tax liability. Check TDS credit (26AS), advance tax (Challan 280), self-assessment tax. If tax due, pay via e-Pay Tax before filing.",
    tip: "Interest u/s 234A/234B/234C is auto-calculated. Pay self-assessment tax using Challan 280 → Major Head 0021.",
  },
  {
    step: 9,
    title: "Submit & e-Verify",
    desc: "Preview the return, submit it, and e-verify within 30 days using: Aadhaar OTP, Net Banking, Bank Account EVC, Demat Account EVC, or DSC.",
    tip: "Aadhaar OTP is the fastest method. If you miss 30-day e-verify window, the return is treated as not filed.",
  },
  {
    step: 10,
    title: "Track & Download",
    desc: "After e-verification, track processing status on the portal. Download ITR-V (acknowledgement) and intimation u/s 143(1) for your records.",
    tip: "Keep ITR-V safe — you may need it for loan applications, visa processing, and future assessments.",
  },
];

const IMPORTANT_DATES = [
  { date: "15 Jun", event: "Advance Tax - Q1 (15% cumulative)", category: "advance" },
  { date: "15 Sep", event: "Advance Tax - Q2 (45% cumulative)", category: "advance" },
  { date: "15 Dec", event: "Advance Tax - Q3 (75% cumulative)", category: "advance" },
  { date: "15 Mar", event: "Advance Tax - Q4 (100% cumulative)", category: "advance" },
  { date: "31 Jul", event: "ITR Due Date - Non-audit individuals & HUFs", category: "filing" },
  { date: "31 Oct", event: "ITR Due Date - Audit cases, firms, companies", category: "filing" },
  { date: "30 Nov", event: "ITR Due Date - Transfer Pricing cases", category: "filing" },
  { date: "31 Dec", event: "Belated Return / Revised Return deadline", category: "belated" },
  { date: "31 Mar", event: "Updated Return (ITR-U) within 1 year", category: "updated" },
  { date: "31 Mar +1yr", event: "Updated Return (ITR-U) within 2 years (25% extra tax)", category: "updated" },
];

const DOCUMENTS_CHECKLIST = [
  { category: "Identity & Basic", items: ["PAN Card", "Aadhaar Card (linked to PAN)", "Bank account details (IFSC, account number)"] },
  { category: "Income Proofs", items: ["Form 16 (Parts A & B) from employer", "Form 16A (TDS on non-salary income)", "Salary slips (for breakup verification)", "Interest certificates from banks (FD/RD/Savings)", "Rental income documents & municipal tax receipts"] },
  { category: "Tax Statements", items: ["Form 26AS (Annual Tax Statement)", "AIS (Annual Information Statement)", "TIS (Taxpayer Information Summary)", "Challan 280 receipts (advance/self-assessment tax)"] },
  { category: "Deduction Proofs", items: ["PPF/ELSS/NPS investment statements (80C)", "Life insurance premium receipts (80C)", "Health insurance premium receipts (80D)", "Home loan interest certificate (Sec 24b)", "Education loan interest certificate (80E)", "Donation receipts with PAN of donee (80G)"] },
  { category: "Capital Gains", items: ["Stock/MF transaction statements (CAMS/KFintech)", "Property sale/purchase deeds", "Cost inflation index records for indexation", "Capital gains statement from broker"] },
  { category: "HRA & Housing", items: ["Rent receipts (monthly/annual)", "Landlord PAN (if annual rent > ₹1L)", "Rent agreement copy", "Home loan statement (principal + interest breakup)"] },
];

const FAQ_DATA = [
  { q: "Who needs to file ITR in India?", a: "You must file if: gross income exceeds ₹3L (old regime) or ₹4L (new regime), you want to claim a refund, you have foreign assets/income, you're a company/firm, electricity bill > ₹1L/year, or spent > ₹2L on foreign travel, or deposited > ₹1Cr in current account." },
  { q: "What is the difference between AY and FY?", a: "Financial Year (FY) is the year you earn income (April-March). Assessment Year (AY) is the next year when you file the return. E.g., income earned in FY 2025-26 is assessed in AY 2026-27." },
  { q: "Can I revise my ITR after filing?", a: "Yes, under Sec 139(5), you can file a revised return before 31st December of the AY (or before assessment completion). No limit on number of revisions." },
  { q: "What is ITR-U (Updated Return)?", a: "ITR-U allows filing/updating returns within 24 months from end of AY. Additional tax: 25% if filed within 12 months, 50% if within 24 months. Cannot be used to reduce tax or increase refund." },
  { q: "What happens if I miss the filing deadline?", a: "Belated return can be filed till 31 Dec of AY with ₹5,000 late fee (₹1,000 if income ≤ ₹5L). You lose: carry-forward of losses (except house property), certain deductions, and pay interest u/s 234A." },
  { q: "Is e-verification mandatory?", a: "Yes, returns must be e-verified within 30 days of filing (earlier it was 120 days). Without e-verification, the return is treated as not filed." },
  { q: "Can I file ITR without Form 16?", a: "Yes, use Form 26AS and AIS to get TDS and income details. You can file based on salary slips and bank statements even without Form 16." },
  { q: "How long should I keep ITR records?", a: "Keep all ITR acknowledgements, computation sheets, and supporting documents for at least 6 years from the end of the relevant AY (7 years in transfer pricing cases)." },
];

export default function ITRFiling() {
  const [penaltyIncome, setPenaltyIncome] = useState(800000);
  const [penaltyTaxDue, setPenaltyTaxDue] = useState(50000);
  const [penaltyMonthsLate, setPenaltyMonthsLate] = useState(3);
  const [selectedForm, setSelectedForm] = useState<string | null>(null);

  // Penalty calculations
  const penaltyCalc = useMemo(() => {
    const interest234A = Math.ceil(penaltyTaxDue * 0.01 * penaltyMonthsLate);
    const lateFee234F = penaltyIncome <= 500000 ? 1000 : (penaltyMonthsLate <= 5 ? 5000 : 10000);
    const totalPenalty = interest234A + lateFee234F;
    return { interest234A, lateFee234F, totalPenalty };
  }, [penaltyIncome, penaltyTaxDue, penaltyMonthsLate]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold gradient-text flex items-center gap-2">
            <FileText className="h-7 w-7" />
            ITR Filing & Tax Returns
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete guide to filing Income Tax Returns in India • FY 2025-26 (AY 2026-27)
          </p>
        </div>

        <Tabs defaultValue="guide" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="guide" className="flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Filing Guide</span>
              <span className="sm:hidden">Guide</span>
            </TabsTrigger>
            <TabsTrigger value="forms" className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">ITR Forms</span>
              <span className="sm:hidden">Forms</span>
            </TabsTrigger>
            <TabsTrigger value="dates" className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Due Dates</span>
              <span className="sm:hidden">Dates</span>
            </TabsTrigger>
            <TabsTrigger value="penalty" className="flex items-center gap-1.5">
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">Penalties</span>
              <span className="sm:hidden">Penalty</span>
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4" />
              <span>FAQ</span>
            </TabsTrigger>
          </TabsList>

          {/* ========== Filing Guide ========== */}
          <TabsContent value="guide" className="space-y-6">
            {/* Quick Overview Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-primary/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Due Date (Non-audit)</p>
                    <p className="font-bold">31 Jul 2026</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-500/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <IndianRupee className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Basic Exemption (New)</p>
                    <p className="font-bold">₹4,00,000</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-blue-500/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Shield className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rebate u/s 87A (New)</p>
                    <p className="font-bold">Up to ₹60,000</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-yellow-500/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Clock className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">e-Verify Within</p>
                    <p className="font-bold">30 Days</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Step-by-Step Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Complete Step-by-Step ITR Filing Guide
                </CardTitle>
                <CardDescription>Follow these 10 steps to file your Income Tax Return correctly</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {FILING_STEPS.map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {item.step}
                        </div>
                        {item.step < 10 && <div className="w-0.5 h-full bg-border mt-2" />}
                      </div>
                      <div className="flex-1 min-w-0 pb-6">
                        <h4 className="font-semibold">{item.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                        <div className="mt-2 p-2 rounded-lg bg-accent/50 flex gap-2">
                          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Pro Tip:</span> {item.tip}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Documents Checklist */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Documents Checklist
                </CardTitle>
                <CardDescription>Gather all these documents before you start filing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {DOCUMENTS_CHECKLIST.map((cat) => (
                    <div key={cat.category} className="p-4 rounded-lg border space-y-2">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        {cat.category}
                      </h4>
                      <ul className="space-y-1.5">
                        {cat.items.map((doc) => (
                          <li key={doc} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <ArrowRight className="h-3 w-3 shrink-0 mt-0.5" />
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Official Portals & Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { label: "Income Tax e-Filing Portal", url: "https://www.incometax.gov.in", desc: "File returns, check status, download forms" },
                    { label: "Form 26AS (Tax Credit)", url: "https://www.tdscpc.gov.in", desc: "View TDS credits and tax payments" },
                    { label: "e-Pay Tax (Challan 280)", url: "https://onlineservices.tin.egov-nsdl.com/etaxnew/tdsnontds.jsp", desc: "Pay advance tax, self-assessment tax" },
                    { label: "Refund Status (NSDL)", url: "https://tin.tin.nsdl.com/oltas/refund-status-pan.html", desc: "Track your income tax refund" },
                    { label: "PAN-Aadhaar Linking", url: "https://www.incometax.gov.in/iec/foportal/help/how-to-link-aadhaar", desc: "Link Aadhaar to PAN (mandatory)" },
                    { label: "Tax Calendar", url: "https://www.incometax.gov.in/iec/foportal/help/tax-calendar", desc: "All due dates and deadlines" },
                  ].map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{link.label}</p>
                        <p className="text-xs text-muted-foreground">{link.desc}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== ITR Forms ========== */}
          <TabsContent value="forms" className="space-y-6">
            {/* Form Selector Helper */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Eye className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Which ITR form should I use?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Salaried (income ≤ ₹50L, no capital gains):</strong> ITR-1 •
                      <strong> Salaried + Capital Gains:</strong> ITR-2 •
                      <strong> Business/Freelancer:</strong> ITR-3 •
                      <strong> Presumptive Taxation:</strong> ITR-4
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* All ITR Forms */}
            <div className="grid gap-4 md:grid-cols-2">
              {ITR_FORMS.map((itr) => (
                <Card
                  key={itr.form}
                  className={`cursor-pointer transition-all hover:shadow-md ${selectedForm === itr.form ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedForm(selectedForm === itr.form ? null : itr.form)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <itr.icon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">{itr.form}</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">{itr.complexity}</Badge>
                      </div>
                    </div>
                    <CardDescription>{itr.who}</CardDescription>
                  </CardHeader>
                  {selectedForm === itr.form && (
                    <CardContent className="space-y-4 border-t pt-4">
                      <div>
                        <h4 className="text-sm font-semibold text-green-600 flex items-center gap-1 mb-2">
                          <CheckCircle2 className="h-4 w-4" /> Eligible If:
                        </h4>
                        <ul className="space-y-1">
                          {itr.eligibility.map((e) => (
                            <li key={e} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <ArrowRight className="h-3 w-3 shrink-0 mt-0.5 text-green-500" />
                              {e}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-destructive flex items-center gap-1 mb-2">
                          <AlertCircle className="h-4 w-4" /> NOT For:
                        </h4>
                        <ul className="space-y-1">
                          {itr.notFor.map((n) => (
                            <li key={n} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <AlertCircle className="h-3 w-3 shrink-0 mt-0.5 text-destructive" />
                              {n}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-2 rounded-lg bg-accent/50 text-xs">
                        <span className="font-medium">Filing Mode:</span>{" "}
                        <span className="text-muted-foreground">{itr.filingMode}</span>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ========== Due Dates ========== */}
          <TabsContent value="dates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Important Due Dates - FY 2025-26 (AY 2026-27)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Advance Tax Timeline */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <CircleDollarSign className="h-4 w-4 text-primary" />
                      Advance Tax Installments
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {IMPORTANT_DATES.filter(d => d.category === "advance").map((item, idx) => (
                        <div key={item.event} className="rounded-lg border p-4 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                          <div className="ml-2">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-bold text-sm">{item.date}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{item.event}</p>
                            <Progress value={[15, 45, 75, 100][idx]} className="mt-2 h-1.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-3 rounded-lg bg-accent/50">
                      <p className="text-xs text-muted-foreground">
                        <Info className="h-3 w-3 inline mr-1" />
                        Advance tax is mandatory if estimated tax liability exceeds ₹10,000 in a year. Salaried individuals whose tax is fully deducted as TDS need not pay advance tax.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Filing Deadlines */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      ITR Filing Deadlines
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {IMPORTANT_DATES.filter(d => d.category === "filing").map((item) => (
                        <div key={item.event} className="rounded-lg border p-4 border-green-500/20 bg-green-500/5">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-4 w-4 text-green-500" />
                            <span className="font-bold text-sm">{item.date} 2026</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.event}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Belated & Updated Returns */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      Belated & Updated Returns
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {IMPORTANT_DATES.filter(d => d.category === "belated" || d.category === "updated").map((item) => (
                        <div key={item.event} className={`rounded-lg border p-4 ${item.category === "belated" ? "border-yellow-500/20 bg-yellow-500/5" : "border-orange-500/20 bg-orange-500/5"}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            <span className="font-bold text-sm">{item.date}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.event}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Refund Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Tax Refund Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="p-4 rounded-lg border bg-green-500/5 border-green-500/20">
                    <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Processing Time
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Refunds are typically processed within 20-45 days after e-verification. Refund is credited directly to bank account linked with PAN.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border bg-blue-500/5 border-blue-500/20">
                    <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      Interest on Refund (Sec 244A)
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      You receive 0.5% per month simple interest on the refund amount. Interest is calculated from 1st April of the AY to date of refund grant.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border bg-yellow-500/5 border-yellow-500/20">
                    <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      Refund Not Received?
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Check status on incometax.gov.in or NSDL. Common issues: incorrect bank details, unlinked PAN-Aadhaar, outstanding demand, or return under processing.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== Penalty Calculator ========== */}
          <TabsContent value="penalty" className="space-y-6">
            {/* Penalty Sections Overview */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PENALTY_SECTIONS.map((p) => (
                <Card key={p.section}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">Sec {p.section}</Badge>
                      <CardTitle className="text-sm">{p.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                    <p className="text-sm font-bold mt-2 text-destructive">{p.rate}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Penalty Calculator */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Late Filing Penalty Calculator
                  </CardTitle>
                  <CardDescription>Estimate penalties for delayed ITR filing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Gross Annual Income</Label>
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={penaltyIncome}
                        onChange={(e) => setPenaltyIncome(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Unpaid Tax Amount</Label>
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={penaltyTaxDue}
                        onChange={(e) => setPenaltyTaxDue(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Months Late (after due date)</Label>
                    <Select value={String(penaltyMonthsLate)} onValueChange={(v) => setPenaltyMonthsLate(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                          <SelectItem key={m} value={String(m)}>{m} month{m > 1 ? "s" : ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Penalty Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">Interest u/s 234A</p>
                        <p className="text-xs text-muted-foreground">1% × {formatCurrency(penaltyTaxDue)} × {penaltyMonthsLate} months</p>
                      </div>
                      <span className="font-bold text-destructive">{formatCurrency(penaltyCalc.interest234A)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">Late Fee u/s 234F</p>
                        <p className="text-xs text-muted-foreground">
                          {penaltyIncome <= 500000 ? "Income ≤ ₹5L → ₹1,000" : penaltyMonthsLate <= 5 ? "Filed before 31 Dec → ₹5,000" : "Filed after 31 Dec → ₹10,000"}
                        </p>
                      </div>
                      <span className="font-bold text-destructive">{formatCurrency(penaltyCalc.lateFee234F)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="font-semibold">Total Estimated Penalty</p>
                      <span className="text-xl font-bold text-destructive">{formatCurrency(penaltyCalc.totalPenalty)}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-accent/50">
                    <p className="text-xs text-muted-foreground">
                      <Info className="h-3 w-3 inline mr-1" />
                      This is an estimate. Actual penalties may include Sec 234B (advance tax default) and Sec 234C (deferment). Consult a CA for precise calculations.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Common Mistakes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Common Mistakes That Lead to Penalties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { mistake: "Not reporting all bank accounts", tip: "All savings/current accounts must be declared, even with zero balance or dormant accounts." },
                    { mistake: "Missing capital gains from MF/stocks", tip: "Even ₹1 gain from equity or debt MF redemption must be reported. Check broker statements." },
                    { mistake: "Wrong ITR form selection", tip: "Filing ITR-1 with capital gains leads to defective return notice u/s 139(9)." },
                    { mistake: "Not matching Form 26AS with TDS", tip: "Mismatch causes processing delays and notices. Verify every TDS entry before filing." },
                    { mistake: "Forgetting to verify AIS", tip: "AIS may have high-value transactions you missed. Submit feedback for discrepancies." },
                    { mistake: "Not e-verifying within 30 days", tip: "Unverified returns are treated as not filed. Use Aadhaar OTP for instant verification." },
                    { mistake: "Ignoring interest income from FDs/savings", tip: "FD/savings interest is fully taxable. Even if TDS is deducted, full interest must be declared." },
                    { mistake: "Claiming HRA without actual rent payment", tip: "HRA exemption requires genuine rent payment. Fake claims attract penalties under Sec 270A." },
                  ].map((item) => (
                    <div key={item.mistake} className="flex gap-3 p-3 rounded-lg border">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{item.mistake}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.tip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== FAQ ========== */}
          <TabsContent value="faq" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Frequently Asked Questions - ITR Filing
                </CardTitle>
                <CardDescription>Everything you need to know about filing income tax returns in India</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {FAQ_DATA.map((faq, index) => (
                    <AccordionItem key={index} value={`faq-${index}`}>
                      <AccordionTrigger className="text-sm text-left">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Key Sections Reference */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Key Income Tax Sections - Quick Reference
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { sec: "Sec 80C", desc: "Deductions up to ₹1.5L (PPF, ELSS, LIC, NPS, etc.)" },
                    { sec: "Sec 80D", desc: "Medical insurance premium (₹25K self, ₹50K parents 60+)" },
                    { sec: "Sec 80CCD(1B)", desc: "Additional NPS deduction of ₹50,000" },
                    { sec: "Sec 80E", desc: "Education loan interest (no upper limit, 8 years)" },
                    { sec: "Sec 80G", desc: "Donations to specified funds (50% or 100% deduction)" },
                    { sec: "Sec 80TTA/80TTB", desc: "Savings interest ₹10K (TTA) / Senior ₹50K (TTB)" },
                    { sec: "Sec 24(b)", desc: "Home loan interest up to ₹2L (self-occupied)" },
                    { sec: "Sec 87A", desc: "Rebate: Old ₹12.5K (≤₹5L) / New ₹60K (≤₹12L)" },
                    { sec: "Sec 10(14)", desc: "HRA exemption for salaried individuals" },
                    { sec: "Sec 44AD", desc: "Presumptive taxation for business (6-8% of turnover)" },
                    { sec: "Sec 44ADA", desc: "Presumptive for professionals (50% of receipts)" },
                    { sec: "Sec 139(1)", desc: "Due dates for filing original return" },
                  ].map((s) => (
                    <div key={s.sec} className="flex gap-2 p-2 rounded-lg border text-sm">
                      <Badge variant="outline" className="shrink-0 h-fit">{s.sec}</Badge>
                      <span className="text-xs text-muted-foreground">{s.desc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
