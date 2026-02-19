import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Booking, Order, OrderItem, RoomType } from "@shared/schema";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Filter, UtensilsCrossed, Sparkles, DollarSign, Download, BedDouble, Loader2 } from "lucide-react";

export default function AdminSales({ role = "owner" }: { role?: "owner" | "manager" }) {
  const [period, setPeriod] = useState("this_month");

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({ queryKey: ['/api/bookings'] });
  const { data: orders = [], isLoading: ordersLoading } = useQuery<(Order & { items?: OrderItem[] })[]>({ queryKey: ['/api/orders'] });
  const { data: roomTypesData = [], isLoading: roomTypesLoading } = useQuery<RoomType[]>({ queryKey: ['/api/room-types'] });

  const isLoading = bookingsLoading || ordersLoading || roomTypesLoading;

  const roomTypeMap = useMemo(() => {
    const map: Record<number, string> = {};
    for (const rt of roomTypesData) {
      map[rt.id] = rt.name;
    }
    return map;
  }, [roomTypesData]);

  const roomSales = useMemo(() => {
    const grouped: Record<number, { type: string; bookings: number; revenue: number }> = {};
    for (const b of bookings) {
      const rtId = b.roomTypeId;
      if (!grouped[rtId]) {
        grouped[rtId] = { type: roomTypeMap[rtId] || `Room Type ${rtId}`, bookings: 0, revenue: 0 };
      }
      grouped[rtId].bookings += 1;
      grouped[rtId].revenue += parseFloat(b.totalAmount) || 0;
    }
    return Object.entries(grouped).map(([id, data]) => ({ id: Number(id), ...data }));
  }, [bookings, roomTypeMap]);

  const fbSales = useMemo(() => {
    const itemMap: Record<string, { quantity: number; revenue: number }> = {};
    for (const order of orders) {
      if (order.type !== "Food" || order.status !== "Fulfilled") continue;
      const items = order.items || [];
      for (const item of items) {
        const name = item.itemName;
        if (!itemMap[name]) {
          itemMap[name] = { quantity: 0, revenue: 0 };
        }
        itemMap[name].quantity += item.quantity || 0;
        itemMap[name].revenue += (parseFloat(item.price) || 0) * (item.quantity || 0);
      }
    }
    return Object.entries(itemMap).map(([item, data], idx) => ({ id: idx, item, ...data }));
  }, [orders]);

  const facilitySales = useMemo(() => {
    const itemMap: Record<string, { quantity: number; revenue: number }> = {};
    for (const order of orders) {
      if (order.type !== "Facility" || order.status !== "Fulfilled") continue;
      const items = order.items || [];
      for (const item of items) {
        const name = item.itemName;
        if (!itemMap[name]) {
          itemMap[name] = { quantity: 0, revenue: 0 };
        }
        itemMap[name].quantity += item.quantity || 0;
        itemMap[name].revenue += (parseFloat(item.price) || 0) * (item.quantity || 0);
      }
    }
    return Object.entries(itemMap).map(([service, data], idx) => ({ id: idx, service, ...data }));
  }, [orders]);

  const totalRoomRevenue = roomSales.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalFbRevenue = fbSales.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalFacilityRevenue = facilitySales.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalRevenue = totalRoomRevenue + totalFbRevenue + totalFacilityRevenue;

  if (isLoading) {
    return (
      <AdminLayout role={role}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout role={role}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Revenue Overview</h2>
            <p className="text-muted-foreground">Comprehensive track of Room, F&B, and Facility revenue.</p>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="flex gap-2">
               <Input type="date" className="w-[150px]" />
               <span className="self-center text-muted-foreground">-</span>
               <Input type="date" className="w-[150px]" />
             </div>
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
                <SelectItem value="custom">Custom Range</SelectItem>
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
                <div className="text-3xl font-bold text-primary" data-testid="text-total-revenue">${totalRevenue.toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Room Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-blue-500" />
                <div className="text-2xl font-bold" data-testid="text-room-revenue">${totalRoomRevenue.toLocaleString()}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalRevenue > 0 ? Math.round((totalRoomRevenue / totalRevenue) * 100) : 0}% of total revenue
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
                <div className="text-2xl font-bold" data-testid="text-fb-revenue">${totalFbRevenue.toLocaleString()}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalRevenue > 0 ? Math.round((totalFbRevenue / totalRevenue) * 100) : 0}% of total revenue
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
                <div className="text-2xl font-bold" data-testid="text-facility-revenue">${totalFacilityRevenue.toLocaleString()}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalRevenue > 0 ? Math.round((totalFacilityRevenue / totalRevenue) * 100) : 0}% of total revenue
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
                {roomSales.length === 0 && fbSales.length === 0 && facilitySales.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8" data-testid="text-no-data-all">No data yet</p>
                ) : (
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
                    {[
                      ...roomSales.map(r => ({ ...r, name: r.type, category: "Room Booking", count: r.bookings })),
                      ...fbSales.map(f => ({ ...f, name: f.item, category: "Food & Beverage", count: f.quantity })),
                      ...facilitySales.map(s => ({ ...s, name: s.service, category: "Facility", count: s.quantity }))
                    ].sort((a, b) => b.revenue - a.revenue).slice(0, 10).map((item, idx) => (
                      <TableRow key={idx} data-testid={`row-all-sales-${idx}`}>
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
                          {totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : "0.0"}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                )}
              </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="rooms" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Room Sales Performance</CardTitle>
                <CardDescription>Revenue by room type and booking counts.</CardDescription>
              </CardHeader>
              <CardContent>
                {roomSales.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8" data-testid="text-no-data-rooms">No data yet</p>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room Type</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roomSales.map((item) => (
                      <TableRow key={item.id} data-testid={`row-room-sales-${item.id}`}>
                        <TableCell className="font-medium">{item.type}</TableCell>
                        <TableCell>{item.bookings}</TableCell>
                        <TableCell>${item.revenue.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                )}
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
                {fbSales.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8" data-testid="text-no-data-fb">No data yet</p>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Quantity Sold</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fbSales.map((item) => (
                      <TableRow key={item.id} data-testid={`row-fb-sales-${item.id}`}>
                        <TableCell className="font-medium">{item.item}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.revenue.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                )}
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
                {facilitySales.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8" data-testid="text-no-data-facilities">No data yet</p>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Name</TableHead>
                      <TableHead>Bookings/Usage</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facilitySales.map((item) => (
                      <TableRow key={item.id} data-testid={`row-facility-sales-${item.id}`}>
                        <TableCell className="font-medium">{item.service}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.revenue.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
