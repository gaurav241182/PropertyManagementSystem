import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label"; 
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Filter, 
  RefreshCw, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  CreditCard, 
  FileText, 
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  LogOut,
  UtensilsCrossed,
  Sparkles,
  DollarSign,
  Edit,
  Users,
  Upload,
  Eye
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminBookings({ role = "owner" }: { role?: "owner" | "manager" }) {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Mock Data for Restaurant Items and Facilities
  const [restaurantItems, setRestaurantItems] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);

  useEffect(() => {
    const savedRestaurantItems = localStorage.getItem("restaurantItems");
    if (savedRestaurantItems) setRestaurantItems(JSON.parse(savedRestaurantItems));
    else setRestaurantItems([
       { id: 1, name: "Club Sandwich", category: "Food", price: 15 },
       { id: 2, name: "Cappuccino", category: "Beverage", price: 5 },
    ]);

    const defaultFacilities = [
       { id: 1, name: "Extra Bed", price: 30, unit: "night" },
       { id: 2, name: "Airport Transfer", price: 45, unit: "trip" },
       { id: 3, name: "Spa Treatment", price: 80, unit: "session" },
    ];
    setFacilities(defaultFacilities);
  }, []);

  const [bookings, setBookings] = useState([
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
      paymentStatus: "Paid",
      charges: [] as any[],
      advance: 1250,
      taxes: 125,
      accompanyingGuests: [
        { name: "Bob Smith", age: 34, idType: "Passport", idNumber: "A1234567" }
      ]
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
      paymentStatus: "Pending",
      charges: [] as any[],
      advance: 200,
      taxes: 76,
      accompanyingGuests: []
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
      paymentStatus: "Paid",
      charges: [] as any[],
      advance: 600,
      taxes: 60,
      accompanyingGuests: []
    },
  ]);

  // Charge Modal State
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isChargeDialogOpen, setIsChargeDialogOpen] = useState(false);
  const [chargeType, setChargeType] = useState<"Restaurant" | "Facility">("Restaurant");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  // Checkout Modal State
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [checkoutBooking, setCheckoutBooking] = useState<any>(null);

  // View/Edit Booking Dialog State
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<any>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);

  // New Reservation State
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  const [newReservation, setNewReservation] = useState<any>({
    checkIn: "",
    checkOut: "",
    roomType: "",
    guests: 1,
    guestName: "",
    phone: "",
    email: "",
    notes: "",
    accompanyingGuests: []
  });

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast({
        title: "Synchronization Complete",
        description: "Inventory and bookings updated from Booking.com, Expedia, and Airbnb.",
      });
    }, 2000);
  };

  const handleCheckIn = (id: string) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status: "Active" } : b));
    toast({
      title: "Check-in Successful",
      description: `Guest for booking ${id} has been checked in.`,
    });
  };

  const openChargeDialog = (id: string) => {
    setSelectedBookingId(id);
    setIsChargeDialogOpen(true);
    setChargeType("Restaurant");
    setSelectedItemId("");
    setQuantity(1);
  };

  const handleAddCharge = () => {
    if (!selectedBookingId || !selectedItemId) return;

    const item = chargeType === "Restaurant" 
      ? restaurantItems.find(i => i.id.toString() === selectedItemId)
      : facilities.find(f => f.id.toString() === selectedItemId);

    if (!item) return;

    const totalAmount = item.price * quantity;
    const newCharge = {
      id: Date.now(),
      type: chargeType,
      item: item.name,
      quantity: quantity,
      price: item.price,
      amount: totalAmount,
      date: new Date().toLocaleDateString()
    };

    setBookings(bookings.map(b => {
      if (b.id === selectedBookingId) {
        return {
          ...b,
          charges: [...b.charges, newCharge]
        };
      }
      return b;
    }));

    setIsChargeDialogOpen(false);
    toast({
      title: "Charge Added",
      description: `${item.name} (x${quantity}) added to room bill.`,
    });
  };

  const openCheckoutDialog = (booking: any) => {
    setCheckoutBooking(booking);
    setIsCheckoutDialogOpen(true);
  };

  const handleCheckout = () => {
    if (!checkoutBooking) return;

    setBookings(bookings.map(b => b.id === checkoutBooking.id ? { ...b, status: "Checked Out", paymentStatus: "Paid" } : b));
    setIsCheckoutDialogOpen(false);
    toast({
      title: "Checkout Complete",
      description: `Invoice generated and email sent to ${checkoutBooking.email}`,
    });
  };

  const handleDeleteBooking = (id: string) => {
    setBookings(bookings.filter(b => b.id !== id));
    toast({
      title: "Booking Deleted",
      description: "Reservation has been permanently removed.",
    });
  };

  const openViewDialog = (booking: any) => {
    setViewingBooking({ ...booking }); // Clone to avoid direct mutation
    setIsEditingMode(false);
    setIsViewDialogOpen(true);
  };

  const handleSaveBookingChanges = () => {
    setBookings(bookings.map(b => b.id === viewingBooking.id ? viewingBooking : b));
    setIsViewDialogOpen(false);
    toast({
      title: "Booking Updated",
      description: "Guest details and reservation info updated.",
    });
  };

  const handleAddAccompanyingGuest = (isNewRes: boolean = false) => {
    const newGuest = { name: "", age: "", idType: "", idNumber: "" };
    if (isNewRes) {
      setNewReservation({
        ...newReservation,
        accompanyingGuests: [...(newReservation.accompanyingGuests || []), newGuest]
      });
    } else {
      setViewingBooking({
        ...viewingBooking,
        accompanyingGuests: [...(viewingBooking.accompanyingGuests || []), newGuest]
      });
    }
  };

  const updateAccompanyingGuest = (index: number, field: string, value: string, isNewRes: boolean = false) => {
    if (isNewRes) {
      const updated = [...newReservation.accompanyingGuests];
      updated[index] = { ...updated[index], [field]: value };
      setNewReservation({ ...newReservation, accompanyingGuests: updated });
    } else {
      const updated = [...viewingBooking.accompanyingGuests];
      updated[index] = { ...updated[index], [field]: value };
      setViewingBooking({ ...viewingBooking, accompanyingGuests: updated });
    }
  };

  const removeAccompanyingGuest = (index: number, isNewRes: boolean = false) => {
    if (isNewRes) {
      const updated = [...newReservation.accompanyingGuests];
      updated.splice(index, 1);
      setNewReservation({ ...newReservation, accompanyingGuests: updated });
    } else {
      const updated = [...viewingBooking.accompanyingGuests];
      updated.splice(index, 1);
      setViewingBooking({ ...viewingBooking, accompanyingGuests: updated });
    }
  };

  // Helper to calculate totals for checkout
  const calculateTotals = (booking: any) => {
    if (!booking) return { roomTotal: 0, chargesTotal: 0, subtotal: 0, tax: 0, total: 0, due: 0 };
    
    const roomTotal = booking.amount;
    const chargesTotal = (booking.charges || []).reduce((acc: number, curr: any) => acc + curr.amount, 0);
    const subtotal = roomTotal + chargesTotal;
    const tax = booking.taxes + (chargesTotal * 0.1); // Assuming 10% tax on extras
    const total = subtotal + tax;
    const due = total - booking.advance;

    return { roomTotal, chargesTotal, subtotal, tax, total, due };
  };

  return (
    <AdminLayout role={role}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Bookings & Reservations</h2>
            <p className="text-muted-foreground">Manage guest reservations, charges, and checkouts.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {isSyncing ? "Syncing..." : "Sync Platforms"}
            </Button>
            
            <Dialog open={isNewReservationOpen} onOpenChange={setIsNewReservationOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  New Reservation
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Reservation</DialogTitle>
                  <CardDescription>Manually add a booking for a walk-in or phone reservation.</CardDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Check-in Date</Label>
                      <Input type="date" value={newReservation.checkIn} onChange={(e) => setNewReservation({...newReservation, checkIn: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Check-out Date</Label>
                      <Input type="date" value={newReservation.checkOut} onChange={(e) => setNewReservation({...newReservation, checkOut: e.target.value})} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Room Type</Label>
                      <Select value={newReservation.roomType} onValueChange={(val) => setNewReservation({...newReservation, roomType: val})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Room" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard King</SelectItem>
                          <SelectItem value="deluxe">Deluxe Ocean View</SelectItem>
                          <SelectItem value="suite">Executive Suite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Guests</Label>
                      <Select value={newReservation.guests.toString()} onValueChange={(val) => setNewReservation({...newReservation, guests: parseInt(val)})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Count" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Adult</SelectItem>
                          <SelectItem value="2">2 Adults</SelectItem>
                          <SelectItem value="3">2 Adults + 1 Child</SelectItem>
                          <SelectItem value="4">3 Adults</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Primary Guest Name</Label>
                    <Input placeholder="Full Name" value={newReservation.guestName} onChange={(e) => setNewReservation({...newReservation, guestName: e.target.value})} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input type="tel" placeholder="+1..." value={newReservation.phone} onChange={(e) => setNewReservation({...newReservation, phone: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" placeholder="guest@example.com" value={newReservation.email} onChange={(e) => setNewReservation({...newReservation, email: e.target.value})} />
                    </div>
                  </div>

                  {/* Accompanying Guests Section */}
                  <div className="border rounded-md p-4 bg-muted/20">
                    <div className="flex justify-between items-center mb-3">
                       <Label className="flex items-center gap-2">
                         <Users className="h-4 w-4" />
                         Accompanying Guests (Optional)
                       </Label>
                       <Button variant="ghost" size="sm" onClick={() => handleAddAccompanyingGuest(true)} className="h-8">
                         <Plus className="h-3 w-3 mr-1" /> Add Guest
                       </Button>
                    </div>
                    
                    {newReservation.accompanyingGuests && newReservation.accompanyingGuests.length > 0 ? (
                      <div className="space-y-3">
                        {newReservation.accompanyingGuests.map((guest: any, idx: number) => (
                          <div key={idx} className="bg-card p-3 rounded border relative">
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-red-500"
                               onClick={() => removeAccompanyingGuest(idx, true)}
                             >
                               <Trash2 className="h-3 w-3" />
                             </Button>
                             <div className="grid grid-cols-2 gap-3 mb-2">
                               <Input placeholder="Guest Name" className="h-8" value={guest.name} onChange={(e) => updateAccompanyingGuest(idx, 'name', e.target.value, true)} />
                               <Input placeholder="Age/DOB" className="h-8" value={guest.age} onChange={(e) => updateAccompanyingGuest(idx, 'age', e.target.value, true)} />
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                               <Input placeholder="ID Type (Passport/DL)" className="h-8" value={guest.idType} onChange={(e) => updateAccompanyingGuest(idx, 'idType', e.target.value, true)} />
                               <Input placeholder="ID Number" className="h-8" value={guest.idNumber} onChange={(e) => updateAccompanyingGuest(idx, 'idNumber', e.target.value, true)} />
                             </div>
                             <div className="mt-2 flex items-center justify-center border border-dashed rounded py-2 cursor-pointer hover:bg-muted/50">
                               <Upload className="h-3 w-3 mr-2 text-muted-foreground" />
                               <span className="text-xs text-muted-foreground">Upload ID Document</span>
                             </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic text-center py-2">No accompanying guests added.</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Special Requests</Label>
                    <Textarea placeholder="Notes..." value={newReservation.notes} onChange={(e) => setNewReservation({...newReservation, notes: e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewReservationOpen(false)}>Cancel</Button>
                  <Button onClick={() => { setIsNewReservationOpen(false); toast({ title: "Booking Created" }); }}>Confirm Booking</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                    <SelectItem value="active">Active (Checked In)</SelectItem>
                    <SelectItem value="checkout">Checked Out</SelectItem>
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
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => {
                  const totals = calculateTotals(booking);
                  return (
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
                         <div className="flex flex-col">
                          <span className="font-medium">${totals.due.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground">{booking.charges.length} extra charges</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`font-medium ${booking.status === "Active" ? "bg-green-100 text-green-700" : booking.status === "Checked Out" ? "bg-gray-100 text-gray-500" : ""}`}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                         <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" className="h-8" onClick={() => openViewDialog(booking)}>
                              <Eye className="h-3 w-3 mr-1" /> View/Edit
                            </Button>

                            {booking.status === "Check In" || booking.status === "Confirmed" ? (
                              <Button size="sm" variant="outline" className="h-8 border-green-200 text-green-700 hover:bg-green-50" onClick={() => handleCheckIn(booking.id)}>
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Check In
                              </Button>
                            ) : booking.status === "Active" ? (
                              <>
                                <Button size="sm" variant="outline" className="h-8" onClick={() => openChargeDialog(booking.id)}>
                                  <Plus className="h-3 w-3 mr-1" /> Charge
                                </Button>
                                <Button size="sm" className="h-8" onClick={() => openCheckoutDialog(booking)}>
                                  <LogOut className="h-3 w-3 mr-1" /> Out
                                </Button>
                              </>
                            ) : null}
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Reservation?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently remove the booking for {booking.guest}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteBooking(booking.id)} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                         </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* View/Edit Booking Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center pr-8">
                <span>Booking Details - {viewingBooking?.id}</span>
                {!isEditingMode && (
                   <Button size="sm" variant="outline" onClick={() => setIsEditingMode(true)}>
                     <Edit className="h-4 w-4 mr-2" /> Edit Details
                   </Button>
                )}
              </DialogTitle>
              <CardDescription>
                {isEditingMode ? "Editing reservation details." : `Reservation information for ${viewingBooking?.guest}`}
              </CardDescription>
            </DialogHeader>

            {viewingBooking && (
              <div className="grid gap-6 py-4">
                {/* Main Guest Info */}
                <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                   <h4 className="font-semibold text-sm flex items-center">
                     <User className="h-4 w-4 mr-2" /> Primary Guest
                   </h4>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Guest Name</Label>
                        {isEditingMode ? (
                          <Input value={viewingBooking.guest} onChange={(e) => setViewingBooking({...viewingBooking, guest: e.target.value})} />
                        ) : (
                          <div className="font-medium">{viewingBooking.guest}</div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label>Contact Phone</Label>
                        {isEditingMode ? (
                          <Input value={viewingBooking.phone} onChange={(e) => setViewingBooking({...viewingBooking, phone: e.target.value})} />
                        ) : (
                          <div className="font-medium">{viewingBooking.phone}</div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label>Email</Label>
                        {isEditingMode ? (
                          <Input value={viewingBooking.email} onChange={(e) => setViewingBooking({...viewingBooking, email: e.target.value})} />
                        ) : (
                          <div className="font-medium">{viewingBooking.email}</div>
                        )}
                      </div>
                   </div>
                </div>

                {/* Reservation Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <Label>Check In</Label>
                     {isEditingMode ? (
                       <Input type="date" value={viewingBooking.checkIn} onChange={(e) => setViewingBooking({...viewingBooking, checkIn: e.target.value})} />
                     ) : (
                       <div className="font-medium">{viewingBooking.checkIn}</div>
                     )}
                  </div>
                  <div className="space-y-1">
                     <Label>Check Out</Label>
                     {isEditingMode ? (
                       <Input type="date" value={viewingBooking.checkOut} onChange={(e) => setViewingBooking({...viewingBooking, checkOut: e.target.value})} />
                     ) : (
                       <div className="font-medium">{viewingBooking.checkOut}</div>
                     )}
                  </div>
                  <div className="space-y-1">
                     <Label>Room</Label>
                     {isEditingMode ? (
                       <Input value={viewingBooking.room} onChange={(e) => setViewingBooking({...viewingBooking, room: e.target.value})} />
                     ) : (
                       <div className="font-medium">{viewingBooking.room} ({viewingBooking.type})</div>
                     )}
                  </div>
                </div>

                {/* Accompanying Guests */}
                <div className="border-t pt-4">
                   <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-sm flex items-center">
                        <Users className="h-4 w-4 mr-2" /> Accompanying Guests
                      </h4>
                      {isEditingMode && (
                        <Button variant="ghost" size="sm" onClick={() => handleAddAccompanyingGuest(false)} className="h-7 text-xs">
                          <Plus className="h-3 w-3 mr-1" /> Add
                        </Button>
                      )}
                   </div>
                   
                   {(viewingBooking.accompanyingGuests || []).length > 0 ? (
                     <div className="space-y-3">
                       {viewingBooking.accompanyingGuests.map((guest: any, idx: number) => (
                         <div key={idx} className="bg-card p-3 rounded border relative">
                            {isEditingMode && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-red-500"
                                onClick={() => removeAccompanyingGuest(idx, false)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                            <div className="grid grid-cols-2 gap-3 mb-2">
                              {isEditingMode ? (
                                <>
                                  <Input placeholder="Guest Name" className="h-8" value={guest.name} onChange={(e) => updateAccompanyingGuest(idx, 'name', e.target.value, false)} />
                                  <Input placeholder="Age/DOB" className="h-8" value={guest.age} onChange={(e) => updateAccompanyingGuest(idx, 'age', e.target.value, false)} />
                                </>
                              ) : (
                                <>
                                  <div className="text-sm"><span className="text-muted-foreground text-xs block">Name</span> {guest.name}</div>
                                  <div className="text-sm"><span className="text-muted-foreground text-xs block">Age/DOB</span> {guest.age || '-'}</div>
                                </>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {isEditingMode ? (
                                <>
                                  <Input placeholder="ID Type" className="h-8" value={guest.idType} onChange={(e) => updateAccompanyingGuest(idx, 'idType', e.target.value, false)} />
                                  <Input placeholder="ID Number" className="h-8" value={guest.idNumber} onChange={(e) => updateAccompanyingGuest(idx, 'idNumber', e.target.value, false)} />
                                </>
                              ) : (
                                <>
                                  <div className="text-sm"><span className="text-muted-foreground text-xs block">ID Type</span> {guest.idType || '-'}</div>
                                  <div className="text-sm"><span className="text-muted-foreground text-xs block">ID Number</span> {guest.idNumber || '-'}</div>
                                </>
                              )}
                            </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-sm text-muted-foreground italic">No accompanying guests listed.</p>
                   )}
                </div>

              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
              {isEditingMode && (
                <Button onClick={handleSaveBookingChanges}>Save Changes</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Charge Dialog */}
        <Dialog open={isChargeDialogOpen} onOpenChange={setIsChargeDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Room Charge</DialogTitle>
              <CardDescription>Add F&B or Facility charges to {bookings.find(b => b.id === selectedBookingId)?.room}</CardDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Type</Label>
                <div className="col-span-3 flex gap-4">
                  <div 
                    className={`flex flex-col items-center p-3 border rounded-md cursor-pointer ${chargeType === 'Restaurant' ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
                    onClick={() => setChargeType('Restaurant')}
                  >
                    <UtensilsCrossed className="h-5 w-5 mb-1" />
                    <span className="text-xs">Restaurant</span>
                  </div>
                  <div 
                    className={`flex flex-col items-center p-3 border rounded-md cursor-pointer ${chargeType === 'Facility' ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
                    onClick={() => setChargeType('Facility')}
                  >
                    <Sparkles className="h-5 w-5 mb-1" />
                    <span className="text-xs">Facility</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Item</Label>
                <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select Item" />
                  </SelectTrigger>
                  <SelectContent>
                    {(chargeType === 'Restaurant' ? restaurantItems : facilities).map((item: any) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        <div className="flex justify-between w-full gap-4">
                          <span>{item.name}</span>
                          <span className="text-muted-foreground">${item.price}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Qty</Label>
                <Input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} className="col-span-3" min={1} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsChargeDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddCharge}>Add Charge</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Checkout / Invoice Dialog */}
        <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Guest Checkout & Invoice</DialogTitle>
              <CardDescription>Review final charges and process payment.</CardDescription>
            </DialogHeader>
            {checkoutBooking && (
              <div className="space-y-6 py-4">
                <div className="flex justify-between items-start border-b pb-4">
                   <div>
                     <h3 className="font-bold text-lg">{checkoutBooking.guest}</h3>
                     <p className="text-sm text-muted-foreground">Room {checkoutBooking.room} - {checkoutBooking.type}</p>
                     <p className="text-xs text-muted-foreground mt-1">Invoice #{checkoutBooking.id.replace('BK', 'INV')}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-sm font-medium">{checkoutBooking.checkIn} to {checkoutBooking.checkOut}</p>
                     <p className="text-xs text-muted-foreground">3 Nights</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Charge Details</h4>
                   
                   {/* Room Charges */}
                   <div className="flex justify-between text-sm">
                      <span>Room Charges ({checkoutBooking.type})</span>
                      <span className="font-medium">${checkoutBooking.amount.toFixed(2)}</span>
                   </div>

                   {/* Extra Charges */}
                   {checkoutBooking.charges.length > 0 && (
                     <div className="space-y-2 border-l-2 pl-3 my-2">
                       {checkoutBooking.charges.map((charge: any, idx: number) => (
                         <div key={idx} className="flex justify-between text-sm text-muted-foreground">
                            <span>{charge.item} (x{charge.quantity})</span>
                            <span>${charge.amount.toFixed(2)}</span>
                         </div>
                       ))}
                     </div>
                   )}

                   <div className="border-t border-dashed my-2"></div>

                   <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${calculateTotals(checkoutBooking).subtotal.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                      <span>Taxes & Fees</span>
                      <span>${calculateTotals(checkoutBooking).tax.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-sm text-green-600">
                      <span>Advance Payment</span>
                      <span>-${checkoutBooking.advance.toFixed(2)}</span>
                   </div>

                   <div className="border-t pt-2 mt-2 flex justify-between items-center bg-muted/20 p-2 rounded">
                      <span className="font-bold text-lg">Total Due</span>
                      <span className="font-bold text-lg text-primary">${calculateTotals(checkoutBooking).due.toFixed(2)}</span>
                   </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
                   <p className="flex items-center gap-2">
                     <FileText className="h-4 w-4" />
                     Invoice will be automatically emailed to {checkoutBooking.email} upon completion.
                   </p>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsCheckoutDialogOpen(false)}>Save as Draft</Button>
              <Button onClick={handleCheckout} className="bg-green-600 hover:bg-green-700">
                <CreditCard className="mr-2 h-4 w-4" />
                Process Payment & Checkout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}