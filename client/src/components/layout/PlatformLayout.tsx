import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings, 
  LogOut,
  TrendingUp,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const navItems = [
    { href: "/platform/dashboard", icon: LayoutDashboard, label: "Overview" },
    { href: "/platform/hotels", icon: Building2, label: "Hotels & Branches" },
    { href: "/platform/users", icon: Users, label: "User Management" },
    { href: "/platform/reports", icon: TrendingUp, label: "SaaS Reports" },
    { href: "/platform/settings", icon: Settings, label: "Platform Settings" },
  ];

  return (
    <div className="flex h-screen bg-muted/30 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col fixed h-full inset-y-0 z-50">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border bg-sidebar-primary/5">
          <div className="flex items-center gap-2 font-serif font-bold text-xl text-primary">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span>YellowBerry PMS</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="px-3 py-2 mb-2 text-xs text-muted-foreground">
            <p>Logged in as</p>
            <p className="font-semibold text-foreground">{user?.name || "Super Admin"}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="container mx-auto p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}