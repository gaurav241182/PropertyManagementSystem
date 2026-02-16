import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Receipt, 
  Users, 
  UtensilsCrossed, 
  FileBarChart, 
  LogOut,
  Hotel
} from "lucide-react";
import { cn } from "@/lib/utils";

// Define navigation items per role
const ROLE_NAV_ITEMS = {
  owner: [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/staff", icon: Users, label: "Staff Management" },
    { href: "/admin/reports", icon: FileBarChart, label: "Reports" },
  ],
  manager: [
    { href: "/manager", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/manager/staff", icon: Users, label: "Staff Management" },
    { href: "/manager/expenses", icon: Receipt, label: "Expenses" },
    { href: "/manager/inventory", icon: CalendarDays, label: "Inventory & Bookings" },
    { href: "/manager/menu", icon: UtensilsCrossed, label: "Menu & Services" },
  ]
};

export default function AdminLayout({ children, role = "owner" }: { children: React.ReactNode, role?: "owner" | "manager" }) {
  const [location] = useLocation();
  const navItems = ROLE_NAV_ITEMS[role];

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col fixed h-full inset-y-0 z-50">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2 font-serif font-bold text-xl text-sidebar-primary">
            <Hotel className="h-6 w-6" />
            <span>{role === "owner" ? "Owner Portal" : "Manager Portal"}</span>
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
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
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
          <Link href="/login">
            <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </Link>
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