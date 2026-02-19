import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { Booking, Room, Expense, Order } from "@shared/schema";
import { 
  Users, 
  CreditCard, 
  CalendarCheck, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  Loader2,
  Wrench,
  ShoppingCart
} from "lucide-react";

export default function AdminDashboard() {
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({ queryKey: ['/api/bookings'] });
  const { data: rooms = [], isLoading: roomsLoading } = useQuery<Room[]>({ queryKey: ['/api/rooms'] });
  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({ queryKey: ['/api/expenses'] });
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({ queryKey: ['/api/orders'] });

  const isLoading = bookingsLoading || roomsLoading || expensesLoading || ordersLoading;

  const bookingRevenue = bookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || "0"), 0);
  const orderRevenue = orders
    .filter(o => o.status === "Fulfilled")
    .reduce((sum, o) => sum + parseFloat(o.totalAmount || "0"), 0);
  const totalRevenue = bookingRevenue + orderRevenue;
  const totalBookings = bookings.length;
  const activeGuests = bookings.filter(b => b.status === "checked_in").length;
  const occupiedRooms = rooms.filter(r => r.status === "occupied").length;
  const occupancyRate = rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0;

  const pendingExpenses = expenses.filter(e => e.status === "Pending").length;
  const maintenanceRooms = rooms.filter(r => r.status === "maintenance").length;
  const pendingOrders = orders.filter(o => o.status === "Pending").length;
  const hasActionItems = pendingExpenses > 0 || maintenanceRooms > 0 || pendingOrders > 0;

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  const stats = [
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: CreditCard,
    },
    {
      title: "Bookings",
      value: String(totalBookings),
      icon: CalendarCheck,
    },
    {
      title: "Active Guests",
      value: String(activeGuests),
      icon: Users,
    },
    {
      title: "Occupancy Rate",
      value: `${occupancyRate}%`,
      icon: TrendingUp,
    },
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary font-serif">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your hotel's performance.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-sm" data-testid={`stat-card-${index}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={`stat-value-${index}`}>{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">No prior data</p>
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
              {recentBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-bookings">No bookings yet</p>
              ) : (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0" data-testid={`row-booking-${booking.id}`}>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none" data-testid={`text-guest-${booking.id}`}>{booking.guestName} {booking.guestLastName}</p>
                        <p className="text-xs text-muted-foreground">{booking.bookingId} · {booking.checkIn} to {booking.checkOut}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium" data-testid={`text-amount-${booking.id}`}>${parseFloat(booking.totalAmount || "0").toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-xs text-muted-foreground">{booking.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="col-span-3 shadow-sm">
            <CardHeader>
              <CardTitle>Action Items</CardTitle>
            </CardHeader>
            <CardContent>
              {!hasActionItems ? (
                <p className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-actions">No pending items</p>
              ) : (
                <div className="space-y-4">
                  {pendingExpenses > 0 && (
                    <div className="flex items-start gap-4 p-3 bg-amber-50 rounded-lg border border-amber-100" data-testid="action-pending-expenses">
                      <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-amber-900">Pending Approvals</h4>
                        <p className="text-xs text-amber-700 mt-1">{pendingExpenses} expense report{pendingExpenses !== 1 ? "s" : ""} need{pendingExpenses === 1 ? "s" : ""} your approval.</p>
                      </div>
                    </div>
                  )}
                  
                  {maintenanceRooms > 0 && (
                    <div className="flex items-start gap-4 p-3 bg-blue-50 rounded-lg border border-blue-100" data-testid="action-maintenance-rooms">
                      <Wrench className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900">Room Maintenance</h4>
                        <p className="text-xs text-blue-700 mt-1">{maintenanceRooms} room{maintenanceRooms !== 1 ? "s" : ""} require{maintenanceRooms === 1 ? "s" : ""} maintenance.</p>
                      </div>
                    </div>
                  )}
                  
                  {pendingOrders > 0 && (
                    <div className="flex items-start gap-4 p-3 bg-green-50 rounded-lg border border-green-100" data-testid="action-pending-orders">
                      <ShoppingCart className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-green-900">Pending Orders</h4>
                        <p className="text-xs text-green-700 mt-1">{pendingOrders} order{pendingOrders !== 1 ? "s" : ""} pending fulfillment.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
