import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Booking, Room, Expense, Order } from "@shared/schema";
import { 
  Users, 
  CreditCard, 
  CalendarCheck, 
  TrendingUp, 
  Clock,
  Loader2,
  Wrench,
  ShoppingCart,
  CalendarDays,
  IndianRupee,
  BedDouble,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { useHotelSettings } from "@/hooks/use-hotel-settings";

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-20 bg-gray-200 rounded" />
        <div className="h-8 w-8 bg-gray-100 rounded-lg" />
      </div>
      <div className="h-7 w-24 bg-gray-200 rounded mb-1" />
      <div className="h-2.5 w-16 bg-gray-100 rounded" />
    </div>
  );
}

function SkeletonBookingCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-4 animate-pulse space-y-2">
      <div className="flex justify-between">
        <div className="h-4 w-28 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
      </div>
      <div className="h-3 w-20 bg-gray-100 rounded" />
      <div className="flex justify-between items-center">
        <div className="h-3 w-32 bg-gray-100 rounded" />
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "checked_in") {
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 text-[10px] px-2 py-0.5 rounded-full font-medium">Checked In</Badge>;
  }
  if (status === "checked_out") {
    return <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-0 text-[10px] px-2 py-0.5 rounded-full font-medium">Checked Out</Badge>;
  }
  return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 text-[10px] px-2 py-0.5 rounded-full font-medium">Booked</Badge>;
}

export default function AdminDashboard() {
  const { formatCurrency } = useHotelSettings();
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

  const mobileKpiCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: IndianRupee,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      href: "/admin/sales",
    },
    {
      title: "Bookings",
      value: String(totalBookings),
      icon: CalendarCheck,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      href: "/admin/bookings",
    },
    {
      title: "Active Guests",
      value: String(activeGuests),
      icon: Users,
      iconBg: "bg-green-50",
      iconColor: "text-green-500",
      href: "/admin/bookings",
    },
    {
      title: "Occupancy",
      value: `${occupancyRate}%`,
      icon: BedDouble,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-500",
      href: "/admin/rooms",
    },
  ];

  const desktopStats = [
    { title: "Total Revenue", value: formatCurrency(totalRevenue), icon: CreditCard, href: "/admin/sales" },
    { title: "Bookings", value: String(totalBookings), icon: CalendarCheck, href: "/admin/bookings" },
    { title: "Active Guests", value: String(activeGuests), icon: Users, href: "/admin/bookings" },
    { title: "Occupancy Rate", value: `${occupancyRate}%`, icon: TrendingUp, href: "/admin/rooms" },
  ];

  function formatShortDate(dateStr: string) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  return (
    <AdminLayout>

      {/* ─── MOBILE LAYOUT (md:hidden) ─── */}
      <div className="block md:hidden space-y-5 pb-6">

        {/* Page title */}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary font-serif">Dashboard</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Hotel performance overview</p>
        </div>

        {/* KPI grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {mobileKpiCards.map((card, i) => (
              <Link key={i} href={card.href}>
                <div
                  className="bg-white rounded-2xl shadow-sm border p-4 active:scale-95 transition-transform cursor-pointer"
                  data-testid={`mobile-kpi-${i}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-medium text-muted-foreground leading-tight">{card.title}</span>
                    <div className={`${card.iconBg} p-1.5 rounded-lg`}>
                      <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900 leading-none" data-testid={`mobile-kpi-value-${i}`}>
                    {card.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1.5">No prior data</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Action items — compact inline alerts (only if any) */}
        {!isLoading && hasActionItems && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-0.5">Attention Needed</p>
            <div className="space-y-2">
              {pendingExpenses > 0 && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5" data-testid="mobile-action-expenses">
                  <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-amber-900">Pending Approvals</p>
                    <p className="text-[10px] text-amber-700">{pendingExpenses} expense report{pendingExpenses !== 1 ? "s" : ""} awaiting review</p>
                  </div>
                </div>
              )}
              {maintenanceRooms > 0 && (
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5" data-testid="mobile-action-maintenance">
                  <Wrench className="h-4 w-4 text-blue-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-blue-900">Room Maintenance</p>
                    <p className="text-[10px] text-blue-700">{maintenanceRooms} room{maintenanceRooms !== 1 ? "s" : ""} require maintenance</p>
                  </div>
                </div>
              )}
              {pendingOrders > 0 && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5" data-testid="mobile-action-orders">
                  <ShoppingCart className="h-4 w-4 text-green-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-green-900">Pending Orders</p>
                    <p className="text-[10px] text-green-700">{pendingOrders} order{pendingOrders !== 1 ? "s" : ""} pending fulfillment</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Bookings */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-0.5">Recent Bookings</p>
          {isLoading ? (
            <div className="space-y-2">
              {[0,1,2].map(i => <SkeletonBookingCard key={i} />)}
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
              <AlertCircle className="h-6 w-6 opacity-40" />
              <p className="text-sm">No bookings yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentBookings.map((booking) => (
                <Link key={booking.id} href="/admin/bookings">
                  <div
                    className="bg-white rounded-2xl shadow-sm border px-4 py-3 active:scale-95 transition-transform cursor-pointer"
                    data-testid={`mobile-booking-card-${booking.id}`}
                  >
                    {/* Row 1: Name + Status */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="text-sm font-semibold text-gray-900 truncate" data-testid={`mobile-guest-${booking.id}`}>
                        {booking.guestName} {booking.guestLastName}
                      </p>
                      <StatusBadge status={booking.status} />
                    </div>
                    {/* Row 2: Booking ID */}
                    <p className="text-[10px] text-muted-foreground mb-2">{booking.bookingId}</p>
                    {/* Row 3: Dates + Amount */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <CalendarDays className="h-3 w-3 shrink-0" />
                        <span>{formatShortDate(booking.checkIn)} – {formatShortDate(booking.checkOut)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                        <IndianRupee className="h-3 w-3 text-gray-500" />
                        <span data-testid={`mobile-amount-${booking.id}`}>
                          {parseFloat(booking.totalAmount || "0").toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── DESKTOP LAYOUT (hidden md:block) ─── */}
      <div className="hidden md:block">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary font-serif">Dashboard</h2>
            <p className="text-muted-foreground">Overview of your hotel's performance.</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {desktopStats.map((stat, index) => (
                  <Link key={index} href={stat.href}>
                    <Card className="shadow-sm cursor-pointer hover:shadow-md hover:border-primary/30 transition-all" data-testid={`stat-card-${index}`}>
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
                  </Link>
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
                          <Link key={booking.id} href="/admin/bookings">
                            <div className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0 cursor-pointer hover:bg-muted/40 rounded-md px-2 -mx-2 transition-colors" data-testid={`row-booking-${booking.id}`}>
                              <div className="space-y-1">
                                <p className="text-sm font-medium leading-none" data-testid={`text-guest-${booking.id}`}>{booking.guestName} {booking.guestLastName}</p>
                                <p className="text-xs text-muted-foreground">{booking.bookingId} · {booking.checkIn} to {booking.checkOut}</p>
                              </div>
                              <div className="text-right flex items-center gap-2">
                                <div>
                                  <p className="text-sm font-medium" data-testid={`text-amount-${booking.id}`}>{formatCurrency(parseFloat(booking.totalAmount || "0"))}</p>
                                  <p className="text-xs text-muted-foreground">{booking.status}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </Link>
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
            </>
          )}
        </div>
      </div>

    </AdminLayout>
  );
}
