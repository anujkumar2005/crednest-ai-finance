import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff, ShieldAlert, Code2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DevProtectedRouteProps {
  children: React.ReactNode;
}

// Developer password
const DEV_PASSWORD = "Anuj@2005";

export function DevProtectedRoute({ children }: DevProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Check if dev session exists (expires in 1 hour)
    const devSession = sessionStorage.getItem("dev_session");
    if (devSession) {
      try {
        const { expiry } = JSON.parse(devSession);
        if (Date.now() < expiry) {
          setIsAuthenticated(true);
        } else {
          sessionStorage.removeItem("dev_session");
        }
      } catch {
        sessionStorage.removeItem("dev_session");
      }
    }
    setIsChecking(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (attempts >= 5) {
      toast({
        title: "Too many attempts",
        description: "Please wait before trying again",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Add artificial delay to prevent brute force
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    if (password === DEV_PASSWORD) {
      setIsAuthenticated(true);
      // Session expires in 1 hour
      sessionStorage.setItem(
        "dev_session",
        JSON.stringify({ expiry: Date.now() + 60 * 60 * 1000 })
      );
      toast({
        title: "Developer access granted",
        description: "Welcome to the developer dashboard",
      });
    } else {
      setAttempts((prev) => prev + 1);
      toast({
        title: "Access denied",
        description: `Invalid password. ${5 - attempts - 1} attempts remaining.`,
        variant: "destructive",
      });
    }
    
    setPassword("");
    setIsLoading(false);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-chart-1/5" />
        
        <Card className="w-full max-w-md glass-card relative z-10">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Code2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Developer Access</CardTitle>
              <CardDescription className="mt-2">
                This area is restricted to authorized developers only
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                  Developer Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter developer password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || attempts >= 5}
                    className="pr-10"
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
              
              {attempts >= 5 && (
                <p className="text-sm text-destructive">
                  Too many failed attempts. Please refresh and try again.
                </p>
              )}
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || attempts >= 5}
              >
                {isLoading ? (
                  <>
                    <Lock className="h-4 w-4 mr-2 animate-pulse" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Access Developer Dashboard
                  </>
                )}
              </Button>
            </form>
            
            <p className="text-xs text-muted-foreground text-center mt-6">
              Unauthorized access attempts are logged
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
