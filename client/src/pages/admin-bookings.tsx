import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
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
  MessageCircle,
  Undo2,
  RotateCcw,
  BadgeDollarSign,
  FileCheck,
  Clock,
  ShieldAlert,
  Tags
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useHotelSettings } from "@/hooks/use-hotel-settings";
import { Switch } from "@/components/ui/switch";
import { differenceInYears, parseISO } from "date-fns";

export default function AdminBookings({ role = "owner" }: { role?: "owner" | "manager" | "receptionist" }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { checkInTimeFormatted, checkOutTimeFormatted, ageRuleAdult, ageRuleChild, ageRuleInfant } = useHotelSettings();
  const [isSyncing, setIsSyncing] = useState(false);

  const [isReversalDialogOpen, setIsReversalDialogOpen] = useState(false);
  const [reversalPassword, setReversalPassword] = useState("");
  const [reversalError, setReversalError] = useState("");
  const [reversalVerifying, setReversalVerifying] = useState(false);
  const [pendingReversal, setPendingReversal] = useState<{ booking: any; type: "payment" | "checkout" | "revert_booked" } | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  
  const { data: bookingsData = [], isLoading: bookingsLoading } = useQuery<any[]>({ queryKey: ['/api/bookings'] });
  const { data: roomsData = [] } = useQuery<any[]>({ queryKey: ['/api/rooms'] });
  const { data: roomTypesData = [] } = useQuery<any[]>({ queryKey: ['/api/room-types'] });
  const { data: menuItemsData = [] } = useQuery<any[]>({ queryKey: ['/api/menu-items'] });
  const { data: facilitiesData = [] } = useQuery<any[]>({ queryKey: ['/api/facilities'] });
  const { data: settingsData = {} } = useQuery<Record<string, string>>({ queryKey: ['/api/settings'] });
  const { data: allChargesData = [] } = useQuery<any[]>({ queryKey: ['/api/booking-charges'] });

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

  const currency = (settingsData as Record<string, string>)?.currency || "USD";
  const taxes: any[] = (() => { try { return JSON.parse(getSetting('taxes', '[]')); } catch { return []; } })();
  const parsedInvoiceSettings = (() => { try { return JSON.parse(getSetting('invoiceSettings', '{}')); } catch { return {}; } })();
  const invoiceSettings = {
    taxableItems: {
      room: parsedInvoiceSettings?.taxableItems?.room ?? true,
      food: parsedInvoiceSettings?.taxableItems?.food ?? true,
      facility: parsedInvoiceSettings?.taxableItems?.facility ?? true,
      other: parsedInvoiceSettings?.taxableItems?.other ?? false
    },
    autoSend: {
      email: parsedInvoiceSettings?.autoSend?.email ?? true,
      whatsapp: parsedInvoiceSettings?.autoSend?.whatsapp ?? false
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

  const bookings = bookingsData.map((b: any) => {
    const bookingCharges = allChargesData
      .filter((c: any) => c.bookingId === b.bookingId)
      .map((c: any) => ({
        ...c,
        item: c.description,
        type: c.category,
        amount: parseFloat(c.amount) || 0,
        quantity: 1
      }));
    return {
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
      charges: bookingCharges,
      source: "Direct",
      bookedDate: b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : "",
      paymentStatus: b.status === "checked_out" ? "Paid" : "Pending",
      accompanyingGuests: [],
      checkedInAt: b.checkedInAt,
      checkedOutAt: b.checkedOutAt,
      status: b.status === "confirmed" ? "Confirmed" : b.status === "checked_in" ? "Checked In" : b.status === "checked_out" ? "Checked Out" : b.status === "cancelled" ? "Cancelled" : b.status
    };
  });

  const filteredBookings = bookings
    .filter((b: any) => {
      if (statusFilter !== "all") {
        if (statusFilter === "confirmed" && b.status !== "Confirmed") return false;
        if (statusFilter === "active" && b.status !== "Checked In") return false;
        if (statusFilter === "checkout" && b.status !== "Checked Out") return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          (b.guest || "").toLowerCase().includes(q) ||
          (b.bookingId || "").toLowerCase().includes(q) ||
          (b.room || "").toLowerCase().includes(q) ||
          (b.type || "").toLowerCase().includes(q) ||
          (b.email || "").toLowerCase().includes(q) ||
          (b.phone || "").toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a: any, b: any) => {
      if (sortBy === "guest") return (a.guest || "").localeCompare(b.guest || "");
      if (sortBy === "checkin") return new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime();
      if (sortBy === "checkout") return new Date(a.checkOut).getTime() - new Date(b.checkOut).getTime();
      if (sortBy === "status") return (a.status || "").localeCompare(b.status || "");
      if (sortBy === "room") return (a.room || "").localeCompare(b.room || "", undefined, { numeric: true });
      return (b.id || 0) - (a.id || 0);
    });

  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/bookings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms/calendar-status'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/rooms/calendar-status'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/rooms/calendar-status'] });
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

  const deleteChargeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/booking-charges/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/booking-charges'] });
      toast({ title: "Charge Removed", description: "The charge has been removed from this booking." });
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

  const [showDiscountPanel, setShowDiscountPanel] = useState(false);
  const [discountMode, setDiscountMode] = useState<"coupon" | "manual">("manual");
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [manualDiscountPercent, setManualDiscountPercent] = useState(0);
  const [appliedDiscount, setAppliedDiscount] = useState<{ type: "coupon" | "manual"; label: string; mode: "percentage" | "fixed"; value: number; amount: number } | null>(null);

  const coupons: any[] = (() => { try { return JSON.parse(getSetting('coupons', '[]')); } catch { return []; } })();
  const discountLimitManager = parseInt(getSetting('discountLimitManager', '15'));
  const discountLimitReceptionist = parseInt(getSetting('discountLimitReceptionist', '5'));
  const getMaxDiscountPercent = () => {
    if (role === "owner") return 100;
    if (role === "manager") return discountLimitManager;
    return discountLimitReceptionist;
  };

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<any>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);

  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardErrors, setWizardErrors] = useState<Record<string, string>>({});
  const [overrideCapacity, setOverrideCapacity] = useState(false);
  const [newReservation, setNewReservation] = useState<any>({
    checkIn: "",
    checkOut: "",
    adults: 1,
    children: 0,
    childrenAges: [] as number[],
    roomsCount: 1,
    withPets: false,
    selectedRooms: [] as number[],
    guestName: "",
    phoneCountry: "+91",
    phone: "",
    email: "",
    notes: "",
    advanceAmount: 0,
    accompanyingGuests: [],
    selectedPaidFacilityIds: [] as number[]
  });

  const countryCodes = [
    { code: "+91", label: "IN +91" },
    { code: "+1", label: "US +1" },
    { code: "+44", label: "UK +44" },
    { code: "+971", label: "AE +971" },
    { code: "+61", label: "AU +61" },
    { code: "+65", label: "SG +65" },
    { code: "+81", label: "JP +81" },
    { code: "+86", label: "CN +86" },
    { code: "+33", label: "FR +33" },
    { code: "+49", label: "DE +49" },
    { code: "+39", label: "IT +39" },
    { code: "+34", label: "ES +34" },
    { code: "+7", label: "RU +7" },
    { code: "+55", label: "BR +55" },
    { code: "+27", label: "ZA +27" },
    { code: "+82", label: "KR +82" },
    { code: "+66", label: "TH +66" },
    { code: "+60", label: "MY +60" },
    { code: "+62", label: "ID +62" },
    { code: "+63", label: "PH +63" },
  ];

  const { data: availabilityData } = useQuery<any[]>({
    queryKey: ['/api/rooms/availability', newReservation.checkIn, newReservation.checkOut],
    queryFn: async () => {
      const res = await fetch(`/api/rooms/availability?checkIn=${newReservation.checkIn}&checkOut=${newReservation.checkOut}`);
      return res.json();
    },
    enabled: wizardStep === 2 && !!newReservation.checkIn && !!newReservation.checkOut
  });

  const wizardNights = (() => {
    if (!newReservation.checkIn || !newReservation.checkOut) return 0;
    const d1 = new Date(newReservation.checkIn);
    const d2 = new Date(newReservation.checkOut);
    return Math.max(0, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)));
  })();

  const resetWizard = () => {
    setWizardStep(1);
    setWizardErrors({});
    setNewReservation({
      checkIn: "", checkOut: "", adults: 1, children: 0, childrenAges: [],
      roomsCount: 1, withPets: false, selectedRooms: [], guestName: "",
      phoneCountry: "+91", phone: "", email: "", notes: "", advanceAmount: 0,
      accompanyingGuests: [], selectedPaidFacilityIds: []
    });
  };

  const calendarParamsHandled = useRef(false);

  useEffect(() => {
    if (calendarParamsHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const checkIn = params.get("checkIn");
    const checkOut = params.get("checkOut");
    const roomTypeId = params.get("roomTypeId");

    if (checkIn && checkOut && roomTypeId) {
      calendarParamsHandled.current = true;

      setNewReservation((prev: any) => ({
        ...prev,
        checkIn,
        checkOut,
      }));
      setWizardStep(2);
      setIsNewReservationOpen(true);

      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleReservationDialogClose = (open: boolean) => {
    setIsNewReservationOpen(open);
    if (!open) {
      resetWizard();
    }
  };

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

  const hotelName = getSetting("hotelName", "YellowBerry Hotel");
  const hotelAddress = getSetting("hotelAddress", "");
  const hotelPhone = getSetting("hotelPhone", "");
  const hotelEmail = getSetting("hotelEmail", "");
  const hotelGst = getSetting("hotelGst", "");

  const generateInvoiceHTML = (booking: any, discount?: { type: "coupon" | "manual"; label: string; mode: "percentage" | "fixed"; value: number; amount: number } | null) => {
    const totals = calculateTotals(booking, discount);
    const invoiceNo = (booking.bookingId || "").replace("BK", "INV");
    const nights = booking.nights || Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 3600 * 24));
    const checkedInStr = booking.checkedInAt ? new Date(booking.checkedInAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";
    const checkedOutStr = booking.checkedOutAt ? new Date(booking.checkedOutAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";
    const invoiceDate = booking.checkedOutAt ? new Date(booking.checkedOutAt).toLocaleDateString(undefined, { dateStyle: "long" }) : new Date().toLocaleDateString(undefined, { dateStyle: "long" });

    const chargeRows = [
      { desc: `Room Charges — ${booking.type} (${nights} Night${nights !== 1 ? "s" : ""})`, amount: booking.amount },
      ...booking.charges.map((c: any) => ({ desc: `${c.type}: ${c.item}`, amount: c.amount }))
    ];
    const subtotal = chargeRows.reduce((s: number, r: any) => s + r.amount, 0);

    const taxRows = totals.taxBreakdown.filter((t: any) => t.taxable);
    const totalTax = totals.tax;
    const discountAmount = totals.discountAmount;

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice ${invoiceNo}</title>
<style>
  @page { size: A4; margin: 15mm 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 13px; line-height: 1.5; }
  .invoice { max-width: 800px; margin: 0 auto; padding: 30px 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a5632; padding-bottom: 20px; margin-bottom: 24px; }
  .hotel-info h1 { font-size: 24px; color: #1a5632; margin-bottom: 2px; }
  .hotel-info p { font-size: 11px; color: #666; }
  .invoice-title { text-align: right; }
  .invoice-title h2 { font-size: 28px; font-weight: 700; color: #1a5632; letter-spacing: 2px; text-transform: uppercase; }
  .invoice-title p { font-size: 12px; color: #555; margin-top: 2px; }
  .meta-section { display: flex; justify-content: space-between; margin-bottom: 24px; }
  .meta-box { background: #f8faf9; border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px 18px; width: 48%; }
  .meta-box h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 6px; }
  .meta-box p { font-size: 12px; margin-bottom: 1px; }
  .meta-box .val { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead th { background: #1a5632; color: #fff; padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; text-align: left; }
  thead th:last-child { text-align: right; }
  tbody td { padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 12px; }
  tbody td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
  tbody tr:nth-child(even) { background: #fafafa; }
  .totals { width: 320px; margin-left: auto; margin-bottom: 24px; }
  .totals .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; }
  .totals .row.sub { border-top: 1px solid #ddd; padding-top: 8px; margin-top: 4px; }
  .totals .row.grand { border-top: 2px solid #1a5632; padding-top: 10px; margin-top: 8px; font-size: 16px; font-weight: 700; color: #1a5632; }
  .totals .row .label { color: #555; }
  .totals .row.tax { font-size: 11px; color: #777; padding-left: 10px; }
  .totals .row.discount { color: #7c3aed; font-style: italic; }
  .footer { border-top: 1px solid #ddd; padding-top: 16px; margin-top: 30px; display: flex; justify-content: space-between; }
  .footer-left { font-size: 11px; color: #888; max-width: 55%; }
  .footer-right { text-align: right; font-size: 11px; color: #888; }
  .stamp { margin-top: 40px; text-align: right; }
  .stamp p { font-size: 11px; color: #999; border-top: 1px solid #ccc; display: inline-block; padding-top: 4px; min-width: 180px; }
  .stay-info { display: flex; gap: 30px; margin-bottom: 10px; font-size: 12px; color: #555; }
  .stay-info span { display: flex; align-items: center; gap: 4px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
<div class="invoice">
  <div class="header">
    <div class="hotel-info">
      <h1>${hotelName}</h1>
      ${hotelAddress ? `<p>${hotelAddress}</p>` : ""}
      ${hotelPhone ? `<p>Tel: ${hotelPhone}</p>` : ""}
      ${hotelEmail ? `<p>${hotelEmail}</p>` : ""}
      ${hotelGst ? `<p>GSTIN: ${hotelGst}</p>` : ""}
    </div>
    <div class="invoice-title">
      <h2>Invoice</h2>
      <p><strong>${invoiceNo}</strong></p>
      <p>Date: ${invoiceDate}</p>
    </div>
  </div>

  <div class="meta-section">
    <div class="meta-box">
      <h4>Bill To</h4>
      <p class="val">${booking.guest}</p>
      ${booking.email ? `<p>${booking.email}</p>` : ""}
      ${booking.phone ? `<p>${booking.phone}</p>` : ""}
    </div>
    <div class="meta-box">
      <h4>Stay Details</h4>
      <p>Room: <span class="val">${booking.room}</span> — ${booking.type}</p>
      <p>Check-in: <span class="val">${booking.checkIn}</span>${checkedInStr ? ` at ${checkedInStr.split(", ").pop()}` : ""}</p>
      <p>Check-out: <span class="val">${booking.checkOut}</span>${checkedOutStr ? ` at ${checkedOutStr.split(", ").pop()}` : ""}</p>
      <p>Duration: <span class="val">${nights} Night${nights !== 1 ? "s" : ""}</span> · ${booking.adults || 1} Adult${(booking.adults || 1) > 1 ? "s" : ""}${booking.children ? ` · ${booking.children} Child${booking.children > 1 ? "ren" : ""}` : ""}</p>
      <p>Booking ID: <span class="val">${booking.bookingId}</span></p>
    </div>
  </div>

  <table>
    <thead><tr><th>#</th><th>Description</th><th>Amount (${currency})</th></tr></thead>
    <tbody>
      ${chargeRows.map((r: any, i: number) => `<tr><td>${i + 1}</td><td>${r.desc}</td><td>${r.amount.toFixed(2)}</td></tr>`).join("")}
    </tbody>
  </table>

  <div class="totals">
    <div class="row sub"><span class="label">Subtotal</span><span>${currency} ${subtotal.toFixed(2)}</span></div>
    ${discountAmount > 0 ? `<div class="row discount"><span class="label">${discount?.label || "Discount"}</span><span>- ${currency} ${discountAmount.toFixed(2)}</span></div>` : ""}
    ${taxRows.map((t: any) => `<div class="row tax"><span class="label">${t.label} @ ${t.rate}%</span><span>${currency} ${t.amount.toFixed(2)}</span></div>`).join("")}
    <div class="row"><span class="label">Total Tax</span><span>${currency} ${totalTax.toFixed(2)}</span></div>
    ${booking.advance > 0 ? `<div class="row"><span class="label">Advance Paid</span><span>- ${currency} ${booking.advance.toFixed(2)}</span></div>` : ""}
    <div class="row grand"><span>Total Due</span><span>${currency} ${totals.due.toFixed(2)}</span></div>
    ${booking.paymentMethod ? `<div class="row" style="font-size:11px;color:#888;"><span class="label">Payment Method</span><span>${booking.paymentMethod}</span></div>` : ""}
  </div>

  <div class="stamp">
    <p>Authorized Signature</p>
  </div>

  <div class="footer">
    <div class="footer-left">
      <p>Thank you for staying with us. We look forward to welcoming you again.</p>
      <p style="margin-top:4px;">This is a computer-generated invoice. No signature is required.</p>
    </div>
    <div class="footer-right">
      <p>${hotelName}</p>
      ${hotelPhone ? `<p>${hotelPhone}</p>` : ""}
    </div>
  </div>
</div>
</body></html>`;
  };

  const handlePrintInvoice = (booking: any) => {
    const html = generateInvoiceHTML(booking, appliedDiscount);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 300);
    }
  };

  const handleDownloadInvoice = async (booking: any) => {
    setIsDownloadingPdf(true);
    const invoiceNo = (booking.bookingId || "").replace("BK", "INV");
    const html = generateInvoiceHTML(booking, appliedDiscount);

    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "800px";
    iframe.style.height = "1200px";
    iframe.style.left = "-10000px";
    iframe.style.top = "-10000px";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.style.overflow = "hidden";
    document.body.appendChild(iframe);

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error("Cannot access iframe");
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      await new Promise(r => setTimeout(r, 200));

      const { default: html2canvas } = await import("html2canvas");
      const { default: jsPDF } = await import("jspdf");

      const target = iframeDoc.querySelector(".invoice") as HTMLElement || iframeDoc.body;
      const canvas = await html2canvas(target, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoiceNo}.pdf`);
    } catch {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 300);
      }
    } finally {
      document.body.removeChild(iframe);
      setIsDownloadingPdf(false);
    }
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

  const openReversalDialog = (booking: any, type: "payment" | "checkout" | "revert_booked") => {
    setPendingReversal({ booking, type });
    setReversalPassword("");
    setReversalError("");
    setIsReversalDialogOpen(true);
  };

  const getReversalWarning = () => {
    if (!pendingReversal) return { title: "", description: "" };
    const { type, booking } = pendingReversal;
    if (type === "payment") return {
      title: "Reverse Payment",
      description: `This will reverse the payment for booking ${booking.bookingId} and set the status back to "Checked In". The guest's payment record will be undone. This action should only be performed if the payment was made in error or needs correction.`
    };
    if (type === "checkout") return {
      title: "Undo Checkout",
      description: `This will reverse the checkout for booking ${booking.bookingId} and set the status back to "Checked In". The checkout timestamp will be cleared and the room will be marked as occupied again.`
    };
    return {
      title: "Revert to Booked",
      description: `This will revert booking ${booking.bookingId} back to "Booked" status. The check-in timestamp will be cleared and the room will be released. Use this only if the guest has not actually arrived.`
    };
  };

  const executeReversal = async () => {
    if (!pendingReversal) return;
    setReversalVerifying(true);
    setReversalError("");
    try {
      const res = await apiRequest("POST", "/api/auth/verify-password", { password: reversalPassword });
      if (!res.ok) {
        const err = await res.json();
        setReversalError(err.message || "Incorrect password");
        setReversalVerifying(false);
        return;
      }
    } catch {
      setReversalError("Verification failed. Please try again.");
      setReversalVerifying(false);
      return;
    }

    const { booking, type } = pendingReversal;

    if (type === "payment") {
      updateBookingMutation.mutate(
        { id: booking.id, data: { status: "checked_in", checkedOutAt: null } },
        {
          onSuccess: () => {
            toast({ title: "Payment Reversed", description: `Payment for booking ${booking.bookingId} has been reversed. Status set back to Checked In.` });
            if (checkoutBooking?.id === booking.id) {
              setCheckoutBooking({ ...checkoutBooking, status: "Checked In" });
            }
            setIsCheckoutDialogOpen(false);
            setIsReversalDialogOpen(false);
            setPendingReversal(null);
            setReversalVerifying(false);
          },
          onError: () => { setReversalVerifying(false); }
        }
      );
    } else if (type === "checkout") {
      updateBookingMutation.mutate(
        { id: booking.id, data: { status: "checked_in", checkedOutAt: null } },
        {
          onSuccess: () => {
            toast({ title: "Checkout Reversed", description: `Booking ${booking.bookingId} has been reverted to Checked In.` });
            if (checkoutBooking?.id === booking.id) {
              setCheckoutBooking({ ...checkoutBooking, status: "Checked In" });
            }
            setIsReversalDialogOpen(false);
            setPendingReversal(null);
            setReversalVerifying(false);
          },
          onError: () => { setReversalVerifying(false); }
        }
      );
    } else {
      updateBookingMutation.mutate(
        { id: booking.id, data: { status: "confirmed" } },
        {
          onSuccess: () => {
            toast({ title: "Status Reverted", description: `Booking ${booking.bookingId} has been reverted to Booked status.` });
            setIsReversalDialogOpen(false);
            setPendingReversal(null);
            setReversalVerifying(false);
          },
          onError: () => { setReversalVerifying(false); }
        }
      );
    }
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

  const getTaxRateForCategory = (category: string): number => {
    const matchedTax = taxes.find((t: any) => t.appliedTo === category);
    if (matchedTax) return matchedTax.rate || 0;
    const allTax = taxes.find((t: any) => t.appliedTo === "All");
    if (allTax) return allTax.rate || 0;
    if (category === "Room") return 12;
    if (category === "Food") return 5;
    if (category === "Facility") return 18;
    return 0;
  };

  const calculateTotals = (booking: any, discount?: { mode: "percentage" | "fixed"; value: number; amount: number } | null) => {
    if (!booking) return { roomTotal: 0, chargesTotal: 0, subtotal: 0, taxBreakdown: [], tax: 0, discountAmount: 0, total: 0, due: 0 };
    
    const roomTotal = booking.amount;
    const chargesTotal = (booking.charges || []).reduce((acc: number, curr: any) => acc + curr.amount, 0);
    const subtotal = roomTotal + chargesTotal;
    
    const discountAmount = discount
      ? (discount.mode === "percentage"
        ? subtotal * (discount.value / 100)
        : Math.min(discount.value, subtotal))
      : 0;
    const afterDiscount = subtotal - discountAmount;
    
    const taxBreakdown: Array<{ label: string; amount: number; rate: number; baseAmount: number; taxable: boolean }> = [];
    
    const discountRatio = subtotal > 0 ? afterDiscount / subtotal : 1;
    
    const roomTaxRate = getTaxRateForCategory("Room");
    const isRoomTaxable = invoiceSettings.taxableItems.room && roomTaxRate > 0;
    const adjustedRoomTotal = roomTotal * discountRatio;
    const roomTaxAmount = isRoomTaxable ? adjustedRoomTotal * (roomTaxRate / 100) : 0;
    taxBreakdown.push({
      label: "Room Charges",
      amount: roomTaxAmount,
      rate: roomTaxRate,
      baseAmount: roomTotal,
      taxable: isRoomTaxable
    });

    if (booking.charges) {
      booking.charges.forEach((charge: any) => {
        let isTaxable = false;
        let category = charge.type || "Other";
        
        if (category === 'Food' && invoiceSettings.taxableItems.food) {
          isTaxable = true;
        } else if (category === 'Facility') {
          const matchedFacility = facilitiesData.find((f: any) => charge.item && charge.item.includes(f.name));
          if (matchedFacility && matchedFacility.taxable) {
            isTaxable = true;
          } else if (!matchedFacility && invoiceSettings.taxableItems.facility) {
            isTaxable = true;
          }
        } else if (category === 'Other' && invoiceSettings.taxableItems.other) {
          isTaxable = true;
        }
        
        const rate = getTaxRateForCategory(category);
        const adjustedChargeAmount = charge.amount * discountRatio;
        const taxAmount = isTaxable && rate > 0 ? adjustedChargeAmount * (rate / 100) : 0;
        
        taxBreakdown.push({
          label: charge.item || category,
          amount: taxAmount,
          rate: rate,
          baseAmount: charge.amount,
          taxable: isTaxable && rate > 0
        });
      });
    }

    const tax = taxBreakdown.reduce((acc, item) => acc + item.amount, 0);
    const total = afterDiscount + tax;
    const due = total - booking.advance;

    return { roomTotal, chargesTotal, subtotal, taxBreakdown, tax, discountAmount, total, due };
  };

  const openCheckoutDialog = (booking: any) => {
    setCheckoutBooking(booking);
    setCheckoutOptions(invoiceSettings.autoSend);
    setShowDiscountPanel(false);
    setDiscountMode("manual");
    setCouponCode("");
    setCouponError("");
    setManualDiscountPercent(0);

    const rawBooking = bookingsData.find((b: any) => b.id === booking.id);
    if (rawBooking?.discountInfo) {
      try {
        setAppliedDiscount(JSON.parse(rawBooking.discountInfo));
      } catch {
        setAppliedDiscount(null);
      }
    } else {
      setAppliedDiscount(null);
    }

    setIsCheckoutDialogOpen(true);
  };

  const handleCheckout = () => {
    if (!checkoutBooking) return;

    const updateData: any = { status: "checked_out" };
    if (appliedDiscount) {
      updateData.discountInfo = JSON.stringify(appliedDiscount);
    }

    updateBookingMutation.mutate(
      { id: checkoutBooking.id, data: updateData },
      {
        onSuccess: () => {
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

  const getFacilitiesForRoomType = (roomTypeId: number) => {
    const rt = roomTypesData.find((r: any) => r.id === roomTypeId);
    if (!rt) return { included: [], paidOptional: [] };
    const rtFacilityIds: number[] = (() => { try { return JSON.parse(rt.facilityIds || "[]"); } catch { return []; } })();
    const defaultFacilities = facilitiesData.filter((f: any) => f.isDefault && f.active);
    const allFacilityIds = [...new Set([...rtFacilityIds, ...defaultFacilities.map((f: any) => f.id)])];
    const allFacilities = allFacilityIds.map((id: number) => facilitiesData.find((f: any) => f.id === id && f.active)).filter(Boolean);
    return { included: allFacilities.filter((f: any) => f.isFree), paidOptional: allFacilities.filter((f: any) => !f.isFree) };
  };

  const getWizardRoomsByType = () => {
    if (!availabilityData) return [];
    const grouped: Record<number, { roomType: any; rooms: any[] }> = {};
    for (const room of availabilityData) {
      const rt = roomTypesData.find((r: any) => r.id === room.roomTypeId);
      if (!rt) continue;
      if (!grouped[room.roomTypeId]) grouped[room.roomTypeId] = { roomType: rt, rooms: [] };
      grouped[room.roomTypeId].rooms.push(room);
    }
    return Object.values(grouped);
  };

  const getWizardSelectedTotal = () => {
    let total = 0;
    for (const roomId of newReservation.selectedRooms) {
      const room = (availabilityData || []).find((r: any) => r.id === roomId);
      if (!room) continue;
      const rt = roomTypesData.find((r: any) => r.id === room.roomTypeId);
      if (rt) total += (parseFloat(rt.basePrice) || 0) * wizardNights;
    }
    return total;
  };

  const validateStep3 = () => {
    const errors: Record<string, string> = {};
    if (!newReservation.guestName.trim()) errors.guestName = "Guest name is required";
    if (!newReservation.phone.trim()) errors.phone = "Phone number is required";
    else if (!/^\d{9,16}$/.test(newReservation.phone)) errors.phone = "Phone must be 9-16 digits";
    if (!newReservation.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newReservation.email)) errors.email = "Invalid email format";
    setWizardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateReservation = async () => {
    if (!validateStep3()) return;

    let successCount = 0;
    const totalRooms = newReservation.selectedRooms.length;

    for (const roomId of newReservation.selectedRooms) {
      const room = (availabilityData || []).find((r: any) => r.id === roomId);
      if (!room) continue;
      const rt = roomTypesData.find((r: any) => r.id === room.roomTypeId);
      if (!rt) continue;
      const roomAmount = (parseFloat(rt.basePrice) || 0) * wizardNights;
      const { paidOptional } = getFacilitiesForRoomType(room.roomTypeId);
      const selectedPaidFacilities = paidOptional.filter((f: any) => newReservation.selectedPaidFacilityIds.includes(f.id));
      const facilityTotal = selectedPaidFacilities.reduce((sum: number, f: any) => {
        const price = parseFloat(f.price) || 0;
        if (f.unit === "night") return sum + price * wizardNights;
        if (f.unit === "person") return sum + price * (newReservation.adults || 1);
        return sum + price;
      }, 0);
      const bookingId = `BK-${Date.now().toString().slice(-6)}-${roomId}`;
      try {
        await createBookingMutation.mutateAsync({
          bookingId,
          guestName: newReservation.guestName.split(' ')[0] || newReservation.guestName,
          guestLastName: newReservation.guestName.split(' ').slice(1).join(' ') || "",
          guestEmail: newReservation.email,
          guestPhone: `${newReservation.phoneCountry}${newReservation.phone}`,
          roomId,
          roomTypeId: room.roomTypeId,
          checkIn: newReservation.checkIn,
          checkOut: newReservation.checkOut,
          nights: wizardNights,
          adults: newReservation.adults,
          children: newReservation.children,
          status: "confirmed",
          totalAmount: (roomAmount + facilityTotal).toFixed(2),
          advanceAmount: (newReservation.advanceAmount || 0).toFixed(2),
          paymentMethod: "Cash",
          notes: newReservation.notes || "",
          overrideCapacity,
          facilityCharges: selectedPaidFacilities.map((f: any) => ({
            description: f.name, category: "Facility",
            amount: f.unit === "night" ? (parseFloat(f.price) * wizardNights).toFixed(2) : f.unit === "person" ? (parseFloat(f.price) * newReservation.adults).toFixed(2) : parseFloat(f.price).toFixed(2),
          })),
        });
        successCount++;
      } catch (e) {}
    }

    if (successCount > 0) {
      setIsNewReservationOpen(false);
      resetWizard();
      toast({ title: "Booking Created", description: `${successCount} room(s) booked successfully.` });
    }
  };

  return (
    <AdminLayout role={role}>
      <div className="space-y-6 overflow-x-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-serif text-primary">Bookings & Reservations</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Manage guest reservations, charges, and checkouts.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {isSyncing ? "Syncing..." : "Sync Platforms"}
            </Button>
            
            <Dialog open={isNewReservationOpen} onOpenChange={handleReservationDialogClose}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-new-reservation">
                  <Calendar className="mr-2 h-4 w-4" />
                  New Reservation
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>New Reservation</DialogTitle>
                  <DialogDescription>
                    {wizardStep === 1 && "Select your dates and number of guests."}
                    {wizardStep === 2 && "Choose available rooms for your stay."}
                    {wizardStep === 3 && "Enter guest details and preferences."}
                    {wizardStep === 4 && "Review and confirm your booking."}
                  </DialogDescription>
                  <div className="flex items-center gap-2 pt-2">
                    {[1,2,3,4].map(s => (
                      <div key={s} className={`flex items-center gap-1.5 ${s <= wizardStep ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${s < wizardStep ? 'bg-primary text-white border-primary' : s === wizardStep ? 'border-primary text-primary' : 'border-muted-foreground/30'}`}>{s}</div>
                        <span className="text-xs hidden sm:inline">{s === 1 ? 'Dates' : s === 2 ? 'Rooms' : s === 3 ? 'Guest' : 'Confirm'}</span>
                        {s < 4 && <div className={`w-6 h-0.5 ${s < wizardStep ? 'bg-primary' : 'bg-muted-foreground/20'}`} />}
                      </div>
                    ))}
                  </div>
                </DialogHeader>

                <div className="py-4">
                  {wizardStep === 1 && (
                    <div className="space-y-5" data-testid="wizard-step-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Check-in Date</Label>
                          <Input type="date" value={newReservation.checkIn} onChange={(e) => setNewReservation({...newReservation, checkIn: e.target.value})} data-testid="input-checkin" />
                          <p className="text-xs text-muted-foreground" data-testid="text-checkin-time">Check-in from {checkInTimeFormatted}</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Check-out Date</Label>
                          <Input type="date" value={newReservation.checkOut} min={newReservation.checkIn || undefined} onChange={(e) => setNewReservation({...newReservation, checkOut: e.target.value})} data-testid="input-checkout" />
                          <p className="text-xs text-muted-foreground" data-testid="text-checkout-time">Check-out by {checkOutTimeFormatted}</p>
                        </div>
                      </div>
                      {wizardNights > 0 && (
                        <div className="text-center py-1">
                          <Badge variant="secondary" className="text-sm px-3 py-1" data-testid="badge-nights">{wizardNights} Night{wizardNights !== 1 ? 's' : ''}</Badge>
                        </div>
                      )}

                      <div className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Adults</span>
                          <div className="flex items-center gap-0 border rounded-md" data-testid="counter-adults">
                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-primary text-lg" onClick={() => setNewReservation({...newReservation, adults: Math.max(1, newReservation.adults - 1)})} disabled={newReservation.adults <= 1}>-</Button>
                            <span className="w-10 text-center font-medium">{newReservation.adults}</span>
                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-primary text-lg" onClick={() => setNewReservation({...newReservation, adults: Math.min(10, newReservation.adults + 1)})}>+</Button>
                          </div>
                        </div>

                        <div className="border-t pt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Children</span>
                            <div className="flex items-center gap-0 border rounded-md" data-testid="counter-children">
                              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-primary text-lg" onClick={() => { const n = Math.max(0, newReservation.children - 1); setNewReservation({...newReservation, children: n, childrenAges: newReservation.childrenAges.slice(0, n)}); }} disabled={newReservation.children <= 0}>-</Button>
                              <span className="w-10 text-center font-medium">{newReservation.children}</span>
                              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-primary text-lg" onClick={() => { const n = Math.min(6, newReservation.children + 1); setNewReservation({...newReservation, children: n, childrenAges: [...newReservation.childrenAges, -1].slice(0, n)}); }}>+</Button>
                            </div>
                          </div>
                          {newReservation.children > 0 && (
                            <div className="space-y-2 pl-4">
                              {Array.from({ length: newReservation.children }).map((_, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground w-20">Child {i + 1}:</span>
                                  <Select value={newReservation.childrenAges[i] >= 0 ? newReservation.childrenAges[i].toString() : ""} onValueChange={(val) => { const ages = [...newReservation.childrenAges]; ages[i] = parseInt(val); setNewReservation({...newReservation, childrenAges: ages}); }}>
                                    <SelectTrigger className="w-36 h-8" data-testid={`select-child-age-${i}`}>
                                      <SelectValue placeholder="Age needed" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: 18 }, (_, age) => (
                                        <SelectItem key={age} value={age.toString()}>{age === 0 ? "Under 1" : `${age} year${age > 1 ? 's' : ''} old`}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ))}
                              <p className="text-xs text-muted-foreground">To find you a place to stay that fits your entire group along with correct prices, we need to know how old your children will be at check-out. (Infant: 0–{ageRuleInfant} yrs, Child: {ageRuleChild}–{ageRuleAdult - 1} yrs, Adult: {ageRuleAdult}+ yrs)</p>
                            </div>
                          )}
                        </div>

                        {(() => {
                          const exceedsAll = roomTypesData.length > 0 && roomTypesData.every((rt: any) => newReservation.adults > rt.maxAdults || newReservation.children > rt.maxChildren);
                          const exceedsSome = roomTypesData.some((rt: any) => newReservation.adults > rt.maxAdults || newReservation.children > rt.maxChildren);
                          if (exceedsAll && !overrideCapacity) {
                            return (
                              <div className="border border-red-200 bg-red-50 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2" data-testid="capacity-error-step1">
                                <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="font-medium">Capacity exceeded for all room types.</span>
                                  <span className="block text-xs mt-0.5">The number of guests exceeds the maximum capacity of every available room type. Please reduce guest count{(role === "owner" || role === "manager") ? " or enable capacity override below" : ""}.</span>
                                </div>
                              </div>
                            );
                          }
                          if (exceedsSome && !overrideCapacity) {
                            return (
                              <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 text-sm text-amber-700 flex items-start gap-2" data-testid="capacity-warning-step1">
                                <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>Some room types cannot accommodate {newReservation.adults} adults and {newReservation.children} children. Only matching room types will be available.</span>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Rooms</span>
                            <div className="flex items-center gap-0 border rounded-md" data-testid="counter-rooms">
                              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-primary text-lg" onClick={() => setNewReservation({...newReservation, roomsCount: Math.max(1, newReservation.roomsCount - 1)})} disabled={newReservation.roomsCount <= 1}>-</Button>
                              <span className="w-10 text-center font-medium">{newReservation.roomsCount}</span>
                              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-primary text-lg" onClick={() => setNewReservation({...newReservation, roomsCount: Math.min(10, newReservation.roomsCount + 1)})}>+</Button>
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Travelling with pets?</span>
                            <Switch checked={newReservation.withPets} onCheckedChange={(checked) => setNewReservation({...newReservation, withPets: checked})} data-testid="switch-pets" />
                          </div>
                        </div>

                        {(role === "owner" || role === "manager") && (
                          <div className="border-t pt-4">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="override-capacity"
                                checked={overrideCapacity}
                                onCheckedChange={(checked) => setOverrideCapacity(!!checked)}
                                data-testid="checkbox-override-capacity"
                              />
                              <label htmlFor="override-capacity" className="text-sm font-medium cursor-pointer">
                                Override capacity limit
                              </label>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 ml-6">
                              Allow booking even if guests exceed the room type's maximum capacity.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {wizardStep === 2 && (
                    <div className="space-y-4" data-testid="wizard-step-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{newReservation.checkIn} to {newReservation.checkOut} ({wizardNights} night{wizardNights !== 1 ? 's' : ''})</span>
                        <span className="text-muted-foreground">{newReservation.adults} Adult{newReservation.adults > 1 ? 's' : ''}{newReservation.children > 0 ? `, ${newReservation.children} Child${newReservation.children > 1 ? 'ren' : ''}` : ''} | {newReservation.roomsCount} Room{newReservation.roomsCount > 1 ? 's' : ''}</span>
                      </div>
                      {newReservation.selectedRooms.length > 0 && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
                          <span className="text-sm font-medium">{newReservation.selectedRooms.length} of {newReservation.roomsCount} room{newReservation.roomsCount > 1 ? 's' : ''} selected</span>
                          <span className="font-semibold text-primary">₹{getWizardSelectedTotal().toFixed(2)}</span>
                        </div>
                      )}
                      {getWizardRoomsByType().length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {getWizardRoomsByType().map(({ roomType, rooms: typeRooms }) => {
                            const { included, paidOptional } = getFacilitiesForRoomType(roomType.id);
                            const capacityExceeded = newReservation.adults > roomType.maxAdults || newReservation.children > roomType.maxChildren;
                            const isBlocked = capacityExceeded && !overrideCapacity;
                            return (
                              <Card key={roomType.id} className={`overflow-hidden ${isBlocked ? 'opacity-60' : ''}`}>
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <CardTitle className="text-base">{roomType.name}</CardTitle>
                                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                                        <span>{roomType.beds}</span>
                                        {roomType.size && <><span>·</span><span>{roomType.size}</span></>}
                                        <span>·</span><span>Max {roomType.maxAdults} adults, {roomType.maxChildren} children</span>
                                      </div>
                                      {capacityExceeded && (
                                        <div className="mt-2 flex items-center gap-1 text-xs text-red-600 font-medium" data-testid={`capacity-warning-${roomType.id}`}>
                                          <ShieldAlert className="h-3 w-3" />
                                          Capacity exceeded ({newReservation.adults > roomType.maxAdults ? `${newReservation.adults} adults > max ${roomType.maxAdults}` : ''}{newReservation.adults > roomType.maxAdults && newReservation.children > roomType.maxChildren ? ', ' : ''}{newReservation.children > roomType.maxChildren ? `${newReservation.children} children > max ${roomType.maxChildren}` : ''})
                                          {overrideCapacity && <span className="text-amber-600 ml-1">(Override active)</span>}
                                        </div>
                                      )}
                                      {included.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {included.map((f: any) => (
                                            <span key={f.id} className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">{f.name}</span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <div className="font-semibold text-lg">₹{parseFloat(roomType.basePrice).toFixed(0)}</div>
                                      <span className="text-xs text-muted-foreground">per night</span>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <Label className="text-xs text-muted-foreground mb-2 block">Select Room:</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {typeRooms.map((room: any) => {
                                      const isSelected = newReservation.selectedRooms.includes(room.id);
                                      const isDisabled = !room.available || isBlocked;
                                      const canSelect = !isSelected && newReservation.selectedRooms.length >= newReservation.roomsCount;
                                      return (
                                        <button
                                          key={room.id}
                                          disabled={isDisabled || canSelect}
                                          onClick={() => {
                                            const sel = isSelected
                                              ? newReservation.selectedRooms.filter((id: number) => id !== room.id)
                                              : [...newReservation.selectedRooms, room.id];
                                            setNewReservation({...newReservation, selectedRooms: sel});
                                          }}
                                          className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                                            isSelected ? 'bg-primary text-white border-primary' :
                                            isDisabled ? 'bg-muted text-muted-foreground/40 border-muted cursor-not-allowed line-through' :
                                            canSelect ? 'bg-muted/50 text-muted-foreground border-muted cursor-not-allowed' :
                                            'bg-white hover:bg-primary/5 hover:border-primary/50 cursor-pointer'
                                          }`}
                                          data-testid={`room-chip-${room.id}`}
                                        >
                                          {room.roomNumber}
                                          {room.roomName && <span className="text-xs ml-1 opacity-75">({room.roomName})</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {wizardStep === 3 && (
                    <div className="space-y-4" data-testid="wizard-step-3">
                      <div className="space-y-2">
                        <Label>Primary Guest Name <span className="text-red-500">*</span></Label>
                        <Input placeholder="Full Name" value={newReservation.guestName} onChange={(e) => { setNewReservation({...newReservation, guestName: e.target.value}); setWizardErrors({...wizardErrors, guestName: ""}); }} data-testid="input-guest-name" />
                        {wizardErrors.guestName && <p className="text-xs text-red-500">{wizardErrors.guestName}</p>}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Phone <span className="text-red-500">*</span></Label>
                          <div className="flex gap-2">
                            <Select value={newReservation.phoneCountry} onValueChange={(val) => setNewReservation({...newReservation, phoneCountry: val})}>
                              <SelectTrigger className="w-28" data-testid="select-country-code">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {countryCodes.map(cc => (
                                  <SelectItem key={cc.code} value={cc.code}>{cc.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="tel"
                              placeholder="9876543210"
                              value={newReservation.phone}
                              onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setNewReservation({...newReservation, phone: val}); setWizardErrors({...wizardErrors, phone: ""}); }}
                              maxLength={16}
                              data-testid="input-phone"
                            />
                          </div>
                          {wizardErrors.phone && <p className="text-xs text-red-500">{wizardErrors.phone}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label>Email <span className="text-red-500">*</span></Label>
                          <Input type="email" placeholder="guest@example.com" value={newReservation.email} onChange={(e) => { setNewReservation({...newReservation, email: e.target.value}); setWizardErrors({...wizardErrors, email: ""}); }} data-testid="input-email" />
                          {wizardErrors.email && <p className="text-xs text-red-500">{wizardErrors.email}</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Advance Payment</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input type="number" className="pl-9" placeholder="0.00" value={newReservation.advanceAmount} onChange={(e) => setNewReservation({...newReservation, advanceAmount: parseFloat(e.target.value) || 0})} data-testid="input-advance" />
                        </div>
                      </div>

                      {(() => {
                        const roomTypeIds = [...new Set(newReservation.selectedRooms.map((rid: number) => (availabilityData || []).find((r: any) => r.id === rid)?.roomTypeId).filter(Boolean))];
                        const allPaid: any[] = [];
                        roomTypeIds.forEach((rtId: number) => { const { paidOptional } = getFacilitiesForRoomType(rtId); paidOptional.forEach((f: any) => { if (!allPaid.find((p: any) => p.id === f.id)) allPaid.push(f); }); });
                        if (allPaid.length === 0) return null;
                        return (
                          <div className="border rounded-md p-4 bg-muted/20 space-y-2">
                            <Label className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Paid Add-ons</Label>
                            {allPaid.map((f: any) => (
                              <div key={f.id} className="flex items-center gap-2 px-3 py-2 border rounded-md bg-white">
                                <Checkbox checked={newReservation.selectedPaidFacilityIds.includes(f.id)} onCheckedChange={(checked) => { const ids = checked ? [...newReservation.selectedPaidFacilityIds, f.id] : newReservation.selectedPaidFacilityIds.filter((id: number) => id !== f.id); setNewReservation({...newReservation, selectedPaidFacilityIds: ids}); }} data-testid={`checkbox-facility-${f.id}`} />
                                <span className="text-sm flex-1">{f.name}</span>
                                <span className="text-xs text-amber-700 font-medium">₹{Number(f.price).toFixed(2)}/{f.unit || 'item'}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      <div className="border rounded-md p-4 bg-muted/20">
                        <div className="flex justify-between items-center mb-3">
                          <Label className="flex items-center gap-2"><Users className="h-4 w-4" /> Accompanying Guests (Optional)</Label>
                          <Button variant="ghost" size="sm" onClick={() => handleAddAccompanyingGuest(true)} className="h-8"><Plus className="h-3 w-3 mr-1" /> Add Guest</Button>
                        </div>
                        {newReservation.accompanyingGuests && newReservation.accompanyingGuests.length > 0 ? (
                          <div className="space-y-4">
                            {newReservation.accompanyingGuests.map((guest: any, idx: number) => (
                              <div key={idx} className="bg-card p-4 rounded border relative space-y-3">
                                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-red-500" onClick={() => removeAccompanyingGuest(idx, true)}><Trash2 className="h-3 w-3" /></Button>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Full Name</Label>
                                    <Input placeholder="Guest Name" className="h-8" value={guest.name} onChange={(e) => updateAccompanyingGuest(idx, 'name', e.target.value, true)} />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Date of Birth</Label>
                                    <div className="flex gap-2">
                                      <Input type="date" className="h-8 flex-1" value={guest.dob} onChange={(e) => updateAccompanyingGuest(idx, 'dob', e.target.value, true)} />
                                      <div className="h-8 w-16 bg-muted flex items-center justify-center text-sm rounded border">{guest.age || '-'} y/o</div>
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">ID Type</Label>
                                    <Select value={guest.idType} onValueChange={(val) => updateAccompanyingGuest(idx, 'idType', val, true)}>
                                      <SelectTrigger className="h-8"><SelectValue placeholder="Select ID" /></SelectTrigger>
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Phone (Optional)</Label>
                                    <div className="flex gap-2">
                                      <Select value={guest.phoneCountry || "+91"} onValueChange={(val) => updateAccompanyingGuest(idx, 'phoneCountry', val, true)}>
                                        <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                                        <SelectContent>{countryCodes.map(cc => (<SelectItem key={cc.code} value={cc.code}>{cc.label}</SelectItem>))}</SelectContent>
                                      </Select>
                                      <Input type="tel" className="h-8" placeholder="Phone" value={guest.phone} onChange={(e) => updateAccompanyingGuest(idx, 'phone', e.target.value.replace(/\D/g, ''), true)} />
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
                        <Textarea placeholder="Notes..." value={newReservation.notes} onChange={(e) => setNewReservation({...newReservation, notes: e.target.value})} data-testid="input-notes" />
                      </div>
                    </div>
                  )}

                  {wizardStep === 4 && (
                    <div className="space-y-4" data-testid="wizard-step-4">
                      <Card>
                        <CardContent className="pt-6 space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-muted-foreground">Check-in:</span> <span className="font-medium">{newReservation.checkIn}</span> <span className="text-xs text-muted-foreground">({checkInTimeFormatted})</span></div>
                            <div><span className="text-muted-foreground">Check-out:</span> <span className="font-medium">{newReservation.checkOut}</span> <span className="text-xs text-muted-foreground">({checkOutTimeFormatted})</span></div>
                            <div><span className="text-muted-foreground">Duration:</span> <span className="font-medium">{wizardNights} Night{wizardNights !== 1 ? 's' : ''}</span></div>
                            <div><span className="text-muted-foreground">Guests:</span> <span className="font-medium">{newReservation.adults} Adult{newReservation.adults > 1 ? 's' : ''}{newReservation.children > 0 ? `, ${newReservation.children} Child${newReservation.children > 1 ? 'ren' : ''}` : ''}</span></div>
                          </div>
                          <div className="border-t pt-3">
                            <Label className="text-xs text-muted-foreground">Rooms Selected</Label>
                            <div className="mt-1 space-y-1">
                              {newReservation.selectedRooms.map((rid: number) => {
                                const room = (availabilityData || []).find((r: any) => r.id === rid);
                                const rt = room ? roomTypesData.find((r: any) => r.id === room.roomTypeId) : null;
                                return (
                                  <div key={rid} className="flex justify-between text-sm">
                                    <span>Room {room?.roomNumber} ({rt?.name})</span>
                                    <span className="font-medium">₹{rt ? (parseFloat(rt.basePrice) * wizardNights).toFixed(2) : '0.00'}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="border-t pt-3 grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-muted-foreground">Guest:</span> <span className="font-medium">{newReservation.guestName}</span></div>
                            <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{newReservation.phoneCountry} {newReservation.phone}</span></div>
                            <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{newReservation.email}</span></div>
                            {newReservation.advanceAmount > 0 && <div><span className="text-muted-foreground">Advance:</span> <span className="font-medium text-green-600">₹{newReservation.advanceAmount.toFixed(2)}</span></div>}
                          </div>
                          <div className="border-t pt-3 flex justify-between items-center">
                            <span className="font-bold text-lg">Total</span>
                            <span className="font-bold text-lg text-primary">₹{getWizardSelectedTotal().toFixed(2)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  {wizardStep > 1 && (
                    <Button variant="outline" onClick={() => setWizardStep(wizardStep - 1)} data-testid="button-wizard-back">Back</Button>
                  )}
                  {wizardStep === 1 && (
                    <Button onClick={() => { if (!newReservation.checkIn || !newReservation.checkOut) { toast({ title: "Missing Dates", description: "Please select check-in and check-out dates.", variant: "destructive" }); return; } if (wizardNights <= 0) { toast({ title: "Invalid Dates", description: "Check-out must be after check-in.", variant: "destructive" }); return; } const allExceeded = roomTypesData.length > 0 && roomTypesData.every((rt: any) => newReservation.adults > rt.maxAdults || newReservation.children > rt.maxChildren); if (allExceeded && !overrideCapacity) { toast({ title: "Capacity Exceeded", description: "The number of guests exceeds the maximum capacity of all available room types. Please reduce guest count or enable capacity override.", variant: "destructive" }); return; } setWizardStep(2); }} data-testid="button-search-availability">Search Availability</Button>
                  )}
                  {wizardStep === 2 && (
                    <Button onClick={() => { if (newReservation.selectedRooms.length === 0) { toast({ title: "No Room Selected", description: "Please select at least one room.", variant: "destructive" }); return; } setWizardStep(3); }} disabled={newReservation.selectedRooms.length === 0} data-testid="button-continue-guest">Continue</Button>
                  )}
                  {wizardStep === 3 && (
                    <Button onClick={() => { if (validateStep3()) setWizardStep(4); }} data-testid="button-review">Review & Confirm</Button>
                  )}
                  {wizardStep === 4 && (
                    <Button onClick={handleCreateReservation} disabled={createBookingMutation.isPending} data-testid="button-confirm-booking">
                      {createBookingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirm Booking
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle>Active Bookings</CardTitle>
                <CardDescription>View and manage all reservations.</CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name, ID, room..."
                    className="pl-8 w-full sm:w-[250px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-bookings"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px] sm:w-[150px] shrink-0" data-testid="select-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Booked</SelectItem>
                    <SelectItem value="active">Checked In</SelectItem>
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
            <>
              <div className="block md:hidden space-y-3">
                <div className="flex items-center gap-2 pb-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Sort by:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-8 text-xs w-[140px]" data-testid="select-sort-mobile">
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="guest">Guest Name</SelectItem>
                      <SelectItem value="room">Room</SelectItem>
                      <SelectItem value="checkin">Check-in Date</SelectItem>
                      <SelectItem value="checkout">Check-out Date</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground ml-auto">{filteredBookings.length} booking{filteredBookings.length !== 1 ? "s" : ""}</span>
                </div>
                {filteredBookings.map((booking: any) => {
                  const totals = calculateTotals(booking);
                  return (
                    <div key={booking.id} className="border rounded-lg p-3 space-y-2" data-testid={`card-booking-${booking.id}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{booking.guest}</div>
                          <div className="text-xs text-muted-foreground">{booking.bookingId}</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="secondary" className={`font-medium text-[10px] px-1.5 py-0.5 ${booking.status === "Checked In" ? "bg-green-100 text-green-700" : booking.status === "Checked Out" ? "bg-gray-100 text-gray-500" : ""}`}>
                            {booking.status}
                          </Badge>
                          {booking.status === "Checked Out" && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 font-medium">
                              Paid
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div><span className="text-muted-foreground">Room:</span> {booking.room}</div>
                        <div className="truncate"><span className="text-muted-foreground">Type:</span> {booking.type}</div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">In:</span> {booking.checkIn}
                          {booking.checkedInAt && (
                            <span className="text-green-600 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {new Date(booking.checkedInAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Out:</span> {booking.checkOut}
                          {booking.checkedOutAt && (
                            <span className="text-green-600 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {new Date(booking.checkedOutAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-muted-foreground">Balance:</span> <span className="font-medium">{currency} {totals.due.toFixed(2)}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{booking.source}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1.5 border-t">
                        <Button size="sm" variant="ghost" className="h-6 text-[11px] px-2" onClick={() => openViewDialog(booking)}>
                          <Eye className="h-3 w-3 mr-1" /> View
                        </Button>
                        {booking.status === "Confirmed" && (
                          <Button size="sm" variant="outline" className="h-6 text-[11px] px-2 border-green-200 text-green-700" onClick={() => handleCheckIn(booking)}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Check In
                          </Button>
                        )}
                        {booking.status === "Checked In" && (
                          <>
                            <Button size="sm" variant="outline" className="h-6 text-[11px] px-2" onClick={() => openChargeDialog(booking.bookingId)}>
                              <Plus className="h-3 w-3 mr-1" /> Charge
                            </Button>
                            <Button size="sm" className="h-6 text-[11px] px-2" onClick={() => openCheckoutDialog(booking)}>
                              <LogOut className="h-3 w-3 mr-1" /> Out
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 text-[11px] px-2 text-orange-600" onClick={() => openReversalDialog(booking, "revert_booked")}>
                              <Undo2 className="h-3 w-3 mr-1" /> Revert
                            </Button>
                          </>
                        )}
                        {booking.status === "Checked Out" && (
                          <>
                            <Button size="sm" variant="ghost" className="h-6 text-[11px] px-2 text-red-600" onClick={() => openReversalDialog(booking, "payment")}>
                              <BadgeDollarSign className="h-3 w-3 mr-1" /> Reverse Pay
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 text-[11px] px-2 text-orange-600" onClick={() => openReversalDialog(booking, "checkout")}>
                              <RotateCcw className="h-3 w-3 mr-1" /> Undo Out
                            </Button>
                            <Button size="sm" variant="outline" className="h-6 text-[11px] px-2" onClick={() => openCheckoutDialog(booking)}>
                              <FileCheck className="h-3 w-3 mr-1" /> Invoice
                            </Button>
                          </>
                        )}
                        {role === "owner" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500" disabled={booking.status === "Checked In" || booking.status === "Checked Out"}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Reservation?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently remove the booking for {booking.guest}.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteBooking(booking)} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block">
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
                    {filteredBookings.map((booking: any) => {
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
                              <span className="flex items-center gap-1.5">
                                In: {booking.checkIn}
                                {booking.checkedInAt && (
                                  <span className="text-[10px] text-green-600 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {new Date(booking.checkedInAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                                )}
                              </span>
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                Out: {booking.checkOut}
                                {booking.checkedOutAt && (
                                  <span className="text-[10px] text-green-600 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {new Date(booking.checkedOutAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{booking.source}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{currency} {totals.due.toFixed(2)}</span>
                              <span className="text-xs text-muted-foreground">{booking.charges.length} extra charges</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="secondary" className={`font-medium ${booking.status === "Checked In" ? "bg-green-100 text-green-700" : booking.status === "Checked Out" ? "bg-gray-100 text-gray-500" : ""}`}>
                                {booking.status}
                              </Badge>
                              {booking.status === "Checked Out" && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 font-medium">
                                  <BadgeDollarSign className="h-3 w-3 mr-0.5" /> Paid
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" className="h-8" onClick={() => openViewDialog(booking)}>
                                <Eye className="h-3 w-3 mr-1" /> View/Edit
                              </Button>
                              {booking.status === "Confirmed" && (
                                <Button size="sm" variant="outline" className="h-8 border-green-200 text-green-700 hover:bg-green-50" onClick={() => handleCheckIn(booking)}>
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Check In
                                </Button>
                              )}
                              {booking.status === "Checked In" && (
                                <>
                                  <Button size="sm" variant="outline" className="h-8" onClick={() => openChargeDialog(booking.bookingId)}>
                                    <Plus className="h-3 w-3 mr-1" /> Charge
                                  </Button>
                                  <Button size="sm" className="h-8" onClick={() => openCheckoutDialog(booking)}>
                                    <LogOut className="h-3 w-3 mr-1" /> Out
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-8 text-orange-600" onClick={() => openReversalDialog(booking, "revert_booked")} title="Revert to Booked">
                                    <Undo2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              {booking.status === "Checked Out" && (
                                <>
                                  <Button size="sm" variant="ghost" className="h-8 text-red-600" onClick={() => openReversalDialog(booking, "payment")} title="Reverse Payment">
                                    <BadgeDollarSign className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-8 text-orange-600" onClick={() => openReversalDialog(booking, "checkout")} title="Undo Checkout">
                                    <RotateCcw className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-8" onClick={() => openCheckoutDialog(booking)} title="View Invoice">
                                    <FileCheck className="h-3 w-3 mr-1" /> Invoice
                                  </Button>
                                </>
                              )}
                              {role === "owner" && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" disabled={booking.status === "Checked In" || booking.status === "Checked Out"}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Reservation?</AlertDialogTitle>
                                      <AlertDialogDescription>This will permanently remove the booking for {booking.guest}.</AlertDialogDescription>
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
              </div>
            </>
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
                       <div>
                         <div className="font-medium">{viewingBooking.checkIn}</div>
                         <span className="text-xs text-muted-foreground">From {checkInTimeFormatted}</span>
                       </div>
                     )}
                  </div>
                  <div className="space-y-1">
                     <Label>Check Out</Label>
                     {isEditingMode ? (
                       <Input type="date" value={viewingBooking.checkOut} onChange={(e) => setViewingBooking({...viewingBooking, checkOut: e.target.value})} />
                     ) : (
                       <div>
                         <div className="font-medium">{viewingBooking.checkOut}</div>
                         <span className="text-xs text-muted-foreground">By {checkOutTimeFormatted}</span>
                       </div>
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

                {(viewingBooking.checkedInAt || viewingBooking.checkedOutAt) && (
                  <div className="grid grid-cols-2 gap-4">
                    {viewingBooking.checkedInAt && (
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> Check-In Time</Label>
                        <div className="font-medium text-sm text-green-700">
                          {new Date(viewingBooking.checkedInAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                        </div>
                      </div>
                    )}
                    {viewingBooking.checkedOutAt && (
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> Check-Out Time</Label>
                        <div className="font-medium text-sm text-gray-600">
                          {new Date(viewingBooking.checkedOutAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
            {checkoutBooking && (() => {
              const liveCharges = allChargesData
                .filter((c: any) => c.bookingId === checkoutBooking.bookingId)
                .map((c: any) => ({
                  ...c,
                  item: c.description,
                  type: c.category,
                  amount: parseFloat(c.amount) || 0,
                  quantity: 1
                }));
              const liveBooking = { ...checkoutBooking, charges: liveCharges };
              const totals = calculateTotals(liveBooking, appliedDiscount);
              return (
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
                     {checkoutBooking.checkedInAt && (
                       <p className="text-xs text-green-600 mt-1 flex items-center justify-end gap-1"><Clock className="h-3 w-3" /> In: {new Date(checkoutBooking.checkedInAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}</p>
                     )}
                     {checkoutBooking.checkedOutAt && (
                       <p className="text-xs text-gray-500 flex items-center justify-end gap-1"><Clock className="h-3 w-3" /> Out: {new Date(checkoutBooking.checkedOutAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}</p>
                     )}
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Charge Details</h4>
                   
                   {/* Room Charges */}
                   <div className="flex justify-between text-sm">
                      <span>Room Charges ({checkoutBooking.type})</span>
                      <span className="font-medium">{currency} {checkoutBooking.amount.toFixed(2)}</span>
                   </div>

                   {/* Extra Charges */}
                   {liveCharges.length > 0 && (
                     <div className="space-y-2 border-l-2 pl-3 my-2">
                       {liveCharges.map((charge: any, idx: number) => (
                         <div key={idx} className="flex items-center justify-between text-sm text-muted-foreground">
                            <span className="flex items-center gap-2">
                              {checkoutBooking.status !== "Checked Out" && checkoutBooking.status !== "checked_out" && (
                                <button
                                  onClick={() => deleteChargeMutation.mutate(charge.id)}
                                  className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                                  title="Remove this charge"
                                  data-testid={`button-delete-charge-${charge.id}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {charge.item} (x{charge.quantity})
                            </span>
                            <span>{currency} {charge.amount.toFixed(2)}</span>
                         </div>
                       ))}
                     </div>
                   )}

                   <div className="border-t border-dashed my-2"></div>

                   <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{currency} {totals.subtotal.toFixed(2)}</span>
                   </div>

                   {/* Discount Section */}
                   {checkoutBooking.status !== "Checked Out" && checkoutBooking.status !== "checked_out" && (
                     <>
                       {!showDiscountPanel && !appliedDiscount && (
                         <Button
                           variant="outline"
                           size="sm"
                           className="w-full border-dashed text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                           onClick={() => setShowDiscountPanel(true)}
                           data-testid="button-apply-discount"
                         >
                           <Tags className="mr-2 h-4 w-4" />
                           Apply Discount
                         </Button>
                       )}

                       {showDiscountPanel && !appliedDiscount && (
                         <div className="space-y-3 border border-purple-200 rounded-lg p-3 bg-purple-50/30">
                           <div className="flex items-center justify-between">
                             <p className="text-sm font-medium text-purple-700">Apply Discount</p>
                             <button onClick={() => setShowDiscountPanel(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                           </div>
                           <div className="flex gap-2">
                             <Button
                               size="sm"
                               variant={discountMode === "coupon" ? "default" : "outline"}
                               onClick={() => { setDiscountMode("coupon"); setCouponError(""); }}
                               className="text-xs flex-1"
                               data-testid="button-mode-coupon"
                             >
                               Coupon Code
                             </Button>
                             <Button
                               size="sm"
                               variant={discountMode === "manual" ? "default" : "outline"}
                               onClick={() => { setDiscountMode("manual"); setCouponError(""); }}
                               className="text-xs flex-1"
                               data-testid="button-mode-manual"
                             >
                               Manual Discount
                             </Button>
                           </div>

                           {discountMode === "coupon" && (
                             <div className="space-y-2">
                               <div className="flex gap-2">
                                 <Input
                                   placeholder="Enter coupon code"
                                   value={couponCode}
                                   onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                                   className="font-mono text-sm"
                                   data-testid="input-coupon-code"
                                 />
                                 <Button
                                   size="sm"
                                   disabled={!couponCode.trim()}
                                   onClick={() => {
                                     const found = coupons.find((c: any) => c.code === couponCode.trim());
                                     if (!found) { setCouponError("Invalid coupon code."); return; }
                                     if (found.expiry && new Date(found.expiry) < new Date()) { setCouponError("This coupon has expired."); return; }
                                     const discAmount = found.type === "percentage"
                                       ? totals.subtotal * (found.value / 100)
                                       : Math.min(found.value, totals.subtotal);
                                     setAppliedDiscount({
                                       type: "coupon",
                                       label: `Coupon: ${found.code} (${found.type === "percentage" ? found.value + "%" : currency + " " + found.value})`,
                                       mode: found.type,
                                       value: found.value,
                                       amount: discAmount
                                     });
                                     setShowDiscountPanel(false);
                                   }}
                                   data-testid="button-apply-coupon"
                                 >
                                   Apply
                                 </Button>
                               </div>
                               {couponError && <p className="text-xs text-red-500">{couponError}</p>}
                             </div>
                           )}

                           {discountMode === "manual" && (
                             <div className="space-y-2">
                               <div className="flex items-center gap-2">
                                 <Input
                                   type="number"
                                   min={0}
                                   max={getMaxDiscountPercent()}
                                   value={manualDiscountPercent || ""}
                                   onChange={(e) => {
                                     let val = parseFloat(e.target.value) || 0;
                                     if (val > getMaxDiscountPercent()) val = getMaxDiscountPercent();
                                     setManualDiscountPercent(val);
                                   }}
                                   className="w-24"
                                   data-testid="input-manual-discount"
                                 />
                                 <span className="text-sm font-medium">%</span>
                                 <Button
                                   size="sm"
                                   disabled={manualDiscountPercent <= 0}
                                   onClick={() => {
                                     const discAmount = totals.subtotal * (manualDiscountPercent / 100);
                                     setAppliedDiscount({
                                       type: "manual",
                                       label: `Manual Discount (${manualDiscountPercent}%)`,
                                       mode: "percentage",
                                       value: manualDiscountPercent,
                                       amount: discAmount
                                     });
                                     setShowDiscountPanel(false);
                                   }}
                                   data-testid="button-apply-manual"
                                 >
                                   Apply
                                 </Button>
                               </div>
                               <p className="text-xs text-muted-foreground">
                                 {role === "owner"
                                   ? "As owner, you can apply any discount."
                                   : `Your maximum allowed discount is ${getMaxDiscountPercent()}%.`
                                 }
                               </p>
                             </div>
                           )}
                         </div>
                       )}
                     </>
                   )}

                   {appliedDiscount && (
                     <div className="flex justify-between items-center text-sm text-purple-700 bg-purple-50 rounded-md px-3 py-2">
                       <span className="flex items-center gap-2">
                         <Tags className="h-3.5 w-3.5" />
                         {appliedDiscount.label}
                       </span>
                       <span className="flex items-center gap-2">
                         <span className="font-medium">-{currency} {totals.discountAmount.toFixed(2)}</span>
                         {checkoutBooking.status !== "Checked Out" && checkoutBooking.status !== "checked_out" && (
                           <button
                             onClick={() => { setAppliedDiscount(null); setShowDiscountPanel(false); setManualDiscountPercent(0); setCouponCode(""); }}
                             className="text-red-400 hover:text-red-600 ml-1"
                             title="Remove discount"
                             data-testid="button-remove-discount"
                           >
                             <Trash2 className="h-3.5 w-3.5" />
                           </button>
                         )}
                       </span>
                     </div>
                   )}

                   {/* Tax Breakdown */}
                   <div className="space-y-1 border-l-2 border-orange-200 pl-3 my-2">
                     <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Tax Breakdown{totals.discountAmount > 0 ? " (on discounted amount)" : ""}</p>
                     {totals.taxBreakdown.filter((t: any) => t.taxable).length > 0 ? (
                       totals.taxBreakdown.filter((t: any) => t.taxable).map((t: any, i: number) => (
                         <div key={i} className="flex justify-between text-xs text-muted-foreground">
                           <span>{t.label} @ {t.rate}%</span>
                           <span>{currency} {t.amount.toFixed(2)}</span>
                         </div>
                       ))
                     ) : (
                       <p className="text-xs text-muted-foreground">No taxable items</p>
                     )}
                     {totals.taxBreakdown.filter((t: any) => !t.taxable).length > 0 && (
                       <>
                         <p className="text-xs text-muted-foreground italic mt-1">Non-taxable:</p>
                         {totals.taxBreakdown.filter((t: any) => !t.taxable).map((t: any, i: number) => (
                           <div key={i} className="flex justify-between text-xs text-muted-foreground/60">
                             <span>{t.label}</span>
                             <span>--</span>
                           </div>
                         ))}
                       </>
                     )}
                   </div>

                   <div className="flex justify-between text-sm font-medium">
                      <span>Total Tax</span>
                      <span>{currency} {totals.tax.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-sm text-green-600">
                      <span>Advance Payment</span>
                      <span>-{currency} {checkoutBooking.advance.toFixed(2)}</span>
                   </div>

                   <div className="border-t pt-2 mt-2 flex justify-between items-center bg-muted/20 p-2 rounded">
                      <span className="font-bold text-lg">Total Due</span>
                      <span className="font-bold text-lg text-primary">{currency} {totals.due.toFixed(2)}</span>
                   </div>

                   {/* Payment Method - Only show if not checked out */}
                   {checkoutBooking.status !== "Checked Out" && checkoutBooking.status !== "checked_out" && (
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

                {/* Invoice Actions - Only show if Checked Out */}
                {(checkoutBooking.status === "Checked Out" || checkoutBooking.status === "checked_out") && (
                  <div className="space-y-4 pt-2">
                     <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Invoice (Taxable Items Only)</h4>
                     
                     {/* Taxable items invoice summary */}
                     <div className="bg-muted/10 border rounded-md p-4 space-y-2">
                       {totals.taxBreakdown.filter((t: any) => t.taxable).length > 0 ? (
                         <>
                           {totals.taxBreakdown.filter((t: any) => t.taxable).map((t: any, i: number) => (
                             <div key={i} className="flex justify-between text-sm">
                               <span>{t.label}</span>
                               <div className="text-right">
                                 <span>{currency} {t.baseAmount.toFixed(2)}</span>
                                 <span className="text-xs text-muted-foreground ml-1">(+{t.rate}% = {currency} {t.amount.toFixed(2)})</span>
                               </div>
                             </div>
                           ))}
                           <div className="border-t pt-2 mt-2 flex justify-between font-medium text-sm">
                             <span>Taxable Total (incl. tax)</span>
                             <span>{currency} {(totals.taxBreakdown.filter((t: any) => t.taxable).reduce((acc: number, t: any) => acc + t.baseAmount + t.amount, 0)).toFixed(2)}</span>
                           </div>
                         </>
                       ) : (
                         <p className="text-sm text-muted-foreground text-center">No taxable items in this booking.</p>
                       )}
                     </div>

                     <div className="grid grid-cols-2 gap-4 bg-muted/10 p-4 rounded-md">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="auto-email" 
                            checked={checkoutOptions.email}
                            onCheckedChange={(checked) => setCheckoutOptions({...checkoutOptions, email: !!checked})}
                          />
                          <Label htmlFor="auto-email" className="flex items-center gap-2 cursor-pointer">
                            <Mail className="h-4 w-4 text-muted-foreground" /> Email Invoice
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="auto-whatsapp" 
                            checked={checkoutOptions.whatsapp}
                            onCheckedChange={(checked) => setCheckoutOptions({...checkoutOptions, whatsapp: !!checked})}
                          />
                          <Label htmlFor="auto-whatsapp" className="flex items-center gap-2 cursor-pointer">
                            <MessageCircle className="h-4 w-4 text-muted-foreground" /> WhatsApp
                          </Label>
                        </div>
                     </div>

                     <div className="flex gap-2 justify-center pt-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handlePrintInvoice(checkoutBooking)} data-testid="button-print-invoice">
                          <Printer className="mr-2 h-4 w-4" /> Print Invoice
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDownloadInvoice(checkoutBooking)} disabled={isDownloadingPdf} data-testid="button-download-invoice">
                          {isDownloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                          {isDownloadingPdf ? "Generating..." : "Download PDF"}
                        </Button>
                     </div>
                  </div>
                )}
              </div>
            );
            })()}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsCheckoutDialogOpen(false)}>Close</Button>
              {checkoutBooking && checkoutBooking.status !== "Checked Out" && checkoutBooking.status !== "checked_out" && (
                <Button onClick={handleCheckout} className="bg-green-600 hover:bg-green-700" disabled={updateBookingMutation.isPending}>
                  {updateBookingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay & Checkout
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isReversalDialogOpen} onOpenChange={(open) => { if (!open) { setIsReversalDialogOpen(false); setPendingReversal(null); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <ShieldAlert className="h-5 w-5" />
                {getReversalWarning().title}
              </DialogTitle>
              <DialogDescription className="text-left pt-2">
                {getReversalWarning().description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-sm text-amber-800 font-medium">This action cannot be easily undone. Please verify your identity to proceed.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reversal-password">Enter your password to confirm</Label>
                <Input
                  id="reversal-password"
                  type="password"
                  placeholder="Your account password"
                  value={reversalPassword}
                  onChange={(e) => { setReversalPassword(e.target.value); setReversalError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && reversalPassword) executeReversal(); }}
                  data-testid="input-reversal-password"
                />
                {reversalError && <p className="text-sm text-red-500">{reversalError}</p>}
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => { setIsReversalDialogOpen(false); setPendingReversal(null); }}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={executeReversal}
                disabled={!reversalPassword || reversalVerifying}
                data-testid="button-confirm-reversal"
              >
                {reversalVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm {getReversalWarning().title}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}