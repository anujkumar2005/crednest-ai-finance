import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Sparkles, ArrowRight, Shield, TrendingUp, Wallet, Code2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import heroBg from "@/assets/hero-bg.jpg";

export default function Landing() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "" });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await signIn(loginForm.email, loginForm.password);
      
      if (error) {
        toast({
          title: "Login failed",
          description: error.message || "Invalid email or password",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      });
    } catch (err: any) {
      console.error("Login error:", err);
      toast({
        title: "Login failed",
        description: "A network error occurred. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupForm.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await signUp(signupForm.email, signupForm.password, signupForm.name);
      
      if (error) {
        let message = error.message;
        if (message.includes("already registered")) {
          message = "This email is already registered. Please login instead.";
        }
        toast({
          title: "Signup failed",
          description: message,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Account created!",
        description: "Welcome to CredNest AI.",
      });
    } catch (err: any) {
      console.error("Signup error:", err);
      toast({
        title: "Signup failed",
        description: "A network error occurred. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Insights",
      description: "Get personalized financial advice from our advanced AI assistant.",
    },
    {
      icon: Wallet,
      title: "Smart Budgeting",
      description: "Track expenses and manage budgets with intelligent categorization.",
    },
    {
      icon: TrendingUp,
      title: "Investment Analysis",
      description: "Compare mutual funds and track your investment portfolio.",
    },
    {
      icon: Shield,
      title: "Loan & Insurance",
      description: "Compare banks and find the best rates for loans and insurance.",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Developer Access - Fixed Corner Button */}
      <Link
        to="/developer"
        className="fixed bottom-4 right-4 z-50 p-2 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 text-muted-foreground hover:text-foreground transition-all opacity-50 hover:opacity-100"
        title="Developer Access"
      >
        <Code2 className="h-4 w-4" />
      </Link>

      {/* Background image */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center animate-pulse-glow">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gradient-text">CredNest AI</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </button>
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </button>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-4 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Hero Text */}
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>AI-Powered Financial Management</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  Take Control of Your{" "}
                  <span className="gradient-text text-glow">Financial Future</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg">
                  CredNest AI combines intelligent budgeting, investment tracking, and personalized 
                  AI assistance to help you make smarter financial decisions.
                </p>
              </div>

              {/* Features Grid */}
              <div id="features" className="grid sm:grid-cols-2 gap-4">
                {features.map((feature) => (
                  <div
                    key={feature.title}
                    className="glass-card p-4 group hover:border-primary/30 transition-all duration-300"
                  >
                    <feature.icon className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>

              {/* About Section */}
              <div id="about" className="pt-8 space-y-4">
                <h2 className="text-2xl font-bold gradient-text">About CredNest AI</h2>
                <p className="text-muted-foreground">
                  CredNest AI is your intelligent financial companion, designed to simplify money management 
                  and help you achieve your financial goals. Our platform combines cutting-edge AI technology 
                  with comprehensive financial tools to provide personalized insights and recommendations.
                </p>
              </div>

              {/* Contact Section */}
              <div id="contact" className="pt-8 space-y-4">
                <h2 className="text-2xl font-bold gradient-text">Contact Us</h2>
                <p className="text-muted-foreground">
                  Have questions? Reach out to us at <span className="text-primary">support@crednest.ai</span>
                </p>
              </div>
            </div>

            {/* Right - Auth Card */}
            <div className="flex justify-center lg:justify-end animate-slide-in">
              <Card className="w-full max-w-md gold-glow">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">Welcome</CardTitle>
                  <CardDescription>
                    Sign in or create an account to get started
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary">
                      <TabsTrigger value="login">Login</TabsTrigger>
                      <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email</label>
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            value={loginForm.email}
                            onChange={(e) =>
                              setLoginForm({ ...loginForm, email: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Password</label>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              value={loginForm.password}
                              onChange={(e) =>
                                setLoginForm({ ...loginForm, password: e.target.value })
                              }
                              required
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <Button
                          type="submit"
                          variant="gold"
                          size="lg"
                          className="w-full"
                          disabled={isLoading}
                        >
                          {isLoading ? "Signing in..." : "Sign In"}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="signup">
                      <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Full Name</label>
                          <Input
                            type="text"
                            placeholder="Enter your name"
                            value={signupForm.name}
                            onChange={(e) =>
                              setSignupForm({ ...signupForm, name: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email</label>
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            value={signupForm.email}
                            onChange={(e) =>
                              setSignupForm({ ...signupForm, email: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Password</label>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a password"
                              value={signupForm.password}
                              onChange={(e) =>
                                setSignupForm({ ...signupForm, password: e.target.value })
                              }
                              required
                              minLength={6}
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Minimum 6 characters
                          </p>
                        </div>
                        <Button
                          type="submit"
                          variant="gold"
                          size="lg"
                          className="w-full"
                          disabled={isLoading}
                        >
                          {isLoading ? "Creating account..." : "Create Account"}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 CredNest AI. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                Terms of Service
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}