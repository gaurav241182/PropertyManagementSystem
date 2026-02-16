import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label"; // Imported Label
import { Filter, RefreshCw, Calendar, User, Phone, Mail, CreditCard, FileText, CheckCircle2 } from "lucide-react";

export default function AdminBookings({ role = "owner" }: { role?: "owner" | "manager" }) {
  const [bookings] = useState([
    { 
      id: "BK-7829", 
      guest: "Alice Smith", 
      email: "alice@example.com",
      phone: "+1 (555) 123-4567",
      room: "304", 
      type: "Deluxe Ocean View",
      checkIn: "2024-02-16", 
      checkOut: "2024-02-20", 
      status: "Confirmed", 
      amount: 1250,
      source: "Booking.com",
      paymentStatus: "Paid"
    },
    { 
      id: "BK-7830", 
      guest: "Robert Jones", 
      email: "robert@example.com",
      phone: "+1 (555) 987-6543",
      room: "102", 
      type: "Garden Villa",
      checkIn: "2024-02-17", 
      checkOut: "2024-02-19", 
      status: "Check In", 
      amount: 760,
      source: "Direct",
      paymentStatus: "Pending"
    },
    { 
      id: "BK-7831", 
      guest: "Michael Brown", 
      email: "mike@example.com",
      phone: "+1 (555) 456-7890",
      room: "205", 
      type: "Standard King",
      checkIn: "2024-02-18", 
      checkOut: "2024-02-22", 
      status: "Confirmed", 
      amount: 600,
      source: "Expedia",
      paymentStatus: "Paid"
    },
  ]);

  return (
    <AdminLayout role={role}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Bookings & Reservations</h2>
            <p className="text-muted-foreground">Manage guest reservations and check-ins.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Platforms
            </Button>
            <Button size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              New Reservation
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Bookings</CardTitle>
                <CardDescription>View and manage all reservations.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search guest or booking ID..." className="pl-8 w-[250px]" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="checkin">Check In Today</SelectItem>
                    <SelectItem value="checkout">Check Out Today</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{booking.guest}</span>
                        <span className="text-xs text-muted-foreground">{booking.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>Room {booking.room}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">{booking.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span>In: {booking.checkIn}</span>
                        <span className="text-muted-foreground">Out: {booking.checkOut}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{booking.source}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={booking.paymentStatus === "Paid" ? "default" : "secondary"} className={booking.paymentStatus === "Paid" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                        {booking.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium">
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">Details</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Booking Details - {booking.id}</DialogTitle>
                            <CardDescription>Reservation information for {booking.guest}</CardDescription>
                          </DialogHeader>
                          <div className="grid gap-6 py-4">
                            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                              <Avatar className="h-16 w-16">
                                <AvatarFallback className="text-xl">{booking.guest.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-bold text-lg">{booking.guest}</h3>
                                <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {booking.email}</span>
                                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {booking.phone}</span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Check In</Label>
                                <div className="font-medium">{booking.checkIn}</div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Check Out</Label>
                                <div className="font-medium">{booking.checkOut}</div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Room</Label>
                                <div className="font-medium">{booking.type} ({booking.room})</div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Guests</Label>
                                <div className="font-medium">2 Adults</div>
                              </div>
                            </div>

                            <div className="border-t pt-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">Total Amount</span>
                                <span className="font-bold text-lg">${booking.amount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                                <span>Payment Status</span>
                                <span className={booking.paymentStatus === "Paid" ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                                  {booking.paymentStatus}
                                </span>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button variant="outline" className="flex-1">
                                  <FileText className="mr-2 h-4 w-4" />
                                  View Invoice
                                </Button>
                                {booking.status === "Check In" && (
                                  <Button className="flex-1 bg-green-600 hover:bg-green-700">
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Complete Check-in
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}