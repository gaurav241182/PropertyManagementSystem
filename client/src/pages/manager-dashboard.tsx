import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Receipt, 
  CalendarCheck, 
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Booking, Staff, Expense } from "@shared/schema";
import { useHotelSettings } from "@/hooks/use-hotel-settings";

export default function ManagerDashboard() {
  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({ queryKey: ['/api/bookings'] });
  const { data: staffList, isLoading: staffLoading } = useQuery<Staff[]>({ queryKey: ['/api/staff'] });
  const { data: expensesList, isLoading: expensesLoading } = useQuery<Expense[]>({ queryKey: ['/api/expenses'] });

  const { currencySymbol } = useHotelSettings();
  const isLoading = bookingsLoading || staffLoading || expensesLoading;

  const today = new Date().toISOString().split("T")[0];

  const todayCheckIns = bookings
    ? bookings.filter(b => b.checkIn === today && (b.status === "confirmed" || b.status === "checked_in")).length
    : 0;

  const activeStaffCount = staffList
    ? staffList.filter(s => s.status === "active").length
    : 0;

  const pendingExpensesTotal = expensesList
    ? expensesList
        .filter(e => e.status === "Pending")
        .reduce((sum, e) => sum + parseFloat(e.total as string || "0"), 0)
    : 0;

  const stats = [
    {
      title: "Today's Check-ins",
      value: String(todayCheckIns),
      change: `${todayCheckIns} today`,
      icon: CalendarCheck,
      color: "text-blue-600",
    },
    {
      title: "Active Staff",
      value: String(activeStaffCount),
      change: activeStaffCount > 0 ? "Currently active" : "No active staff",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Pending Expenses",
      value: `${currencySymbol}${pendingExpensesTotal.toFixed(2)}`,
      change: pendingExpensesTotal > 0 ? "Needs Approval" : "No pending",
      icon: Receipt,
      color: "text-amber-600",
    },
  ];

  if (isLoading) {
    return (
      <AdminLayout role="manager">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loading-spinner" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout role="manager">
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary font-serif">Manager Dashboard</h2>
          <p className="text-muted-foreground">Daily operations and staff management.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-sm border-l-4" style={{ borderLeftColor: 'var(--primary)' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={`stat-value-${index}`}>{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Link href="/manager/staff">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all">
                  <Users className="h-6 w-6" />
                  <span>Onboard Staff</span>
                </Button>
              </Link>
              <Link href="/manager/expenses">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all">
                  <Receipt className="h-6 w-6" />
                  <span>Log Expense</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today's Shift Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${activeStaffCount > 0 ? "bg-green-500" : "bg-slate-300"}`} />
                    <span className="text-sm font-medium">Active Staff</span>
                  </div>
                  <span className="text-xs text-muted-foreground" data-testid="active-staff-count">{activeStaffCount} members</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium">Total Staff</span>
                  </div>
                  <span className="text-xs text-muted-foreground" data-testid="total-staff-count">{staffList?.length ?? 0} members</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
