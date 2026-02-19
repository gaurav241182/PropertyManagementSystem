import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Hotel, LogOut, Home, Utensils, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/guest/dashboard", icon: Home, label: "My Booking" },
    { href: "/guest/menu", icon: Utensils, label: "Order Service" },
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-serif font-bold text-xl text-primary">
            <Hotel className="h-6 w-6" />
            <span>Grand Luxe Hotel</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4 text-sm font-medium text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Welcome, Guest
              </span>
            </div>
            <Link href="/guest/login">
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 flex justify-around p-2 pb-4 safe-area-bottom">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
              )}>
                <item.icon className="h-6 w-6 mb-1" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4 md:p-8 pb-24 md:pb-8 max-w-4xl">
        {children}
      </main>
    </div>
  );
}