import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  CalendarRange,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Lock,
  GitBranch,
  Globe
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { Hotel as HotelType, Branch } from "@shared/schema";

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
  const queryClient = useQueryClient();
  const navItems = ROLE_NAV_ITEMS[role];
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showHotelDetails, setShowHotelDetails] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const { data: hotelsData = [] } = useQuery<HotelType[]>({ queryKey: ["/api/hotels"] });
  const { data: branchesData = [] } = useQuery<Branch[]>({ queryKey: ["/api/branches"] });

  const selectedHotelId = localStorage.getItem("selectedHotelId");
  const currentHotel = user?.hotelId
    ? hotelsData.find(h => h.id === user.hotelId) || hotelsData[0]
    : selectedHotelId
      ? hotelsData.find(h => h.id === Number(selectedHotelId)) || hotelsData[0]
      : hotelsData[0];

  const hotelBranches = branchesData.filter(b => currentHotel && b.hotelId === currentHotel.id);

  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(() => {
    const stored = localStorage.getItem("selectedBranchId");
    return stored ? Number(stored) : null;
  });

  useEffect(() => {
    if (hotelBranches.length === 0) return;
    const isValid = selectedBranchId && hotelBranches.some(b => b.id === selectedBranchId);
    if (!isValid) {
      const first = hotelBranches[0];
      setSelectedBranchId(first.id);
      localStorage.setItem("selectedBranchId", String(first.id));
    }
  }, [hotelBranches, selectedBranchId]);

  const handleBranchSelect = (branchId: number) => {
    setSelectedBranchId(branchId);
    localStorage.setItem("selectedBranchId", String(branchId));
    queryClient.invalidateQueries();
  };

  const selectedBranch = hotelBranches.find(b => b.id === selectedBranchId);
  const branchLabel = selectedBranch
    ? `${selectedBranch.name}${selectedBranch.city ? ` - ${selectedBranch.city}` : ""}`
    : "No Branch";

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

      {(role === "owner" || role === "manager") && hotelBranches.length > 0 && (
        <div className="px-3 py-4">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground h-auto py-2" data-testid="dropdown-branch-selector">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Building className="h-4 w-4 shrink-0 opacity-70" />
                  <div className="flex flex-col items-start truncate">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold">Current Branch</span>
                    <span className="text-xs font-medium truncate w-32 text-left">{branchLabel}</span>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Select Branch</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {hotelBranches.map((branch) => (
                <DropdownMenuItem
                  key={branch.id}
                  onClick={() => handleBranchSelect(branch.id)}
                  className={cn(selectedBranchId === branch.id && "bg-accent font-semibold")}
                  data-testid={`menu-branch-${branch.id}`}
                >
                  {branch.name}{branch.city ? ` - ${branch.city}` : ""}
                </DropdownMenuItem>
              ))}
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
          <div
            className="px-3 py-2 mb-2 text-xs text-muted-foreground cursor-pointer hover:bg-sidebar-accent/50 rounded-md transition-colors"
            onClick={() => currentHotel && setShowHotelDetails(true)}
            data-testid="button-owner-name"
          >
            <p>Logged in as</p>
            <p className="font-semibold text-foreground hover:text-primary transition-colors">{user.name}</p>
            {currentHotel && <p className="text-[10px] text-primary/70 mt-0.5">View hotel details</p>}
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
      <aside className="hidden md:flex w-64 bg-sidebar border-r border-sidebar-border flex-col fixed h-full inset-y-0 z-50">
        <SidebarContent />
      </aside>

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

      <main className="flex-1 md:ml-64 overflow-y-auto pt-16 md:pt-0">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          {children}
        </div>
      </main>

      <Dialog open={showHotelDetails} onOpenChange={setShowHotelDetails}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {currentHotel?.logoUrl ? (
                <img src={currentHotel.logoUrl} alt="" className="h-10 w-10 rounded object-cover" />
              ) : (
                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {currentHotel?.name?.substring(0, 2).toUpperCase()}
                </div>
              )}
              {currentHotel?.name}
            </DialogTitle>
          </DialogHeader>
          {currentHotel && (() => {
            const countryLabels: Record<string, string> = { us: "United States", uk: "United Kingdom", "in": "India", ae: "UAE" };
            return (
              <div className="space-y-6 py-2">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Owner Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Full Name</p>
                        <p className="text-sm font-medium">{currentHotel.ownerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium">{currentHotel.ownerEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium">{currentHotel.ownerPhone || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Date of Birth</p>
                        <p className="text-sm font-medium">{currentHotel.ownerDob || "—"}</p>
                      </div>
                    </div>
                    {currentHotel.ownerIdNumber && (
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">ID Number</p>
                          <p className="text-sm font-medium">{currentHotel.ownerIdNumber}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Hotel Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="text-sm font-medium">{currentHotel.city}{currentHotel.country ? `, ${countryLabels[currentHotel.country] || currentHotel.country}` : ""}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tax ID</p>
                      <p className="text-sm font-medium">{currentHotel.taxId || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant="default" className={
                        currentHotel.status === "Active" ? "bg-green-600" :
                        currentHotel.status === "Deactivated" ? "bg-red-600" : "bg-gray-500"
                      }>
                        {currentHotel.status}
                      </Badge>
                    </div>
                    {currentHotel.customDomain && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Custom Domain</p>
                          <p className="text-sm font-medium">{currentHotel.customDomain}</p>
                        </div>
                      </div>
                    )}
                    {currentHotel.fromEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">From Email</p>
                          <p className="text-sm font-medium">{currentHotel.fromEmail}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {hotelBranches.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                      <GitBranch className="h-4 w-4" />
                      Branches ({hotelBranches.length})
                    </h4>
                    <div className="space-y-2">
                      {hotelBranches.map((branch) => (
                        <div key={branch.id} className="p-3 bg-muted/30 rounded-lg border">
                          <p className="text-sm font-medium">{branch.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {branch.city && <span>{branch.city}</span>}
                            {branch.address && <span> — {branch.address}</span>}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHotelDetails(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
