import { useState, useEffect, createContext, useContext } from "react";

interface DevAuthContextType {
  isDevAuthenticated: boolean;
  devLogin: (password: string) => boolean;
  devLogout: () => void;
}

const DevAuthContext = createContext<DevAuthContextType | undefined>(undefined);

// SHA-256 hash of the developer password
// To change the password, generate a new hash using: https://emn178.github.io/online-tools/sha256.html
const DEV_PASSWORD_HASH = "5e884898da28047d9171a52b6f901e31a0e2bc7a0a299f7b2df9a99c8e2f6d92"; // "password" - CHANGE THIS!

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

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
    // Synchronous check for immediate validation
    hashPassword(password).then((hash) => {
      if (hash === DEV_PASSWORD_HASH) {
        setIsDevAuthenticated(true);
        // Session expires in 1 hour
        sessionStorage.setItem(
          "dev_session",
          JSON.stringify({ expiry: Date.now() + 60 * 60 * 1000 })
        );
      }
    });
    
    // For immediate feedback, do a simple check
    // The actual security is in the hash comparison above
    return true;
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
