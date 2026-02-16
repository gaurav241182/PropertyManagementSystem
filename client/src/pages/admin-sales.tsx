import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Filter, TrendingUp, UtensilsCrossed, Sparkles, DollarSign, Download } from "lucide-react";

export default function AdminSales({ role = "owner" }: { role?: "owner" | "manager" }) {
  const [period, setPeriod] = useState("this_month");

  // Mock Data for F&B Sales
  const fbSales = [
    { id: 101, item: "Club Sandwich", category: "Food", quantity: 45, revenue: 675, trend: "+12%" },
    { id: 102, item: "Cappuccino", category: "Beverage", quantity: 120, revenue: 600, trend: "+5%" },
    { id: 103, item: "Caesar Salad", category: "Food", quantity: 30, revenue: 360, trend: "-2%" },
    { id: 104, item: "Fresh Juice", category: "Beverage", quantity: 85, revenue: 425, trend: "+8%" },
    { id: 105, item: "Steak Dinner", category: "Food", quantity: 22, revenue: 990, trend: "+15%" },
  ];

  // Mock Data for Facility Sales
  const facilitySales = [
    { id: 201, service: "Spa Treatment", category: "Wellness", bookings: 18, revenue: 2700, trend: "+10%" },
    { id: 202, service: "Airport Transfer", category: "Transport", bookings: 35, revenue: 1750, trend: "+4%" },
    { id: 203, service: "Extra Bed", category: "Room Add-on", bookings: 12, revenue: 360, trend: "-5%" },
    { id: 204, service: "Laundry Service", category: "Housekeeping", bookings: 40, revenue: 800, trend: "+2%" },
    { id: 205, service: "Guided Tour", category: "Activity", bookings: 8, revenue: 1200, trend: "+20%" },
  ];

  const totalFbRevenue = fbSales.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalFacilityRevenue = facilitySales.reduce((acc, curr) => acc + curr.revenue, 0);

  return (
    <AdminLayout role={role}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Sales Overview</h2>
            <p className="text-muted-foreground">Track revenue from Food & Beverage and Hotel Facilities.</p>
          </div>
          
          <div className="flex items-center gap-2">
             <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
               <Download className="mr-2 h-4 w-4" />
               Export
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-primary" />
                <div className="text-3xl font-bold text-primary">${(totalFbRevenue + totalFacilityRevenue).toLocaleString()}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                <span className="text-green-600 font-medium">+12.5%</span> from last period
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">F&B Contribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-orange-500" />
                <div className="text-2xl font-bold">${totalFbRevenue.toLocaleString()}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((totalFbRevenue / (totalFbRevenue + totalFacilityRevenue)) * 100)}% of total non-room revenue
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Facilities Contribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <div className="text-2xl font-bold">${totalFacilityRevenue.toLocaleString()}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((totalFacilityRevenue / (totalFbRevenue + totalFacilityRevenue)) * 100)}% of total non-room revenue
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="fb" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="fb" className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              F&B Sales
            </TabsTrigger>
            <TabsTrigger value="facilities" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Facility Sales
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fb" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Food & Beverage Sales</CardTitle>
                    <CardDescription>Breakdown of sales from restaurant, bar, and room service.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity Sold</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead className="text-right">Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fbSales.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.item}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={item.category === 'Food' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}>
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.revenue.toLocaleString()}</TableCell>
                        <TableCell className={`text-right ${item.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {item.trend}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="facilities" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Facility & Service Sales</CardTitle>
                    <CardDescription>Revenue from spa, transport, tours, and other amenities.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Bookings/Usage</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead className="text-right">Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facilitySales.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.service}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.bookings}</TableCell>
                        <TableCell>${item.revenue.toLocaleString()}</TableCell>
                        <TableCell className={`text-right ${item.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {item.trend}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}