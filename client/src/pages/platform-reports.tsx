import PlatformLayout from "@/components/layout/PlatformLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, AreaChart, Area, CartesianGrid } from "recharts";

export default function PlatformReports() {
  const mrrData = [
    { name: "Jan", amount: 65000 },
    { name: "Feb", amount: 68000 },
    { name: "Mar", amount: 72000 },
    { name: "Apr", amount: 75000 },
    { name: "May", amount: 78500 },
    { name: "Jun", amount: 84250 },
  ];

  const churnData = [
    { name: "Jan", rate: 2.1 },
    { name: "Feb", rate: 1.8 },
    { name: "Mar", rate: 1.5 },
    { name: "Apr", rate: 1.2 },
    { name: "May", rate: 1.4 },
    { name: "Jun", rate: 0.9 },
  ];

  return (
    <PlatformLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">SaaS Financial Reports</h2>
            <p className="text-muted-foreground">Detailed insights into platform growth and revenue.</p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Monthly Recurring Revenue (MRR) Growth</CardTitle>
              <CardDescription>Tracking platform revenue growth over the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mrrData}>
                    <defs>
                      <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <Tooltip 
                      formatter={(value) => [`$${value}`, "MRR"]}
                      contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#8884d8" fillOpacity={1} fill="url(#colorMrr)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Churn Rate (%)</CardTitle>
              <CardDescription>Percentage of customers cancelling subscriptions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={churnData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="rate" fill="#ff8042" radius={[4, 4, 0, 0]} name="Churn Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan Distribution</CardTitle>
              <CardDescription>Active subscriptions by plan tier.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Starter ($49/mo)</span>
                  <span className="text-muted-foreground">45% (64 Hotels)</span>
                </div>
                <div className="w-full bg-secondary/20 rounded-full h-2">
                  <div className="bg-secondary h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Professional ($149/mo)</span>
                  <span className="text-muted-foreground">35% (50 Hotels)</span>
                </div>
                <div className="w-full bg-primary/20 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '35%' }}></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Enterprise ($499/mo)</span>
                  <span className="text-muted-foreground">20% (28 Hotels)</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PlatformLayout>
  );
}