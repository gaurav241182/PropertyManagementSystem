import GuestLayout from "@/components/layout/GuestLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Phone, Clock, Wifi, Coffee, Utensils, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function GuestDashboard() {
  // Mock Guest Data (would come from session/API)
  const guest = {
    name: "John Doe",
    bookingId: "BK-12345",
    room: "101",
    checkIn: "Feb 19, 2026",
    checkOut: "Feb 22, 2026",
    nights: 3,
    guests: 2
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
            <h1 className="text-3xl font-serif font-bold text-primary">Hello, {guest.name}</h1>
            <p className="text-muted-foreground">Welcome to your dashboard. How can we help you today?</p>
          </div>
          <Link href="/guest/menu">
            <Button className="w-full md:w-auto bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all">
              <Utensils className="mr-2 h-4 w-4" /> Order Room Service
            </Button>
          </Link>
        </div>

        {/* Booking Status Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <span className="text-xs uppercase font-bold text-muted-foreground">Room Number</span>
                <p className="text-2xl font-serif font-bold text-primary">{guest.room}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase font-bold text-muted-foreground">Booking ID</span>
                <p className="text-lg font-medium">{guest.bookingId}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase font-bold text-muted-foreground">Check-in</span>
                <p className="text-lg font-medium">{guest.checkIn}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase font-bold text-muted-foreground">Check-out</span>
                <p className="text-lg font-medium">{guest.checkOut}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hotel Info */}
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

          {/* Quick Actions / Services */}
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
      </div>
    </GuestLayout>
  );
}