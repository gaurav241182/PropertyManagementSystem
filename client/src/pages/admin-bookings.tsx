import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  Eye,
  Globe,
  Printer,
  Download,
  MessageCircle
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { differenceInYears, parseISO } from "date-fns";

export default function AdminBookings({ role = "owner" }: { role?: "owner" | "manager" }) {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { data: bookingsData = [], isLoading: bookingsLoading } = useQuery<any[]>({ queryKey: ['/api/bookings'] });
  const { data: roomsData = [] } = useQuery<any[]>({ queryKey: ['/api/rooms'] });
  const { data: roomTypesData = [] } = useQuery<any[]>({ queryKey: ['/api/room-types'] });
  const { data: menuItemsData = [] } = useQuery<any[]>({ queryKey: ['/api/menu-items'] });
  const { data: facilitiesData = [] } = useQuery<any[]>({ queryKey: ['/api/facilities'] });
  const { data: settingsData = {} } = useQuery<Record<string, string>>({ queryKey: ['/api/settings'] });

  const getRoomNumber = (roomId: number) => {
    const room = roomsData.find((r: any) => r.id === roomId);
    return room ? room.roomNumber : `#${roomId}`;
  };

  const getRoomTypeName = (roomTypeId: number) => {
    const rt = roomTypesData.find((r: any) => r.id === roomTypeId);
    return rt ? rt.name : "";
  };

  const getSetting = (key: string, defaultValue: string = "") => {
    return (settingsData as Record<string, string>)?.[key] || defaultValue;
  };

  const invoiceSettings = {
    taxableItems: {
      room: true,
      food: true,
      facility: true,
      other: false
    },
    autoSend: {
      email: true,
      whatsapp: false
    }
  };

  const [checkoutOptions, setCheckoutOptions] = useState({
    email: true,
    whatsapp: false
  });

  const restaurantItems = menuItemsData.map((item: any) => ({
    ...item,
    price: parseFloat(item.price) || 0
  }));

  const facilities = facilitiesData.map((item: any) => ({
    ...item,
    price: parseFloat(item.price) || 0
  }));

  const bookings = bookingsData.map((b: any) => ({
    ...b,
    amount: parseFloat(b.totalAmount) || 0,
    advance: parseFloat(b.advanceAmount) || 0,
    guest: `${b.guestName}${b.guestLastName ? ' ' + b.guestLastName : ''}`,
    room: getRoomNumber(b.roomId),
    type: getRoomTypeName(b.roomTypeId),
    email: b.guestEmail || "",
    phone: b.guestPhone || "",
    phoneCountry: "+91",
    taxes: (parseFloat(b.totalAmount) || 0) * 0.1,
    charges: [] as any[],
    source: "Direct",
    bookedDate: b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : "",
    paymentStatus: b.status === "checked_out" ? "Paid" : "Pending",
    accompanyingGuests: [],
    status: b.status === "confirmed" ? "Confirmed" : b.status === "checked_in" ? "Active" : b.status === "checked_out" ? "Checked Out" : b.status === "cancelled" ? "Cancelled" : b.status
  }));

  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/bookings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({ title: "Booking Created", description: "New reservation has been created." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/bookings/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/bookings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({ title: "Booking Deleted", description: "Reservation has been permanently removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const addChargeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/booking-charges", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/booking-charges'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isChargeDialogOpen, setIsChargeDialogOpen] = useState(false);
  const [chargeType, setChargeType] = useState<"Restaurant" | "Facility">("Restaurant");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [checkoutBooking, setCheckoutBooking] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<any>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);

  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  const [newReservation, setNewReservation] = useState<any>({
    checkIn: "",
    checkOut: "",
    roomType: "",
    roomId: "",
    guests: 1,
    guestName: "",
    phoneCountry: "+91",
    phone: "",
    email: "",
    notes: "",
    advanceAmount: 0,
    accompanyingGuests: [],
    selectedPaidFacilityIds: [] as number[]
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

  const calculateAge = (dob: string) => {
    if (!dob) return "";
    try {
      return differenceInYears(new Date(), parseISO(dob));
    } catch (e) {
      return "";
    }
  };

  const handleCheckIn = (booking: any) => {
    updateBookingMutation.mutate(
      { id: booking.id, data: { status: "checked_in" } },
      {
        onSuccess: () => {
          toast({
            title: "Check-in Successful",
            description: `Guest for booking ${booking.bookingId} has been checked in.`,
          });
        }
      }
    );
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
      ? restaurantItems.find((i: any) => i.id.toString() === selectedItemId)
      : facilities.find((f: any) => f.id.toString() === selectedItemId);

    if (!item) return;

    const totalAmount = item.price * quantity;
    const selectedBooking = bookings.find((b: any) => b.bookingId === selectedBookingId);
    
    addChargeMutation.mutate(
      {
        bookingId: selectedBookingId,
        description: `${item.name} x${quantity}`,
        category: chargeType === "Restaurant" ? "Food" : "Facility",
        amount: totalAmount.toFixed(2),
      },
      {
        onSuccess: () => {
          setIsChargeDialogOpen(false);
          toast({
            title: "Charge Added",
            description: `${item.name} (x${quantity}) added to room bill.`,
          });
        }
      }
    );
  };


  const handleDeleteBooking = (booking: any) => {
    deleteBookingMutation.mutate(booking.id);
  };

  const openViewDialog = (booking: any) => {
    setViewingBooking({ ...booking });
    setIsEditingMode(false);
    setIsViewDialogOpen(true);
  };

  const handleSaveBookingChanges = () => {
    if (!viewingBooking) return;
    updateBookingMutation.mutate(
      {
        id: viewingBooking.id,
        data: {
          guestName: viewingBooking.guest?.split(' ')[0] || viewingBooking.guestName,
          guestLastName: viewingBooking.guest?.split(' ').slice(1).join(' ') || viewingBooking.guestLastName || "",
          guestEmail: viewingBooking.email,
          guestPhone: viewingBooking.phone,
          checkIn: viewingBooking.checkIn,
          checkOut: viewingBooking.checkOut,
        }
      },
      {
        onSuccess: () => {
          setIsViewDialogOpen(false);
          toast({
            title: "Booking Updated",
            description: "Guest details and reservation info updated.",
          });
        }
      }
    );
  };

  const handleAddAccompanyingGuest = (isNewRes: boolean = false) => {
    const newGuest = { name: "", dob: "", age: "", idType: "", idNumber: "", phoneCountry: "+91", phone: "", email: "" };
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
      
      if (field === 'dob') {
        updated[index].age = calculateAge(value);
      }
      
      setNewReservation({ ...newReservation, accompanyingGuests: updated });
    } else {
      const updated = [...viewingBooking.accompanyingGuests];
      updated[index] = { ...updated[index], [field]: value };
      
      if (field === 'dob') {
        updated[index].age = calculateAge(value);
      }

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

  const calculateTotals = (booking: any) => {
    if (!booking) return { roomTotal: 0, chargesTotal: 0, subtotal: 0, tax: 0, total: 0, due: 0 };
    
    const roomTotal = booking.amount;
    const chargesTotal = (booking.charges || []).reduce((acc: number, curr: any) => acc + curr.amount, 0);
    const subtotal = roomTotal + chargesTotal;
    
    let tax = 0;
    
    if (invoiceSettings.taxableItems.room) {
      tax += booking.taxes;
    }

    if (booking.charges) {
      booking.charges.forEach((charge: any) => {
        let isTaxable = false;
        if (charge.type === 'Restaurant' && invoiceSettings.taxableItems.food) isTaxable = true;
        if (charge.type === 'Facility' && invoiceSettings.taxableItems.facility) isTaxable = true;
        
        if (isTaxable) {
           tax += (charge.amount * 0.1);
        }
      });
    }

    const total = subtotal + tax;
    const due = total - booking.advance;

    return { roomTotal, chargesTotal, subtotal, tax, total, due };
  };

  const openCheckoutDialog = (booking: any) => {
    setCheckoutBooking(booking);
    setCheckoutOptions(invoiceSettings.autoSend);
    setIsCheckoutDialogOpen(true);
  };

  const handleCheckout = () => {
    if (!checkoutBooking) return;

    updateBookingMutation.mutate(
      { id: checkoutBooking.id, data: { status: "checked_out" } },
      {
        onSuccess: () => {
          setIsCheckoutDialogOpen(false);
          
          let message = "Invoice generated successfully.";
          if (checkoutOptions.email) message += " Email sent.";
          if (checkoutOptions.whatsapp) message += " WhatsApp sent.";

          toast({
            title: "Checkout Complete",
            description: message,
          });
        }
      }
    );
  };

  const getSelectedRoomTypeFacilities = () => {
    if (!newReservation.roomType) return { included: [], paidOptional: [] };
    const selectedRoomType = roomTypesData.find((rt: any) => rt.id.toString() === newReservation.roomType);
    if (!selectedRoomType) return { included: [], paidOptional: [] };
    const rtFacilityIds: number[] = (() => { try { return JSON.parse(selectedRoomType.facilityIds || "[]"); } catch { return []; } })();
    const defaultFacilities = facilitiesData.filter((f: any) => f.isDefault && f.active);
    const allFacilityIds = [...new Set([...rtFacilityIds, ...defaultFacilities.map((f: any) => f.id)])];
    const allFacilities = allFacilityIds.map((id: number) => facilitiesData.find((f: any) => f.id === id && f.active)).filter(Boolean);
    const included = allFacilities.filter((f: any) => f.isFree);
    const paidOptional = allFacilities.filter((f: any) => !f.isFree);
    return { included, paidOptional };
  };

  const handleCreateReservation = () => {
    const bookingId = `BK-${Date.now().toString().slice(-6)}`;
    const checkInDate = new Date(newReservation.checkIn);
    const checkOutDate = new Date(newReservation.checkOut);
    const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24)));

    const selectedRoomType = roomTypesData.find((rt: any) => rt.id.toString() === newReservation.roomType);
    const roomAmount = selectedRoomType ? (parseFloat(selectedRoomType.basePrice) || 0) * nights : 0;

    const { paidOptional } = getSelectedRoomTypeFacilities();
    const selectedPaidFacilities = paidOptional.filter((f: any) => newReservation.selectedPaidFacilityIds.includes(f.id));
    const facilityTotal = selectedPaidFacilities.reduce((sum: number, f: any) => {
      const price = parseFloat(f.price) || 0;
      if (f.unit === "night") return sum + price * nights;
      if (f.unit === "person") return sum + price * (newReservation.guests || 1);
      return sum + price;
    }, 0);

    const totalAmount = roomAmount + facilityTotal;

    const roomsForType = roomsData.filter((r: any) => r.roomTypeId.toString() === newReservation.roomType && r.status === "available");
    const roomId = newReservation.roomId ? parseInt(newReservation.roomId) : (roomsForType.length > 0 ? roomsForType[0].id : 0);

    createBookingMutation.mutate(
      {
        bookingId,
        guestName: newReservation.guestName.split(' ')[0] || newReservation.guestName,
        guestLastName: newReservation.guestName.split(' ').slice(1).join(' ') || "",
        guestEmail: newReservation.email || "",
        guestPhone: newReservation.phone ? `${newReservation.phoneCountry}${newReservation.phone}` : "",
        roomId,
        roomTypeId: parseInt(newReservation.roomType) || 0,
        checkIn: newReservation.checkIn,
        checkOut: newReservation.checkOut,
        nights,
        adults: newReservation.guests,
        children: 0,
        status: "confirmed",
        totalAmount: totalAmount.toFixed(2),
        advanceAmount: (newReservation.advanceAmount || 0).toFixed(2),
        paymentMethod: "Cash",
        notes: newReservation.notes || "",
        facilityCharges: selectedPaidFacilities.map((f: any) => ({
          description: f.name,
          category: "Facility",
          amount: f.unit === "night" ? (parseFloat(f.price) * nights).toFixed(2) : f.unit === "person" ? (parseFloat(f.price) * (newReservation.guests || 1)).toFixed(2) : parseFloat(f.price).toFixed(2),
        })),
      },
      {
        onSuccess: () => {
          setIsNewReservationOpen(false);
          setNewReservation({
            checkIn: "",
            checkOut: "",
            roomType: "",
            roomId: "",
            guests: 1,
            guestName: "",
            phoneCountry: "+91",
            phone: "",
            email: "",
            notes: "",
            advanceAmount: 0,
            accompanyingGuests: [],
            selectedPaidFacilityIds: []
          });
        }
      }
    );
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
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
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
                      <Select value={newReservation.roomType} onValueChange={(val) => setNewReservation({...newReservation, roomType: val, roomId: "", selectedPaidFacilityIds: []})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Room Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypesData.map((rt: any) => (
                            <SelectItem key={rt.id} value={rt.id.toString()}>{rt.name}</SelectItem>
                          ))}
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

                  {newReservation.roomType && (() => {
                    const { included, paidOptional } = getSelectedRoomTypeFacilities();
                    if (included.length === 0 && paidOptional.length === 0) return null;
                    return (
                      <div className="border rounded-md p-4 bg-muted/20 space-y-3" data-testid="section-booking-facilities">
                        <Label className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Room Facilities
                        </Label>
                        {included.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Included (Free)</p>
                            <div className="flex flex-wrap gap-2">
                              {included.map((f: any) => (
                                <span key={f.id} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-md">{f.name}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {paidOptional.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Paid Add-ons (optional)</p>
                            <div className="space-y-1.5">
                              {paidOptional.map((f: any) => (
                                <div key={f.id} className="flex items-center gap-2 px-3 py-2 border rounded-md bg-white">
                                  <Checkbox
                                    checked={newReservation.selectedPaidFacilityIds.includes(f.id)}
                                    onCheckedChange={(checked) => {
                                      const ids = checked
                                        ? [...newReservation.selectedPaidFacilityIds, f.id]
                                        : newReservation.selectedPaidFacilityIds.filter((id: number) => id !== f.id);
                                      setNewReservation({...newReservation, selectedPaidFacilityIds: ids});
                                    }}
                                    data-testid={`checkbox-booking-facility-${f.id}`}
                                  />
                                  <span className="text-sm flex-1">{f.name}</span>
                                  <span className="text-xs text-amber-700 font-medium">{f.unit === "night" ? `₹${Number(f.price).toFixed(2)}/night` : f.unit === "person" ? `₹${Number(f.price).toFixed(2)}/person` : `₹${Number(f.price).toFixed(2)}`}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="space-y-2">
                    <Label>Primary Guest Name</Label>
                    <Input placeholder="Full Name" value={newReservation.guestName} onChange={(e) => setNewReservation({...newReservation, guestName: e.target.value})} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                      <Label>Phone</Label>
                      <div className="flex gap-2">
                        <Input className="w-20" placeholder="+91" value={newReservation.phoneCountry} onChange={(e) => setNewReservation({...newReservation, phoneCountry: e.target.value})} />
                        <Input type="tel" placeholder="98765..." value={newReservation.phone} onChange={(e) => setNewReservation({...newReservation, phone: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" placeholder="guest@example.com" value={newReservation.email} onChange={(e) => setNewReservation({...newReservation, email: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Advance Payment</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="number" 
                        className="pl-9" 
                        placeholder="0.00" 
                        value={newReservation.advanceAmount} 
                        onChange={(e) => setNewReservation({...newReservation, advanceAmount: parseFloat(e.target.value)})} 
                      />
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
                      <div className="space-y-4">
                        {newReservation.accompanyingGuests.map((guest: any, idx: number) => (
                          <div key={idx} className="bg-card p-4 rounded border relative space-y-3">
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-red-500"
                               onClick={() => removeAccompanyingGuest(idx, true)}
                             >
                               <Trash2 className="h-3 w-3" />
                             </Button>
                             
                             <div className="grid grid-cols-2 gap-3">
                               <div className="space-y-1">
                                 <Label className="text-xs">Full Name</Label>
                                 <Input placeholder="Guest Name" className="h-8" value={guest.name} onChange={(e) => updateAccompanyingGuest(idx, 'name', e.target.value, true)} />
                               </div>
                               <div className="space-y-1">
                                 <Label className="text-xs">Date of Birth</Label>
                                 <div className="flex gap-2">
                                    <Input type="date" className="h-8 flex-1" value={guest.dob} onChange={(e) => updateAccompanyingGuest(idx, 'dob', e.target.value, true)} />
                                    <div className="h-8 w-16 bg-muted flex items-center justify-center text-sm rounded border">
                                      {guest.age || '-'} y/o
                                    </div>
                                 </div>
                               </div>
                             </div>

                             <div className="grid grid-cols-2 gap-3">
                               <div className="space-y-1">
                                 <Label className="text-xs">ID Type</Label>
                                 <Select value={guest.idType} onValueChange={(val) => updateAccompanyingGuest(idx, 'idType', val, true)}>
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Select ID" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Aadhar Card">Aadhar Card</SelectItem>
                                    <SelectItem value="Passport">Passport</SelectItem>
                                    <SelectItem value="Driving License">Driving License</SelectItem>
                                    <SelectItem value="Voter ID">Voter ID</SelectItem>
                                  </SelectContent>
                                </Select>
                               </div>
                               <div className="space-y-1">
                                 <Label className="text-xs">ID Number</Label>
                                 <Input placeholder="ID Number" className="h-8" value={guest.idNumber} onChange={(e) => updateAccompanyingGuest(idx, 'idNumber', e.target.value, true)} />
                               </div>
                             </div>

                             <div className="grid grid-cols-2 gap-3">
                               <div className="space-y-1">
                                 <Label className="text-xs">Phone (Optional)</Label>
                                 <div className="flex gap-2">
                                  <Input className="w-16 h-8" placeholder="+91" value={guest.phoneCountry} onChange={(e) => updateAccompanyingGuest(idx, 'phoneCountry', e.target.value, true)} />
                                  <Input type="tel" className="h-8" placeholder="Phone" value={guest.phone} onChange={(e) => updateAccompanyingGuest(idx, 'phone', e.target.value, true)} />
                                 </div>
                               </div>
                               <div className="space-y-1">
                                 <Label className="text-xs">Email (Optional)</Label>
                                 <Input type="email" placeholder="Email" className="h-8" value={guest.email} onChange={(e) => updateAccompanyingGuest(idx, 'email', e.target.value, true)} />
                               </div>
                             </div>

                             <div className="flex items-center justify-center border border-dashed rounded py-2 cursor-pointer hover:bg-muted/50">
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
                  <Button onClick={handleCreateReservation} disabled={createBookingMutation.isPending}>
                    {createBookingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm Booking
                  </Button>
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
            {bookingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
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
                {bookings.map((booking: any) => {
                  const totals = calculateTotals(booking);
                  return (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{booking.guest}</span>
                          <span className="text-xs text-muted-foreground">{booking.bookingId}</span>
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

                            {booking.status === "Confirmed" ? (
                              <Button size="sm" variant="outline" className="h-8 border-green-200 text-green-700 hover:bg-green-50" onClick={() => handleCheckIn(booking)}>
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Check In
                              </Button>
                            ) : booking.status === "Active" ? (
                              <>
                                <Button size="sm" variant="outline" className="h-8" onClick={() => openChargeDialog(booking.bookingId)}>
                                  <Plus className="h-3 w-3 mr-1" /> Charge
                                </Button>
                                <Button size="sm" className="h-8" onClick={() => openCheckoutDialog(booking)}>
                                  <LogOut className="h-3 w-3 mr-1" /> Out
                                </Button>
                              </>
                            ) : null}
                            
                            {role === "owner" && (
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
                                  <AlertDialogAction onClick={() => handleDeleteBooking(booking)} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            )}
                         </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>

        {/* View/Edit Booking Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center pr-8">
                <span>Booking Details - {viewingBooking?.bookingId}</span>
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
                          <div className="flex gap-2">
                             <Input className="w-20" value={viewingBooking.phoneCountry} onChange={(e) => setViewingBooking({...viewingBooking, phoneCountry: e.target.value})} />
                             <Input value={viewingBooking.phone} onChange={(e) => setViewingBooking({...viewingBooking, phone: e.target.value})} />
                          </div>
                        ) : (
                          <div className="font-medium">{viewingBooking.phoneCountry} {viewingBooking.phone}</div>
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
                     <div className="space-y-4">
                       {viewingBooking.accompanyingGuests.map((guest: any, idx: number) => (
                         <div key={idx} className="bg-card p-4 rounded border relative space-y-3">
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
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Full Name</Label>
                                {isEditingMode ? (
                                  <Input className="h-8" value={guest.name} onChange={(e) => updateAccompanyingGuest(idx, 'name', e.target.value, false)} />
                                ) : (
                                  <div className="text-sm font-medium">{guest.name}</div>
                                )}
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Age (Auto from DOB)</Label>
                                {isEditingMode ? (
                                  <div className="flex gap-2">
                                     <Input type="date" className="h-8 flex-1" value={guest.dob} onChange={(e) => updateAccompanyingGuest(idx, 'dob', e.target.value, false)} />
                                     <div className="h-8 w-16 bg-muted flex items-center justify-center text-sm rounded border">
                                       {guest.age || '-'}
                                     </div>
                                  </div>
                                ) : (
                                  <div className="text-sm font-medium">{guest.age || '-'} y/o (DOB: {guest.dob || '-'})</div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">ID Details</Label>
                                {isEditingMode ? (
                                  <div className="flex gap-2">
                                    <Select value={guest.idType} onValueChange={(val) => updateAccompanyingGuest(idx, 'idType', val, false)}>
                                      <SelectTrigger className="h-8 flex-1">
                                        <SelectValue placeholder="ID Type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Aadhar Card">Aadhar Card</SelectItem>
                                        <SelectItem value="Passport">Passport</SelectItem>
                                        <SelectItem value="Driving License">Driving License</SelectItem>
                                        <SelectItem value="Voter ID">Voter ID</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Input className="h-8 flex-1" placeholder="ID Number" value={guest.idNumber} onChange={(e) => updateAccompanyingGuest(idx, 'idNumber', e.target.value, false)} />
                                  </div>
                                ) : (
                                  <div className="text-sm font-medium">{guest.idType}: {guest.idNumber}</div>
                                )}
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Phone (Optional)</Label>
                                {isEditingMode ? (
                                  <div className="flex gap-2">
                                     <Input className="w-16 h-8" placeholder="+91" value={guest.phoneCountry} onChange={(e) => updateAccompanyingGuest(idx, 'phoneCountry', e.target.value, false)} />
                                     <Input type="tel" className="h-8" value={guest.phone} onChange={(e) => updateAccompanyingGuest(idx, 'phone', e.target.value, false)} />
                                  </div>
                                ) : (
                                  <div className="text-sm font-medium">{guest.phone ? `${guest.phoneCountry || ''} ${guest.phone}` : '-'}</div>
                                )}
                              </div>
                            </div>

                            {isEditingMode && (
                             <div className="flex items-center justify-center border border-dashed rounded py-2 cursor-pointer hover:bg-muted/50 mt-2">
                               <Upload className="h-3 w-3 mr-2 text-muted-foreground" />
                               <span className="text-xs text-muted-foreground">Upload ID Document</span>
                             </div>
                            )}
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-sm text-muted-foreground italic">No accompanying guests listed.</p>
                   )}
                </div>

                {/* Booking Meta Info */}
                <div className="bg-muted/10 p-3 rounded text-xs text-muted-foreground grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Booking ID:</span> {viewingBooking.bookingId}
                  </div>
                  <div className="text-right">
                    <span className="font-medium">Booked On:</span> {viewingBooking.bookedDate || "N/A"} 
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {Math.ceil((new Date(viewingBooking.checkOut).getTime() - new Date(viewingBooking.checkIn).getTime()) / (1000 * 3600 * 24))} Nights
                  </div>
                  <div className="text-right">
                    <span className="font-medium">Source:</span> {viewingBooking.source}
                  </div>
                </div>

              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
              {isEditingMode && (
                <Button onClick={handleSaveBookingChanges} disabled={updateBookingMutation.isPending}>
                  {updateBookingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Charge Dialog */}
        <Dialog open={isChargeDialogOpen} onOpenChange={setIsChargeDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Room Charge</DialogTitle>
              <CardDescription>Add F&B or Facility charges to booking {selectedBookingId}</CardDescription>
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
              <Button onClick={handleAddCharge} disabled={addChargeMutation.isPending}>
                {addChargeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Charge
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Checkout / Invoice Dialog */}
        <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Guest Checkout & Invoice</DialogTitle>
              <CardDescription>Review final charges, configure invoice, and process payment.</CardDescription>
            </DialogHeader>
            {checkoutBooking && (
              <div className="space-y-6 py-4">
                <div className="flex justify-between items-start border-b pb-4">
                   <div>
                     <h3 className="font-bold text-lg">{checkoutBooking.guest}</h3>
                     <p className="text-sm text-muted-foreground">Room {checkoutBooking.room} - {checkoutBooking.type}</p>
                     <p className="text-xs text-muted-foreground mt-1">Invoice #{(checkoutBooking.bookingId || '').replace('BK', 'INV')}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-sm font-medium">{checkoutBooking.checkIn} to {checkoutBooking.checkOut}</p>
                     <p className="text-xs text-muted-foreground">{checkoutBooking.nights || Math.ceil((new Date(checkoutBooking.checkOut).getTime() - new Date(checkoutBooking.checkIn).getTime()) / (1000 * 3600 * 24))} Nights</p>
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
                      <span>Taxes & Fees {(!invoiceSettings.taxableItems.room || !invoiceSettings.taxableItems.food) && <span className="text-xs text-muted-foreground">(Adjusted)</span>}</span>
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

                   {/* Payment Method - Only show if not checked out */}
                   {checkoutBooking.status !== "Checked Out" && (
                     <div className="pt-4 space-y-2">
                        <Label>Payment Method</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Payment Method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Card">Credit/Debit Card</SelectItem>
                            <SelectItem value="UPI">UPI / QR Code</SelectItem>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>
                   )}
                </div>

                {/* Automation & Actions - Only show if Checked Out */}
                {checkoutBooking.status === "Checked Out" && (
                  <div className="space-y-4 pt-2">
                     <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Invoice Actions</h4>
                     
                     <div className="grid grid-cols-2 gap-4 bg-muted/10 p-4 rounded-md">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="auto-email" 
                            checked={checkoutOptions.email}
                            onCheckedChange={(checked) => setCheckoutOptions({...checkoutOptions, email: !!checked})}
                          />
                          <Label htmlFor="auto-email" className="flex items-center gap-2 cursor-pointer">
                            <Mail className="h-4 w-4 text-muted-foreground" /> Auto-Email Invoice
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="auto-whatsapp" 
                            checked={checkoutOptions.whatsapp}
                            onCheckedChange={(checked) => setCheckoutOptions({...checkoutOptions, whatsapp: !!checked})}
                          />
                          <Label htmlFor="auto-whatsapp" className="flex items-center gap-2 cursor-pointer">
                            <MessageCircle className="h-4 w-4 text-muted-foreground" /> Auto-WhatsApp
                          </Label>
                        </div>
                     </div>

                     <div className="flex gap-2 justify-center pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Printer className="mr-2 h-4 w-4" /> Print
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Download className="mr-2 h-4 w-4" /> Download PDF
                        </Button>
                     </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsCheckoutDialogOpen(false)}>Close</Button>
              {checkoutBooking && checkoutBooking.status !== "Checked Out" && (
                <Button onClick={handleCheckout} className="bg-green-600 hover:bg-green-700" disabled={updateBookingMutation.isPending}>
                  {updateBookingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay & Checkout
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}