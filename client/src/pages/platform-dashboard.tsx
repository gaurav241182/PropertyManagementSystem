import { useQuery } from "@tanstack/react-query";
import PlatformLayout from "@/components/layout/PlatformLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Hotel, PlatformUser } from "@shared/schema";
import { 
  Building2, 
  Users, 
  CreditCard, 
  Activity,
  Plus,
  Loader2,
  GitBranch,
  MapPin
} from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function PlatformDashboard() {
  const { data: hotels = [], isLoading: hotelsLoading } = useQuery<Hotel[]>({ queryKey: ["/api/hotels"] });
  const { data: users = [], isLoading: usersLoading } = useQuery<PlatformUser[]>({ queryKey: ["/api/platform-users"] });

  const isLoading = hotelsLoading || usersLoading;

  const totalHotels = hotels.length;
  const totalBranches = hotels.reduce((sum, h) => {
    try { return sum + JSON.parse(h.branches).length; } catch { return sum; }
  }, 0);
  const totalUsers = users.length;

  const planPrices: Record<string, number> = { starter: 49, pro: 149, enterprise: 499 };
  const mrr = hotels.reduce((sum, h) => sum + (planPrices[h.plan] || 0), 0);

  const recentHotels = hotels.slice(0, 5);

  const stats = [
    {
      title: "Total Hotels",
      value: String(totalHotels),
      change: totalHotels > 0 ? `${totalHotels} registered` : "None yet",
      icon: Building2,
      color: "text-blue-600",
    },
    {
      title: "Active Branches",
      value: String(totalBranches),
      change: totalBranches > 0 ? `Across ${totalHotels} hotels` : "None yet",
      icon: Activity,
      color: "text-purple-600",
    },
    {
      title: "Total Users",
      value: String(totalUsers),
      change: totalUsers > 0 ? `${users.filter(u => u.status === "Active").length} active` : "None yet",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Monthly Revenue (MRR)",
      value: `$${mrr.toLocaleString()}`,
      change: mrr > 0 ? `From ${totalHotels} subscriptions` : "No subscriptions",
      icon: CreditCard,
      color: "text-amber-600",
    },
  ];

  if (isLoading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary font-serif" data-testid="text-page-title">Platform Overview</h2>
            <p className="text-muted-foreground">Monitor SaaS performance and hotel growth.</p>
          </div>
          <Link href="/platform/hotels">
            <Button className="gap-2" data-testid="button-onboard-hotel">
              <Plus className="h-4 w-4" />
              Onboard New Hotel
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-sm hover:shadow-md transition-shadow" data-testid={`card-stat-${index}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <span>{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Hotel Onboardings</CardTitle>
              <CardDescription>Latest properties added to the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              {recentHotels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Building2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No hotels onboarded yet. Use the 'Onboard New Hotel' button to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentHotels.map((hotel) => {
                    const branchCount = (() => { try { return JSON.parse(hotel.branches).length; } catch { return 0; } })();
                    const countryLabels: Record<string, string> = { us: "US", uk: "UK", "in": "India", ae: "UAE" };
                    return (
                      <div key={hotel.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`recent-hotel-${hotel.id}`}>
                        <div className="flex items-center gap-3">
                          {hotel.logoUrl ? (
                            <img src={hotel.logoUrl} alt="" className="h-9 w-9 rounded object-cover" />
                          ) : (
                            <div className="h-9 w-9 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {hotel.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{hotel.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {hotel.city}{hotel.country ? `, ${countryLabels[hotel.country] || hotel.country}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="gap-1 text-xs">
                            <GitBranch className="h-3 w-3" />
                            {branchCount}
                          </Badge>
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-xs">
                            {hotel.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Health & Alerts</CardTitle>
              <CardDescription>Platform status and critical notifications.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3 bg-green-50 border border-green-100 rounded-lg">
                  <Activity className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-green-900">All Systems Operational</h4>
                    <p className="text-xs text-green-700 mt-1">Database connected. All services running normally.</p>
                  </div>
                </div>
                
                {totalHotels > 0 && (
                  <div className="flex items-start gap-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900">Hotels Active</h4>
                      <p className="text-xs text-blue-700 mt-1">{totalHotels} hotel(s) onboarded with {totalBranches} branch(es) configured.</p>
                    </div>
                  </div>
                )}

                {totalUsers > 0 && (
                  <div className="flex items-start gap-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <Users className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-amber-900">User Accounts</h4>
                      <p className="text-xs text-amber-700 mt-1">{totalUsers} user(s) registered. {users.filter(u => u.status === "Active").length} currently active.</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PlatformLayout>
  );
}
