import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Sparkles, ArrowRight, Shield, TrendingUp, Wallet, Code2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => { if (user) navigate("/dashboard"); }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await signIn(loginForm.email, loginForm.password);
      if (error) {
        toast({ title: "Login failed", description: error.message || "Invalid email or password", variant: "destructive" });
        return;
      }
      toast({ title: "Welcome back!", description: "You have been logged in successfully." });
    } catch {
      toast({ title: "Login failed", description: "Network error. Try again.", variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupForm.password.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await signUp(signupForm.email, signupForm.password, signupForm.name);
      if (error) {
        let message = error.message;
        if (message.includes("already registered")) message = "Email already registered. Please login.";
        toast({ title: "Signup failed", description: message, variant: "destructive" });
        return;
      }
      toast({ title: "Account created!", description: "Welcome to CredNest AI." });
    } catch {
      toast({ title: "Signup failed", description: "Network error. Try again.", variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const features = [
    { icon: Sparkles, title: "AI-Powered Insights", description: "Personalized advice from an advanced AI assistant." },
    { icon: Wallet, title: "Smart Budgeting", description: "Track expenses with intelligent categorization." },
    { icon: TrendingUp, title: "Investment Analysis", description: "Compare mutual funds and track your portfolio." },
    { icon: Shield, title: "Loan & Insurance", description: "Best rates across leading Indian banks." },
  ];

  const container: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };
  const item: any = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] } },
  };


  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Aurora background layers */}
      <div className="aurora-bg" />
      <div className="absolute -top-32 -left-32 w-[420px] h-[420px] float-shape" style={{ animationDelay: "0s" }} />
      <div className="absolute top-1/3 -right-40 w-[520px] h-[520px] float-shape" style={{ animationDelay: "-3s" }} />
      <div className="absolute bottom-0 left-1/3 w-[380px] h-[380px] float-shape" style={{ animationDelay: "-6s" }} />
      <div className="absolute inset-0 noise-overlay pointer-events-none" />

      {/* Developer access */}
      <Link
        to="/developer"
        className="fixed bottom-4 right-4 z-50 p-2 rounded-lg bg-card/40 backdrop-blur-xl border border-border/50 text-muted-foreground hover:text-foreground transition-all opacity-50 hover:opacity-100"
        title="Developer Access"
      >
        <Code2 className="h-4 w-4" />
      </Link>

      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <motion.nav
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="flex items-center justify-between glass-card px-5 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-aurora-gradient flex items-center justify-center animate-pulse-glow">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gradient-text font-serif">CredNest AI</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm">
              {["about", "features", "contact"].map((id) => (
                <button
                  key={id}
                  onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
                  className="text-muted-foreground hover:text-foreground transition-colors capitalize"
                >
                  {id}
                </button>
              ))}
            </div>
          </motion.nav>
        </header>

        {/* Hero */}
        <main className="container mx-auto px-4 py-10 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
              <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-primary/30 text-primary text-sm">
                <Sparkles className="h-4 w-4" />
                <span>AI-Powered Financial Intelligence</span>
              </motion.div>
              <motion.h1 variants={item} className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] font-serif">
                Take Control of Your{" "}
                <span className="gradient-text text-glow">Financial Future</span>
              </motion.h1>
              <motion.p variants={item} className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                CredNest AI fuses intelligent budgeting, investment tracking and a personalised
                conversational advisor — built for India, designed for clarity.
              </motion.p>

              {/* Feature grid */}
              <motion.div id="features" variants={container} className="grid sm:grid-cols-2 gap-4">
                {features.map((f) => (
                  <motion.div
                    key={f.title}
                    variants={item}
                    whileHover={{ y: -6, rotateX: 3, rotateY: -3 }}
                    transition={{ type: "spring", stiffness: 200, damping: 18 }}
                    className="glass-card p-5 group perspective-1000"
                  >
                    <div className="w-11 h-11 rounded-xl bg-aurora-gradient/80 flex items-center justify-center mb-3 shadow-glow group-hover:scale-110 transition-transform">
                      <f.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.description}</p>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div variants={item} id="about" className="pt-6 space-y-3">
                <h2 className="text-2xl font-bold gradient-text font-serif">About CredNest AI</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your intelligent financial companion — combining cutting-edge AI with comprehensive
                  tools for budgeting, investing, lending and tax planning.
                </p>
              </motion.div>

              <motion.div variants={item} id="contact" className="pt-2 space-y-2">
                <h2 className="text-2xl font-bold gradient-text font-serif">Contact</h2>
                <p className="text-muted-foreground">
                  Reach us at <span className="text-primary">support@crednest.ai</span>
                </p>
              </motion.div>
            </motion.div>

            {/* Right — 3D orb + auth card */}
            <div className="relative flex justify-center lg:justify-end">
              {/* 3D Orb visual */}
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
                className="absolute -top-16 -right-8 lg:-right-16 perspective-1000 pointer-events-none"
                style={{ width: 280, height: 280 }}
              >
                <div className="orb-3d w-full h-full">
                  <div className="orb-ring" />
                  <div className="orb-ring delay" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30, rotateY: -10 }}
                animate={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                whileHover={{ rotateY: 2, rotateX: -1 }}
                className="w-full max-w-md perspective-1000"
              >
                <Card className="glass-panel border-primary/20 shadow-2xl">
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl font-serif">Welcome</CardTitle>
                    <CardDescription>Sign in or create an account to get started</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary/40 backdrop-blur">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                      </TabsList>

                      <TabsContent value="login">
                        <form onSubmit={handleLogin} className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input type="email" placeholder="you@email.com" value={loginForm.email}
                              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} required />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <div className="relative">
                              <Input type={showPassword ? "text" : "password"} placeholder="Enter password"
                                value={loginForm.password}
                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
                              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                          <Button type="submit" size="lg" className="w-full btn-glow" disabled={isLoading}>
                            {isLoading ? "Signing in..." : "Sign In"} <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </form>
                      </TabsContent>

                      <TabsContent value="signup">
                        <form onSubmit={handleSignup} className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <Input type="text" placeholder="Your name" value={signupForm.name}
                              onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })} required />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input type="email" placeholder="you@email.com" value={signupForm.email}
                              onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} required />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <div className="relative">
                              <Input type={showPassword ? "text" : "password"} placeholder="Create a password"
                                value={signupForm.password}
                                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} required minLength={6} />
                              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                          </div>
                          <Button type="submit" size="lg" className="w-full btn-glow" disabled={isLoading}>
                            {isLoading ? "Creating account..." : "Create Account"} <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </form>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </main>

        <footer className="container mx-auto px-4 py-8 border-t border-border/30 mt-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} CredNest AI. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
