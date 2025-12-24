import { useState, useEffect, createContext, useContext } from "react";

interface DevAuthContextType {
  isDevAuthenticated: boolean;
  devLogin: (password: string) => boolean;
  devLogout: () => void;
}

const DevAuthContext = createContext<DevAuthContextType | undefined>(undefined);

// Developer password
const DEV_PASSWORD = "Anuj@2005";

export function DevAuthProvider({ children }: { children: React.ReactNode }) {
  const [isDevAuthenticated, setIsDevAuthenticated] = useState(false);

  useEffect(() => {
    // Check if dev session exists (expires in 1 hour)
    const devSession = sessionStorage.getItem("dev_session");
    if (devSession) {
      const { expiry } = JSON.parse(devSession);
      if (Date.now() < expiry) {
        setIsDevAuthenticated(true);
      } else {
        sessionStorage.removeItem("dev_session");
      }
    }
  }, []);

  const devLogin = (password: string): boolean => {
    if (password === DEV_PASSWORD) {
      setIsDevAuthenticated(true);
      // Session expires in 1 hour
      sessionStorage.setItem(
        "dev_session",
        JSON.stringify({ expiry: Date.now() + 60 * 60 * 1000 })
      );
      return true;
    }
    return false;
  };

  const devLogout = () => {
    setIsDevAuthenticated(false);
    sessionStorage.removeItem("dev_session");
  };

  return (
    <DevAuthContext.Provider value={{ isDevAuthenticated, devLogin, devLogout }}>
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
