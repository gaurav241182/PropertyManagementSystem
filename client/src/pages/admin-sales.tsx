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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Filter, UtensilsCrossed, Sparkles, DollarSign, Download, BedDouble, Loader2 } from "lucide-react";
import { useHotelSettings } from "@/hooks/use-hotel-settings";

function getDateRange(period: string, customStart: string, customEnd: string): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  if (period === "today") {
    return { start: today, end: tomorrow };
  }
  if (period === "this_week") {
    const day = today.getDay();
    const mon = new Date(today); mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    const sun = new Date(mon); sun.setDate(mon.getDate() + 7);
    return { start: mon, end: sun };
  }
  if (period === "this_month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return { start, end };
  }
  if (period === "last_month") {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start, end };
  }
  if (period === "this_year") {
    const start = new Date(today.getFullYear(), 0, 1);
    const end = new Date(today.getFullYear() + 1, 0, 1);
    return { start, end };
  }
  if (period === "custom" && customStart && customEnd) {
    return { start: new Date(customStart), end: new Date(new Date(customEnd).setDate(new Date(customEnd).getDate() + 1)) };
  }
  return { start: new Date(0), end: new Date(9999, 11, 31) };
}

function inRange(dateStr: string, start: Date, end: Date): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= start && d < end;
}

function exportCSV(rows: string[][], filename: string) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminSales({ role = "owner" }: { role?: "owner" | "manager" }) {
  const [period, setPeriod] = useState("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({ queryKey: ['/api/bookings'] });
  const { data: orders = [], isLoading: ordersLoading } = useQuery<(Order & { items?: OrderItem[] })[]>({ queryKey: ['/api/orders'] });
  const { data: roomTypesData = [], isLoading: roomTypesLoading } = useQuery<RoomType[]>({ queryKey: ['/api/room-types'] });

  const { currencySymbol } = useHotelSettings();

  const isLoading = bookingsLoading || ordersLoading || roomTypesLoading;

  const roomTypeMap = useMemo(() => {
    const map: Record<number, string> = {};
    for (const rt of roomTypesData) map[rt.id] = rt.name;
    return map;
  }, [roomTypesData]);

  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => getDateRange(period, customStart, customEnd),
    [period, customStart, customEnd]
  );

  const filteredBookings = useMemo(() =>
    bookings.filter(b => inRange(b.checkIn, rangeStart, rangeEnd)),
    [bookings, rangeStart, rangeEnd]
  );

  const filteredOrders = useMemo(() =>
    orders.filter(o => inRange(String(o.createdAt ?? "").split("T")[0], rangeStart, rangeEnd)),
    [orders, rangeStart, rangeEnd]
  );

  const roomSales = useMemo(() => {
    const grouped: Record<number, { type: string; bookings: number; revenue: number }> = {};
    for (const b of filteredBookings) {
      const rtId = b.roomTypeId;
      if (!grouped[rtId]) grouped[rtId] = { type: roomTypeMap[rtId] || `Room Type ${rtId}`, bookings: 0, revenue: 0 };
      grouped[rtId].bookings += 1;
      grouped[rtId].revenue += parseFloat(b.totalAmount) || 0;
    }
    return Object.entries(grouped).map(([id, data]) => ({ id: Number(id), ...data }));
  }, [filteredBookings, roomTypeMap]);

  const fbSales = useMemo(() => {
    const itemMap: Record<string, { quantity: number; revenue: number }> = {};
    for (const order of filteredOrders) {
      if (order.type !== "Food" || order.status !== "Fulfilled") continue;
      for (const item of (order.items || [])) {
        if (!itemMap[item.itemName]) itemMap[item.itemName] = { quantity: 0, revenue: 0 };
        itemMap[item.itemName].quantity += item.quantity || 0;
        itemMap[item.itemName].revenue += (parseFloat(item.price) || 0) * (item.quantity || 0);
      }
    }
    return Object.entries(itemMap).map(([item, data], idx) => ({ id: idx, item, ...data }));
  }, [filteredOrders]);

  const facilitySales = useMemo(() => {
    const itemMap: Record<string, { quantity: number; revenue: number }> = {};
    for (const order of filteredOrders) {
      if (order.type !== "Facility" || order.status !== "Fulfilled") continue;
      for (const item of (order.items || [])) {
        if (!itemMap[item.itemName]) itemMap[item.itemName] = { quantity: 0, revenue: 0 };
        itemMap[item.itemName].quantity += item.quantity || 0;
        itemMap[item.itemName].revenue += (parseFloat(item.price) || 0) * (item.quantity || 0);
      }
    }
    return Object.entries(itemMap).map(([service, data], idx) => ({ id: idx, service, ...data }));
  }, [filteredOrders]);

  const totalRoomRevenue = roomSales.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalFbRevenue = fbSales.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalFacilityRevenue = facilitySales.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalRevenue = totalRoomRevenue + totalFbRevenue + totalFacilityRevenue;

  const allSalesRows = [
    ...roomSales.map(r => ({ name: r.type, category: "Room Booking", count: r.bookings, revenue: r.revenue })),
    ...fbSales.map(f => ({ name: f.item, category: "Food & Beverage", count: f.quantity, revenue: f.revenue })),
    ...facilitySales.map(s => ({ name: s.service, category: "Facility", count: s.quantity, revenue: s.revenue })),
  ].sort((a, b) => b.revenue - a.revenue);

  const handleExport = () => {
    const periodLabel = period === "custom"
      ? `${customStart}_to_${customEnd}`
      : period;
    const filename = `revenue_${periodLabel}_${new Date().toISOString().split("T")[0]}.csv`;

    if (activeTab === "all") {
      const header = ["Source/Item", "Category", "Volume", `Revenue (${currencySymbol})`, "Contribution (%)"];
      const rows = allSalesRows.map(item => [
        item.name,
        item.category,
        String(item.count),
        item.revenue.toFixed(2),
        totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : "0.0",
      ]);
      exportCSV([header, ...rows], filename);
    } else if (activeTab === "rooms") {
      const header = ["Room Type", "Bookings", `Revenue (${currencySymbol})`];
      const rows = roomSales.map(item => [item.type, String(item.bookings), item.revenue.toFixed(2)]);
      exportCSV([header, ...rows], filename);
    } else if (activeTab === "fb") {
      const header = ["Item Name", "Quantity Sold", `Revenue (${currencySymbol})`];
      const rows = fbSales.map(item => [item.item, String(item.quantity), item.revenue.toFixed(2)]);
      exportCSV([header, ...rows], filename);
    } else if (activeTab === "facilities") {
      const header = ["Service Name", "Bookings/Usage", `Revenue (${currencySymbol})`];
      const rows = facilitySales.map(item => [item.service, String(item.quantity), item.revenue.toFixed(2)]);
      exportCSV([header, ...rows], filename);
    }
  };

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

          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Period</Label>
              <Select
                value={period}
                onValueChange={(v) => {
                  setPeriod(v);
                  if (v !== "custom") { setCustomStart(""); setCustomEnd(""); }
                }}
              >
                <SelectTrigger className="w-[160px]" data-testid="select-period">
                  <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                  <SelectItem value="all_time">All Time</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {period === "custom" && (
              <>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    className="w-[145px]"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    data-testid="input-date-from"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    className="w-[145px]"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    data-testid="input-date-to"
                  />
                </div>
              </>
            )}

            <Button
              variant="outline"
              onClick={handleExport}
              data-testid="button-export"
              className="self-end"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary" data-testid="text-total-revenue">
                {currencySymbol}{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredBookings.length} booking{filteredBookings.length !== 1 ? "s" : ""} in period
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
                <div className="text-2xl font-bold" data-testid="text-room-revenue">
                  {currencySymbol}{totalRoomRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalRevenue > 0 ? Math.round((totalRoomRevenue / totalRevenue) * 100) : 0}% of total
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
                <div className="text-2xl font-bold" data-testid="text-fb-revenue">
                  {currencySymbol}{totalFbRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalRevenue > 0 ? Math.round((totalFbRevenue / totalRevenue) * 100) : 0}% of total
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
                <div className="text-2xl font-bold" data-testid="text-facility-revenue">
                  {currencySymbol}{totalFacilityRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalRevenue > 0 ? Math.round((totalFacilityRevenue / totalRevenue) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="all" data-testid="tab-all">All Sales</TabsTrigger>
            <TabsTrigger value="rooms" className="flex items-center gap-2" data-testid="tab-rooms">
              <BedDouble className="h-4 w-4" />
              Rooms
            </TabsTrigger>
            <TabsTrigger value="fb" className="flex items-center gap-2" data-testid="tab-fb">
              <UtensilsCrossed className="h-4 w-4" />
              F&B
            </TabsTrigger>
            <TabsTrigger value="facilities" className="flex items-center gap-2" data-testid="tab-facilities">
              <Sparkles className="h-4 w-4" />
              Facilities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Consolidated Sales Report</CardTitle>
                <CardDescription>All revenue streams for the selected period.</CardDescription>
              </CardHeader>
              <CardContent>
                {allSalesRows.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8" data-testid="text-no-data-all">
                    No data for the selected period.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source / Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Volume</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead className="text-right">Contribution</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allSalesRows.map((item, idx) => (
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
                          <TableCell>{currencySymbol}{item.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
                <CardDescription>Revenue by room type and booking counts for the selected period.</CardDescription>
              </CardHeader>
              <CardContent>
                {roomSales.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8" data-testid="text-no-data-rooms">
                    No room bookings for the selected period.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Room Type</TableHead>
                        <TableHead>Bookings</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead className="text-right">Avg. per Booking</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roomSales.sort((a, b) => b.revenue - a.revenue).map((item) => (
                        <TableRow key={item.id} data-testid={`row-room-sales-${item.id}`}>
                          <TableCell className="font-medium">{item.type}</TableCell>
                          <TableCell>{item.bookings}</TableCell>
                          <TableCell>{currencySymbol}{item.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {currencySymbol}{item.bookings > 0 ? (item.revenue / item.bookings).toFixed(2) : "0.00"}
                          </TableCell>
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
                <CardTitle>Food & Beverage Sales</CardTitle>
                <CardDescription>Fulfilled F&B orders for the selected period.</CardDescription>
              </CardHeader>
              <CardContent>
                {fbSales.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8" data-testid="text-no-data-fb">
                    No F&B sales for the selected period.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Qty Sold</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead className="text-right">Avg. Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fbSales.sort((a, b) => b.revenue - a.revenue).map((item) => (
                        <TableRow key={item.id} data-testid={`row-fb-sales-${item.id}`}>
                          <TableCell className="font-medium">{item.item}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{currencySymbol}{item.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {currencySymbol}{item.quantity > 0 ? (item.revenue / item.quantity).toFixed(2) : "0.00"}
                          </TableCell>
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
                <CardTitle>Facility & Service Sales</CardTitle>
                <CardDescription>Fulfilled facility orders for the selected period.</CardDescription>
              </CardHeader>
              <CardContent>
                {facilitySales.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8" data-testid="text-no-data-facilities">
                    No facility sales for the selected period.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service Name</TableHead>
                        <TableHead>Usage Count</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead className="text-right">Avg. Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facilitySales.sort((a, b) => b.revenue - a.revenue).map((item) => (
                        <TableRow key={item.id} data-testid={`row-facility-sales-${item.id}`}>
                          <TableCell className="font-medium">{item.service}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{currencySymbol}{item.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {currencySymbol}{item.quantity > 0 ? (item.revenue / item.quantity).toFixed(2) : "0.00"}
                          </TableCell>
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
