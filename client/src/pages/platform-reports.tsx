import { useQuery } from "@tanstack/react-query";
import PlatformLayout from "@/components/layout/PlatformLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, BarChart3, Loader2 } from "lucide-react";
import type { Hotel } from "@shared/schema";

export default function PlatformReports() {
  const { data: hotels = [], isLoading } = useQuery<Hotel[]>({ queryKey: ["/api/hotels"] });

  const planPrices: Record<string, number> = { starter: 49, pro: 149, enterprise: 499 };
  const totalHotels = hotels.length;

  const starterCount = hotels.filter(h => h.plan === "starter").length;
  const proCount = hotels.filter(h => h.plan === "pro").length;
  const enterpriseCount = hotels.filter(h => h.plan === "enterprise").length;

  const starterPct = totalHotels > 0 ? Math.round((starterCount / totalHotels) * 100) : 0;
  const proPct = totalHotels > 0 ? Math.round((proCount / totalHotels) * 100) : 0;
  const enterprisePct = totalHotels > 0 ? Math.round((enterpriseCount / totalHotels) * 100) : 0;

  const mrr = hotels.reduce((sum, h) => sum + (planPrices[h.plan] || 0), 0);

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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary" data-testid="text-page-title">SaaS Financial Reports</h2>
            <p className="text-muted-foreground">Detailed insights into platform growth and revenue.</p>
          </div>
          <Button variant="outline" data-testid="button-export">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>

        {totalHotels === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No data available yet. Reports will populate as hotels are onboarded.</p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <Card data-testid="card-mrr">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Recurring Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${mrr.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">From {totalHotels} active subscription(s)</p>
            </CardContent>
          </Card>
          <Card data-testid="card-avg-revenue">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Revenue Per Hotel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${totalHotels > 0 ? Math.round(mrr / totalHotels) : 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Per month</p>
            </CardContent>
          </Card>
          <Card data-testid="card-arr">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Annual Recurring Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${(mrr * 12).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Projected annually</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan Distribution</CardTitle>
              <CardDescription>Active subscriptions by plan tier.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">Starter ($49/mo)</span>
                    <span className="text-sm text-muted-foreground">{starterPct}% ({starterCount} Hotel{starterCount !== 1 ? "s" : ""})</span>
                  </div>
                  <div className="w-full bg-secondary/20 rounded-full h-2.5">
                    <div className="bg-secondary h-2.5 rounded-full transition-all" style={{ width: `${starterPct}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">Professional ($149/mo)</span>
                    <span className="text-sm text-muted-foreground">{proPct}% ({proCount} Hotel{proCount !== 1 ? "s" : ""})</span>
                  </div>
                  <div className="w-full bg-primary/20 rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full transition-all" style={{ width: `${proPct}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">Enterprise ($499/mo)</span>
                    <span className="text-sm text-muted-foreground">{enterprisePct}% ({enterpriseCount} Hotel{enterpriseCount !== 1 ? "s" : ""})</span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2.5">
                    <div className="bg-purple-600 h-2.5 rounded-full transition-all" style={{ width: `${enterprisePct}%` }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown by Plan</CardTitle>
              <CardDescription>Monthly revenue contribution per tier.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Starter</p>
                    <p className="text-xs text-muted-foreground">{starterCount} hotel(s)</p>
                  </div>
                  <p className="font-bold text-lg">${(starterCount * 49).toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Professional</p>
                    <p className="text-xs text-muted-foreground">{proCount} hotel(s)</p>
                  </div>
                  <p className="font-bold text-lg">${(proCount * 149).toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Enterprise</p>
                    <p className="text-xs text-muted-foreground">{enterpriseCount} hotel(s)</p>
                  </div>
                  <p className="font-bold text-lg">${(enterpriseCount * 499).toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border-2">
                  <div>
                    <p className="font-bold text-sm">Total MRR</p>
                    <p className="text-xs text-muted-foreground">{totalHotels} hotel(s)</p>
                  </div>
                  <p className="font-bold text-xl text-primary">${mrr.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PlatformLayout>
  );
}
