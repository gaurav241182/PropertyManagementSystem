import { useState } from "react";
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
  Hotel,
  BedDouble,
  Settings,
  ChevronDown,
  Building,
  DollarSign // New Icon for Salaries
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define navigation items per role
const ROLE_NAV_ITEMS = {
  owner: [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/bookings", icon: CalendarDays, label: "Bookings" },
    { href: "/admin/rooms", icon: BedDouble, label: "Room Inventory" },
    { href: "/admin/staff", icon: Users, label: "Staff Management" },
    { href: "/admin/salaries", icon: DollarSign, label: "Salaries" }, // New Item
    { href: "/admin/reports", icon: FileBarChart, label: "Reports" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
  ],
  manager: [
    { href: "/manager", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/manager/bookings", icon: CalendarDays, label: "Bookings" },
    { href: "/manager/rooms", icon: BedDouble, label: "Room Inventory" },
    { href: "/manager/staff", icon: Users, label: "Staff Management" },
    { href: "/manager/expenses", icon: Receipt, label: "Expenses" },
    { href: "/manager/menu", icon: UtensilsCrossed, label: "Menu & Services" },
  ]
};

export default function AdminLayout({ children, role = "owner" }: { children: React.ReactNode, role?: "owner" | "manager" }) {
  const [location] = useLocation();
  const navItems = ROLE_NAV_ITEMS[role];
  const [currentBranch, setCurrentBranch] = useState("Grand Luxe Hotel - NY");

  const branches = [
    "Grand Luxe Hotel - NY",
    "Seaside Resort - Miami",
    "Mountain Lodge - Aspen"
  ];

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col fixed h-full inset-y-0 z-50">
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2 font-serif font-bold text-xl text-sidebar-primary truncate">
            <Hotel className="h-6 w-6 shrink-0" />
            <span>{role === "owner" ? "Owner Portal" : "Manager Portal"}</span>
          </div>
        </div>

        {/* Branch Selector for Owner */}
        {role === "owner" && (
          <div className="px-3 py-4">
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground h-auto py-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Building className="h-4 w-4 shrink-0 opacity-70" />
                    <div className="flex flex-col items-start truncate">
                      <span className="text-[10px] uppercase text-muted-foreground font-bold">Current Branch</span>
                      <span className="text-xs font-medium truncate w-32 text-left">{currentBranch}</span>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Select Branch</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {branches.map((branch) => (
                  <DropdownMenuItem key={branch} onClick={() => setCurrentBranch(branch)}>
                    {branch}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-primary cursor-pointer">
                  + Add New Branch
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
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