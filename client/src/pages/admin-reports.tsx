import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, CalendarIcon, Loader2 } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import type { Booking, Expense, Order } from "@shared/schema";
import { useHotelSettings } from "@/hooks/use-hotel-settings";

export default function AdminReports() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [reportPeriod, setReportPeriod] = useState("month");

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({ queryKey: ['/api/bookings'] });
  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({ queryKey: ['/api/expenses'] });
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({ queryKey: ['/api/orders'] });

  const isLoading = bookingsLoading || expensesLoading || ordersLoading;

  const revenueData = useMemo(() => {
    const monthMap: Record<string, { rooms: number; food: number }> = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (const b of bookings) {
      const d = new Date(b.checkIn);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthMap[key]) monthMap[key] = { rooms: 0, food: 0 };
      monthMap[key].rooms += parseFloat(b.totalAmount as string) || 0;
    }

    const fulfilledOrders = orders.filter((o) => o.status === "Fulfilled");
    for (const o of fulfilledOrders) {
      const d = new Date(String(o.createdAt));
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthMap[key]) monthMap[key] = { rooms: 0, food: 0 };
      monthMap[key].food += parseFloat(o.totalAmount as string) || 0;
    }

    const sorted = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b));
    return sorted.map(([key, val]) => {
      const month = parseInt(key.split("-")[1]);
      return { name: monthNames[month], rooms: val.rooms, food: val.food };
    });
  }, [bookings, orders]);

  const expenseData = useMemo(() => {
    const catMap: Record<string, number> = {};
    for (const e of expenses) {
      const cat = e.category || "Other";
      catMap[cat] = (catMap[cat] || 0) + (parseFloat(e.total as string) || 0);
    }
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const { totalRevenue, totalExpenses, netProfit } = useMemo(() => {
    const rev = bookings.reduce((sum, b) => sum + (parseFloat(b.totalAmount as string) || 0), 0)
      + orders.filter((o) => o.status === "Fulfilled").reduce((sum, o) => sum + (parseFloat(o.totalAmount as string) || 0), 0);
    const exp = expenses.reduce((sum, e) => sum + (parseFloat(e.total as string) || 0), 0);
    return { totalRevenue: rev, totalExpenses: exp, netProfit: rev - exp };
  }, [bookings, expenses, orders]);

  const { formatCurrency } = useHotelSettings();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A855F7', '#EC4899', '#F97316', '#06B6D4'];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Financial Reports</h2>
            <p className="text-muted-foreground">Analyze revenue, expenses, and profit margins.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Select value={reportPeriod} onValueChange={setReportPeriod}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {reportPeriod === "custom" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date range</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            )}

            <Button variant="outline" size="icon" title="Export PDF">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue breakdown by Rooms vs F&B.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="rooms" fill="#8884d8" name="Room Sales" />
                    <Bar dataKey="food" fill="#82ca9d" name="F&B Sales" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expense Distribution</CardTitle>
              <CardDescription>Where is the money going?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss Summary</CardTitle>
            <CardDescription className="flex items-center gap-1">
              Reporting Period: <span className="font-medium text-foreground capitalize">{reportPeriod}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2" data-testid="text-total-revenue">
                <span className="font-medium">Total Revenue</span>
                <span className="font-bold text-green-600">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2" data-testid="text-total-expenses">
                <span className="font-medium">Total Expenses</span>
                <span className="font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
              </div>
              <div className="flex justify-between items-center pt-2" data-testid="text-net-profit">
                <span className="font-bold text-lg">Net Profit</span>
                <span className="font-bold text-lg text-primary">{formatCurrency(netProfit)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}