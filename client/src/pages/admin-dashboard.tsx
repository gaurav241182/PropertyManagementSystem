import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  CreditCard, 
  CalendarCheck, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2
} from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    {
      title: "Total Revenue",
      value: "$45,231.89",
      change: "+20.1% from last month",
      trend: "up",
      icon: CreditCard,
    },
    {
      title: "Bookings",
      value: "+2350",
      change: "+180.1% from last month",
      trend: "up",
      icon: CalendarCheck,
    },
    {
      title: "Active Guests",
      value: "124",
      change: "+19% from last month",
      trend: "up",
      icon: Users,
    },
    {
      title: "Occupancy Rate",
      value: "84%",
      change: "-4% from last month",
      trend: "down",
      icon: TrendingUp,
    },
  ];

  const recentBookings = [
    { id: "BK-7829", guest: "Alice Smith", room: "Deluxe Ocean View (304)", dates: "Feb 16 - Feb 20", status: "Confirmed", amount: "$1,250" },
    { id: "BK-7830", guest: "Robert Jones", room: "Garden Villa (102)", dates: "Feb 17 - Feb 19", status: "Pending", amount: "$760" },
    { id: "BK-7831", guest: "Michael Brown", room: "Standard King (205)", dates: "Feb 18 - Feb 22", status: "Confirmed", amount: "$600" },
    { id: "BK-7832", guest: "Sarah Wilson", room: "Executive Suite (401)", dates: "Feb 20 - Feb 25", status: "Checked In", amount: "$2,250" },
    { id: "BK-7833", guest: "James Davis", room: "Deluxe Ocean View (305)", dates: "Feb 21 - Feb 23", status: "Confirmed", amount: "$500" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary font-serif">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your hotel's performance.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-secondary" />
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 shadow-sm">
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{booking.guest}</p>
                      <p className="text-xs text-muted-foreground">{booking.room}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{booking.amount}</p>
                      <p className="text-xs text-muted-foreground">{booking.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3 shadow-sm">
            <CardHeader>
              <CardTitle>Action Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-900">Pending Approvals</h4>
                    <p className="text-xs text-amber-700 mt-1">3 Expense reports need your approval.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900">Room Inspection</h4>
                    <p className="text-xs text-blue-700 mt-1">Room 304 reported maintenance issue.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-3 bg-green-50 rounded-lg border border-green-100">
                  <Users className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-green-900">Staff Onboarding</h4>
                    <p className="text-xs text-green-700 mt-1">New chef joining tomorrow.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}