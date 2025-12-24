import { useState, useEffect, createContext, useContext } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

interface DevAuthContextType {
  isDevAuthenticated: boolean;
  isLoading: boolean;
}

const DevAuthContext = createContext<DevAuthContextType | undefined>(undefined);

export function DevAuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [isDevAuthenticated, setIsDevAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsDevAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        // Check if user has admin role using the user_roles table
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (error) {
          console.error("Error checking admin role:", error);
          setIsDevAuthenticated(false);
        } else {
          setIsDevAuthenticated(!!data);
        }
      } catch (err) {
        console.error("Failed to check admin role:", err);
        setIsDevAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      checkAdminRole();
    }
  }, [user, authLoading]);

  return (
    <DevAuthContext.Provider value={{ isDevAuthenticated, isLoading }}>
      {children}
    </DevAuthContext.Provider>
  );
}

export function useDevAuth() {
  const context = useContext(DevAuthContext);
  if (context === undefined) {
    throw new Error("useDevAuth must be used within a DevAuthProvider");
  }
  return context;
}
