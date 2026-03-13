import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
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
  DollarSign,
  ShoppingBag,
  ChefHat,
  Menu,
  CalendarRange
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { Hotel as HotelType } from "@shared/schema";

// Define navigation items per role
const ROLE_NAV_ITEMS = {
  owner: [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/bookings", icon: CalendarDays, label: "Bookings" },
    { href: "/admin/inventory-pricing", icon: CalendarRange, label: "Inventory & Pricing" },
    { href: "/admin/orders", icon: UtensilsCrossed, label: "Orders (Kitchen)" },
    { href: "/admin/staff", icon: Users, label: "Staff Management" },
    { href: "/admin/expenses", icon: Receipt, label: "Expenses & Purchases" },
    { href: "/admin/salaries", icon: DollarSign, label: "Salaries" },
    { href: "/admin/sales", icon: ShoppingBag, label: "Revenue" },
    { href: "/admin/restaurant-menu", icon: ChefHat, label: "Restaurant Menu" },
    { href: "/admin/reports", icon: FileBarChart, label: "Reports" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
  ],
  manager: [
    { href: "/manager", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/manager/bookings", icon: CalendarDays, label: "Bookings" },
    { href: "/manager/inventory-pricing", icon: CalendarRange, label: "Inventory & Pricing" },
    { href: "/manager/orders", icon: UtensilsCrossed, label: "Orders (Kitchen)" },
    { href: "/manager/staff", icon: Users, label: "Staff Management" },
    { href: "/manager/expenses", icon: Receipt, label: "Expenses" },
    { href: "/manager/restaurant-menu", icon: ChefHat, label: "Restaurant Menu" },
  ]
};

export default function AdminLayout({ children, role = "owner" }: { children: React.ReactNode, role?: "owner" | "manager" }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const navItems = ROLE_NAV_ITEMS[role];
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const { data: hotelsData = [] } = useQuery<HotelType[]>({ queryKey: ["/api/hotels"] });

  const parseBranches = (b: string): { name: string; city: string; address: string }[] => {
    try { return JSON.parse(b); } catch { return []; }
  };

  const selectedHotelId = localStorage.getItem("selectedHotelId");
  const currentHotel = user?.hotelId
    ? hotelsData.find(h => h.id === user.hotelId) || hotelsData[0]
    : selectedHotelId
      ? hotelsData.find(h => h.id === Number(selectedHotelId)) || hotelsData[0]
      : hotelsData[0];
  const branches = currentHotel ? parseBranches(currentHotel.branches) : [];
  const branchNames = branches.map(b => b.name + (b.city ? ` - ${b.city}` : "")).filter(Boolean);
  const [currentBranch, setCurrentBranch] = useState("");

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 font-serif font-bold text-xl text-sidebar-primary truncate">
          {currentHotel?.logoUrl ? (
            <img src={currentHotel.logoUrl} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
          ) : (
            <Hotel className="h-6 w-6 shrink-0" />
          )}
          <span className="truncate">{currentHotel ? currentHotel.name : (role === "owner" ? "Owner Portal" : "Manager Portal")}</span>
        </div>
      </div>

      {role === "owner" && (
        <div className="px-3 py-4">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground h-auto py-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Building className="h-4 w-4 shrink-0 opacity-70" />
                  <div className="flex flex-col items-start truncate">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold">Current Branch</span>
                    <span className="text-xs font-medium truncate w-32 text-left">{currentBranch || branchNames[0] || "No Branch"}</span>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Select Branch</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {branchNames.length > 0 ? branchNames.map((branch) => (
                <DropdownMenuItem key={branch} onClick={() => setCurrentBranch(branch)}>
                  {branch}
                </DropdownMenuItem>
              )) : (
                <DropdownMenuItem disabled>No branches configured</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
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
        {user && (
          <div className="px-3 py-2 mb-2 text-xs text-muted-foreground">
            <p>Logged in as</p>
            <p className="font-semibold text-foreground">{user.name}</p>
          </div>
        )}
        <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-sidebar border-r border-sidebar-border flex-col fixed h-full inset-y-0 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-50 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2 font-serif font-bold text-xl text-sidebar-primary">
          {currentHotel?.logoUrl ? (
            <img src={currentHotel.logoUrl} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
          ) : (
            <Hotel className="h-6 w-6 shrink-0" />
          )}
          <span className="truncate">{currentHotel ? currentHotel.name : "YellowBerry"}</span>
        </div>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-sidebar border-r border-sidebar-border">
            <div className="flex flex-col h-full">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 overflow-y-auto pt-16 md:pt-0">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}