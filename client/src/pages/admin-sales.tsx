import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Filter, TrendingUp, UtensilsCrossed, Sparkles, DollarSign, Download, BedDouble } from "lucide-react";

export default function AdminSales({ role = "owner" }: { role?: "owner" | "manager" }) {
  const [period, setPeriod] = useState("this_month");

  // Mock Data for Room Revenue
  const roomSales = [
    { id: "R-101", type: "Standard King", bookings: 24, revenue: 3600, occupancy: "85%", trend: "+5%" },
    { id: "R-201", type: "Deluxe Ocean", bookings: 18, revenue: 4500, occupancy: "72%", trend: "+12%" },
    { id: "R-301", type: "Executive Suite", bookings: 8, revenue: 3600, occupancy: "60%", trend: "-2%" },
    { id: "R-103", type: "Standard Twin", bookings: 20, revenue: 2800, occupancy: "78%", trend: "+3%" },
  ];

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

  const totalRoomRevenue = roomSales.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalFbRevenue = fbSales.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalFacilityRevenue = facilitySales.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalRevenue = totalRoomRevenue + totalFbRevenue + totalFacilityRevenue;

  return (
    <AdminLayout role={role}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Sales & Revenue</h2>
            <p className="text-muted-foreground">Comprehensive track of Room, F&B, and Facility revenue.</p>
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

        <div className="grid md:grid-cols-4 gap-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-primary" />
                <div className="text-3xl font-bold text-primary">${totalRevenue.toLocaleString()}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                <span className="text-green-600 font-medium">+15.2%</span> from last period
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Room Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-blue-500" />
                <div className="text-2xl font-bold">${totalRoomRevenue.toLocaleString()}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((totalRoomRevenue / totalRevenue) * 100)}% of total revenue
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">F&B Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-orange-500" />
                <div className="text-2xl font-bold">${totalFbRevenue.toLocaleString()}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((totalFbRevenue / totalRevenue) * 100)}% of total revenue
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Facility Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <div className="text-2xl font-bold">${totalFacilityRevenue.toLocaleString()}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((totalFacilityRevenue / totalRevenue) * 100)}% of total revenue
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="all">All Sales</TabsTrigger>
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <BedDouble className="h-4 w-4" />
              Rooms
            </TabsTrigger>
            <TabsTrigger value="fb" className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              F&B
            </TabsTrigger>
            <TabsTrigger value="facilities" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Facilities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
             <Card>
              <CardHeader>
                <CardTitle>Consolidated Sales Report</CardTitle>
                <CardDescription>View all revenue streams in one place.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source/Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Volume</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead className="text-right">Contribution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Combine top items from all categories */}
                    {[
                      ...roomSales.map(r => ({ ...r, name: r.type, category: "Room Booking", count: r.bookings })),
                      ...fbSales.map(f => ({ ...f, name: f.item, category: "Food & Beverage", count: f.quantity })),
                      ...facilitySales.map(s => ({ ...s, name: s.service, category: "Facility", count: s.bookings }))
                    ].sort((a, b) => b.revenue - a.revenue).slice(0, 10).map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            item.category === "Room Booking" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            item.category === "Food & Beverage" ? "bg-orange-50 text-orange-700 border-orange-200" :
                            "bg-purple-50 text-purple-700 border-purple-200"
                          }>
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.count}</TableCell>
                        <TableCell>${item.revenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {((item.revenue / totalRevenue) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="rooms" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Room Sales Performance</CardTitle>
                <CardDescription>Revenue by room type and occupancy rates.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room Type</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead>Occupancy Rate</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead className="text-right">Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roomSales.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.type}</TableCell>
                        <TableCell>{item.bookings}</TableCell>
                        <TableCell>{item.occupancy}</TableCell>
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