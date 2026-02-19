import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import GuestLayout from "@/components/layout/GuestLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Phone, Clock, Wifi, Coffee, Utensils, ChevronRight, LogOut } from "lucide-react";
import { Link } from "wouter";

export default function GuestDashboard() {
  const [, setLocation] = useLocation();
  const bookingId = sessionStorage.getItem("guestBookingId");
  const guestName = sessionStorage.getItem("guestName") || "Guest";

  if (!bookingId) {
    setLocation("/guest/login");
    return null;
  }

  const { data: booking, isLoading: bookingLoading } = useQuery<any>({
    queryKey: ['/api/bookings', bookingId],
    enabled: !!bookingId,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<any[]>({
    queryKey: ['/api/guest', bookingId, 'orders'],
    enabled: !!bookingId,
  });

  const handleLogout = () => {
    sessionStorage.removeItem("guestBookingId");
    sessionStorage.removeItem("guestName");
    sessionStorage.removeItem("guestRoomNumber");
    sessionStorage.removeItem("guestCheckIn");
    sessionStorage.removeItem("guestCheckOut");
    sessionStorage.removeItem("guestStatus");
    setLocation("/guest/login");
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const hotelDetails = {
    name: "Grand Luxe Hotel",
    address: "123 Ocean Drive, Miami Beach, FL",
    phone: "+1 (555) 123-4567",
    manager: "Alex Morgan",
    wifi: "GrandLuxe_Guest / Welcome2026"
  };

  return (
    <GuestLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Hello, {booking?.guestName || guestName}</h1>
            <p className="text-muted-foreground">Welcome to your dashboard. How can we help you today?</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Link href="/guest/menu">
              <Button className="flex-1 md:flex-none bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all">
                <Utensils className="mr-2 h-4 w-4" /> Order Room Service
              </Button>
            </Link>
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>

        {bookingLoading ? (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <p className="text-muted-foreground">Loading booking details...</p>
            </CardContent>
          </Card>
        ) : booking ? (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold text-muted-foreground">Room Number</span>
                  <p className="text-2xl font-serif font-bold text-primary" data-testid="text-room-number">{booking.roomNumber || sessionStorage.getItem("guestRoomNumber") || "—"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold text-muted-foreground">Booking ID</span>
                  <p className="text-lg font-medium" data-testid="text-booking-id">{booking.bookingId}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold text-muted-foreground">Check-in</span>
                  <p className="text-lg font-medium" data-testid="text-checkin">{formatDate(booking.checkIn)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold text-muted-foreground">Check-out</span>
                  <p className="text-lg font-medium" data-testid="text-checkout">{formatDate(booking.checkOut)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Hotel Information</CardTitle>
              <CardDescription>Essential details for your stay</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">{hotelDetails.name}</p>
                  <p className="text-sm text-muted-foreground">{hotelDetails.address}</p>
                  <Button variant="link" className="p-0 h-auto text-xs text-primary">Get Directions</Button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <p className="text-sm">{hotelDetails.phone}</p>
              </div>
              <div className="flex items-start gap-3">
                <Wifi className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Wi-Fi Access</p>
                  <p className="text-sm text-muted-foreground">Network: <span className="font-mono text-foreground">{hotelDetails.wifi.split(' / ')[0]}</span></p>
                  <p className="text-sm text-muted-foreground">Password: <span className="font-mono text-foreground">{hotelDetails.wifi.split(' / ')[1]}</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guest Services</CardTitle>
              <CardDescription>Request amenities or services</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Link href="/guest/menu">
                <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                      <Utensils className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">In-Room Dining</p>
                      <p className="text-xs text-muted-foreground">Order food & drinks</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              
              <Link href="/guest/menu?tab=facility">
                <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Housekeeping</p>
                      <p className="text-xs text-muted-foreground">Request room cleaning</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Coffee className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Concierge</p>
                    <p className="text-xs text-muted-foreground">Book tours & transport</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </div>

        {orders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Your order history during this stay</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orders.map((order: any) => (
                  <div key={order.orderId} className="flex items-center justify-between p-3 rounded-lg border" data-testid={`card-order-${order.orderId}`}>
                    <div>
                      <p className="font-medium">{order.orderId}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.type} • {order.items?.length || 0} item(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${Number(order.totalAmount).toFixed(2)}</p>
                      <Badge variant={order.status === "Fulfilled" ? "default" : order.status === "Cancelled" ? "destructive" : "secondary"}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </GuestLayout>
  );
}