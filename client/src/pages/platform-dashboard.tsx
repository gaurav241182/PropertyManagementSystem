import PlatformLayout from "@/components/layout/PlatformLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Users, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Plus
} from "lucide-react";
import { Link } from "wouter";

export default function PlatformDashboard() {
  const stats = [
    {
      title: "Total Hotels",
      value: "142",
      change: "+12 this month",
      trend: "up",
      icon: Building2,
      color: "text-blue-600",
    },
    {
      title: "Active Branches",
      value: "356",
      change: "+28 this month",
      trend: "up",
      icon: Activity,
      color: "text-purple-600",
    },
    {
      title: "Total Users",
      value: "2,450",
      change: "+180 this month",
      trend: "up",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Monthly Revenue (MRR)",
      value: "$84,250",
      change: "+8.2% from last month",
      trend: "up",
      icon: CreditCard,
      color: "text-amber-600",
    },
  ];

  return (
    <PlatformLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary font-serif">Platform Overview</h2>
            <p className="text-muted-foreground">Monitor SaaS performance and hotel growth.</p>
          </div>
          <Link href="/platform/hotels">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Onboard New Hotel
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                  )}
                  <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>
                    {stat.change}
                  </span>
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
              <div className="space-y-4">
                {[
                  { name: "Grand Luxe Hotel", location: "New York, NY", plan: "Enterprise", date: "2 hours ago" },
                  { name: "Seaside Resort", location: "Miami, FL", plan: "Professional", date: "5 hours ago" },
                  { name: "Mountain View Lodge", location: "Aspen, CO", plan: "Starter", date: "1 day ago" },
                  { name: "City Center Inn", location: "Chicago, IL", plan: "Professional", date: "2 days ago" },
                ].map((hotel, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {hotel.name.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{hotel.name}</p>
                        <p className="text-xs text-muted-foreground">{hotel.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium bg-secondary/10 text-secondary-foreground px-2 py-1 rounded-full inline-block mb-1">{hotel.plan}</p>
                      <p className="text-xs text-muted-foreground">{hotel.date}</p>
                    </div>
                  </div>
                ))}
              </div>
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
                    <p className="text-xs text-green-700 mt-1">API response time: 45ms. Database load: 12%.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-900">Subscription Renewals</h4>
                    <p className="text-xs text-amber-700 mt-1">15 subscriptions expiring in the next 3 days.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900">New Feature Rollout</h4>
                    <p className="text-xs text-blue-700 mt-1">"Advanced Analytics" module deployed to 20% of users.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PlatformLayout>
  );
}