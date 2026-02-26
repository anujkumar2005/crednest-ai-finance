import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  Wallet,
  PiggyBank,
  TrendingUp,
  Building2,
  Shield,
  Calculator,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  HelpCircle,
  Info,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: MessageSquare, label: "AI Assistant", path: "/chat" },
  { icon: Wallet, label: "Budgeting", path: "/budgeting" },
  { icon: PiggyBank, label: "Savings", path: "/savings" },
  { icon: TrendingUp, label: "Investments", path: "/investments" },
  { icon: Building2, label: "Loans", path: "/loans" },
  { icon: Shield, label: "Insurance", path: "/insurance" },
  { icon: Calculator, label: "Tax Planning", path: "/tax" },
];

const bottomItems = [
  { icon: User, label: "Profile", path: "/profile" },
  { icon: HelpCircle, label: "Help", path: "/help" },
  { icon: Info, label: "About", path: "/about" },
  { icon: Code2, label: "Developer", path: "/developer" },
];

interface SidebarProps {
  onLogout?: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const NavLink = ({
    item,
  }: {
    item: { icon: React.ElementType; label: string; path: string };
  }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    return (
      <Link
        to={item.path}
        className={cn(
          "sidebar-link",
          isActive && "active"
        )}
        onClick={() => setIsMobileOpen(false)}
      >
        <Icon className="h-5 w-5" />
        {!isCollapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-card/80 backdrop-blur-xl border border-border/50 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-50 transition-all duration-300 flex flex-col",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg gradient-text">CredNest</h1>
                <p className="text-xs text-muted-foreground">AI Finance</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center mx-auto">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <Menu className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <div className="flex items-center justify-between px-2 py-1">
            {!isCollapsed && <span className="text-xs text-muted-foreground">Theme</span>}
            <ThemeToggle />
          </div>
          {bottomItems.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
          <button
            onClick={onLogout}
            className="sidebar-link w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
