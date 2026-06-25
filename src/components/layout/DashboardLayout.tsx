import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Aurora ambient layer */}
      <div className="aurora-bg fixed inset-0" />
      <div className="fixed -top-40 -left-40 w-[500px] h-[500px] float-shape pointer-events-none" style={{ animationDelay: "0s" }} />
      <div className="fixed bottom-0 -right-40 w-[600px] h-[600px] float-shape pointer-events-none" style={{ animationDelay: "-5s" }} />
      <div className="fixed inset-0 noise-overlay pointer-events-none" />

      <Sidebar onLogout={handleLogout} />
      <main className="lg:pl-64 min-h-screen relative z-10">
        <div className="p-4 lg:p-8 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
