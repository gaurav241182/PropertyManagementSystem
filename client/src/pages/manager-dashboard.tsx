import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Receipt, 
  CalendarCheck, 
  ArrowUpRight, 
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function ManagerDashboard() {
  const stats = [
    {
      title: "Today's Check-ins",
      value: "8",
      change: "3 Pending",
      icon: CalendarCheck,
      color: "text-blue-600",
    },
    {
      title: "Active Staff",
      value: "12",
      change: "All Present",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Pending Expenses",
      value: "$450.00",
      change: "Needs Approval",
      icon: Receipt,
      color: "text-amber-600",
    },
  ];

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
                <div className="text-2xl font-bold">{stat.value}</div>
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
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">Morning Shift</span>
                  </div>
                  <span className="text-xs text-muted-foreground">6/6 Staff</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-sm font-medium">Evening Shift</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Starts in 2h</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-slate-300" />
                    <span className="text-sm font-medium">Night Shift</span>
                  </div>
                  <span className="text-xs text-muted-foreground">--</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}