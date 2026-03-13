import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Edit, Save, BedDouble, CalendarRange, Sparkles, Terminal, Play, UtensilsCrossed, Mail, MessageCircle, ShieldCheck, Tags, Loader2, Pencil, Clock, Users, CalendarDays, Archive, ArchiveRestore, Search, Eye, Send, FileText, RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import AdminRooms from "@/pages/admin-rooms";

export default function AdminSettings() {
  const { toast } = useToast();

  const { data: roomTypesData, isLoading: roomTypesLoading } = useQuery<any[]>({ queryKey: ['/api/room-types'] });
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery<any[]>({ queryKey: ['/api/categories'] });
  const { data: facilitiesData, isLoading: facilitiesLoading } = useQuery<any[]>({ queryKey: ['/api/facilities'] });
  const { data: settingsData, isLoading: settingsLoading } = useQuery<Record<string, string>>({ queryKey: ['/api/settings'] });
  const { data: archivedBookingsData } = useQuery<any[]>({ queryKey: ['/api/bookings-archived'] });
  const { data: roomsData } = useQuery<any[]>({ queryKey: ['/api/rooms'] });
  const { data: schedulerLogsData } = useQuery<any[]>({ queryKey: ['/api/invoice-scheduler-logs'] });
  const { data: salarySchedulerLogsData } = useQuery<any[]>({ queryKey: ['/api/salary-scheduler/logs'] });
  const { data: salarySchedulerSettingsData } = useQuery<any>({ queryKey: ['/api/salary-scheduler/settings'] });
  const { data: allStaffData } = useQuery<any[]>({ queryKey: ['/api/staff'] });
  const [archivalSearch, setArchivalSearch] = useState("");
  const [staffArchivalSearch, setStaffArchivalSearch] = useState("");
  const [viewingArchived, setViewingArchived] = useState<any>(null);

  const [taxEmailInput, setTaxEmailInput] = useState("");
  const [manualStartDate, setManualStartDate] = useState("");
  const [manualEndDate, setManualEndDate] = useState("");
  const [isSendingTaxInvoices, setIsSendingTaxInvoices] = useState(false);

  const [salarySchedulerEnabled, setSalarySchedulerEnabled] = useState(false);
  const [salarySchedulerDay, setSalarySchedulerDay] = useState(1);
  const [salaryManualMonth, setSalaryManualMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isGeneratingSalaries, setIsGeneratingSalaries] = useState(false);
  const [viewingSalaryLog, setViewingSalaryLog] = useState<any>(null);

  const roomTypes = roomTypesData || [];
  const categories = categoriesData || [];
  const facilities = facilitiesData || [];

  const currency = settingsData?.currency || "USD";
  const taxes: any[] = (() => { try { return JSON.parse(settingsData?.taxes || '[]'); } catch { return []; } })();
  const priceRules: any[] = (() => { try { return JSON.parse(settingsData?.priceRules || '[]'); } catch { return []; } })();
  const coupons: any[] = (() => { try { return JSON.parse(settingsData?.coupons || '[]'); } catch { return []; } })();

  const [localCheckInTime, setLocalCheckInTime] = useState(settingsData?.checkInTime || "14:00");
  const [localCheckOutTime, setLocalCheckOutTime] = useState(settingsData?.checkOutTime || "11:00");
  const [localAgeAdult, setLocalAgeAdult] = useState(parseInt(settingsData?.ageRuleAdult || "13"));
  const [localAgeChild, setLocalAgeChild] = useState(parseInt(settingsData?.ageRuleChild || "3"));
  const [localAgeInfant, setLocalAgeInfant] = useState(parseInt(settingsData?.ageRuleInfant || "2"));
  const [localWeekendDays, setLocalWeekendDays] = useState<number[]>(() => { try { return JSON.parse(settingsData?.weekendDays || '[0,6]'); } catch { return [0, 6]; } });
  const [localManagerLimit, setLocalManagerLimit] = useState(parseInt(settingsData?.discountLimitManager || "15"));
  const [localReceptionistLimit, setLocalReceptionistLimit] = useState(parseInt(settingsData?.discountLimitReceptionist || "5"));

  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: "", value: 0, type: "percentage" as "percentage" | "fixed", expiry: "" });

  const settingsDataStr = JSON.stringify(settingsData || {});
  useEffect(() => {
    setLocalCheckInTime(settingsData?.checkInTime || "14:00");
    setLocalCheckOutTime(settingsData?.checkOutTime || "11:00");
    setLocalAgeAdult(parseInt(settingsData?.ageRuleAdult || "13"));
    setLocalAgeChild(parseInt(settingsData?.ageRuleChild || "3"));
    setLocalAgeInfant(parseInt(settingsData?.ageRuleInfant || "2"));
    try { setLocalWeekendDays(JSON.parse(settingsData?.weekendDays || '[0,6]')); } catch { setLocalWeekendDays([0, 6]); }
    setLocalManagerLimit(parseInt(settingsData?.discountLimitManager || "15"));
    setLocalReceptionistLimit(parseInt(settingsData?.discountLimitReceptionist || "5"));
  }, [settingsDataStr]);

  useEffect(() => {
    if (salarySchedulerSettingsData) {
      setSalarySchedulerEnabled(salarySchedulerSettingsData.enabled || false);
      setSalarySchedulerDay(salarySchedulerSettingsData.dayOfMonth || 1);
    }
  }, [salarySchedulerSettingsData]);

  const DAY_NAMES = [
    { value: 0, label: "Sun" },
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
  ];

  const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
    const ampm = i >= 12 ? "PM" : "AM";
    const hour12 = i % 12 || 12;
    const label = `${hour12}:00 ${ampm}`;
    const value = `${i.toString().padStart(2, "0")}:00`;
    return { value, label };
  });
  const invoiceSettings = (() => {
    try {
      return JSON.parse(settingsData?.invoiceSettings || '{}');
    } catch {
      return {};
    }
  })();
  const parsedInvoiceSettings = {
    taxableItems: {
      room: invoiceSettings?.taxableItems?.room ?? true,
      food: invoiceSettings?.taxableItems?.food ?? true,
      facility: invoiceSettings?.taxableItems?.facility ?? true,
      other: invoiceSettings?.taxableItems?.other ?? false,
    },
    taxRates: {
      room: invoiceSettings?.taxRates?.room ?? 12,
      food: invoiceSettings?.taxRates?.food ?? 5,
      facility: invoiceSettings?.taxRates?.facility ?? 18,
      other: invoiceSettings?.taxRates?.other ?? 0,
    },
    autoSend: {
      email: invoiceSettings?.autoSend?.email ?? true,
      whatsapp: invoiceSettings?.autoSend?.whatsapp ?? false,
    },
  };
  const [localTaxRates, setLocalTaxRates] = useState<{room: number; food: number; facility: number; other: number} | null>(null);
  const effectiveTaxRates = localTaxRates ?? parsedInvoiceSettings.taxRates;
  const welfareSettings = (() => {
    try {
      const parsed = JSON.parse(settingsData?.welfareSettings || '{}');
      return {
        enabled: parsed?.enabled ?? false,
        firstYearAmount: parsed?.firstYearAmount ?? 1000,
        afterFirstYearAmount: parsed?.afterFirstYearAmount ?? 1500,
        contributionType: parsed?.contributionType ?? "Fixed",
      };
    } catch {
      return { enabled: false, firstYearAmount: 1000, afterFirstYearAmount: 1500, contributionType: "Fixed" };
    }
  })();

  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [newCategoryType, setNewCategoryType] = useState("");
  const [newCategoryTaxable, setNewCategoryTaxable] = useState(false);
  const [newCategorySubtypes, setNewCategorySubtypes] = useState<Array<{ subtype: string; items: string[] }>>([{ subtype: "", items: [""] }]);
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false);
  const [editCategoryType, setEditCategoryType] = useState("");
  const [editCategoryOriginalType, setEditCategoryOriginalType] = useState("");
  const [editCategoryTaxable, setEditCategoryTaxable] = useState(false);
  const [editCategorySubtypes, setEditCategorySubtypes] = useState<Array<{ subtype: string; items: Array<{ id?: number; name: string }> }>>([]);

  const [isRoomTypeDialogOpen, setIsRoomTypeDialogOpen] = useState(false);
  const [newRoomType, setNewRoomType] = useState<any>({
    name: "",
    beds: "",
    maxAdults: 2,
    maxChildren: 0,
    price: 0,
    size: "",
    selectedFacilityIds: [] as number[]
  });
  const [isEditRoomTypeDialogOpen, setIsEditRoomTypeDialogOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<any>(null);

  const [isTaxDialogOpen, setIsTaxDialogOpen] = useState(false);
  const [newTax, setNewTax] = useState({
    name: "",
    rate: 0,
    type: "Percentage",
    appliedTo: "All"
  });

  const [isPriceRuleDialogOpen, setIsPriceRuleDialogOpen] = useState(false);
  const [newPriceRule, setNewPriceRule] = useState({
    roomTypeId: "",
    startDate: "",
    endDate: "",
    price: 0
  });

  const [isFacilityDialogOpen, setIsFacilityDialogOpen] = useState(false);
  const [newFacility, setNewFacility] = useState({
    name: "",
    price: 0,
    unit: "item",
    isFree: true,
    isDefault: false,
    taxable: false,
    active: true
  });

  const [isEditFacilityDialogOpen, setIsEditFacilityDialogOpen] = useState(false);
  const [editFacility, setEditFacility] = useState<any>(null);


  const saveSettingMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      await apiRequest("POST", "/api/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
  });

  const addRoomTypeMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/room-types", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/room-types'] });
    },
  });

  const deleteRoomTypeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/room-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/room-types'] });
    },
  });

  const updateRoomTypeMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PATCH", `/api/room-types/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/room-types'] });
    },
  });

  const bulkAddCategoryMutation = useMutation({
    mutationFn: async (data: { type: string; taxable: boolean; subtypes: Array<{ subtype: string; item: string }> }) => {
      await apiRequest("POST", "/api/categories/bulk", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
  });

  const syncCategoryMutation = useMutation({
    mutationFn: async (data: { type: string; taxable: boolean; subtypes: Array<{ id?: number; subtype: string; item: string }> }) => {
      await apiRequest("PUT", "/api/categories/sync", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
  });

  const deleteCategoryTypeMutation = useMutation({
    mutationFn: async (type: string) => {
      await apiRequest("DELETE", `/api/categories/type/${encodeURIComponent(type)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
  });

  const addFacilityMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/facilities", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/facilities'] });
    },
  });

  const deleteFacilityMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/facilities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/facilities'] });
    },
  });

  const updateFacilityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PATCH", `/api/facilities/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/facilities'] });
    },
  });


  const activateStaffMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/staff/${id}`, { status: "active" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      toast({ title: "Staff Activated", description: "The staff member has been restored to active status." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const unarchiveBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/bookings/${id}/unarchive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings-archived'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({ title: "Booking Restored", description: "The booking has been moved back to active bookings." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteArchivedBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/bookings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings-archived'] });
      toast({ title: "Booking Deleted", description: "The archived booking has been permanently removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const archivedBookings = archivedBookingsData || [];
  const allRooms = roomsData || [];
  const getRoomNumber = (roomId: number) => allRooms.find((r: any) => r.id === roomId)?.roomNumber || `#${roomId}`;
  const getRoomTypeName = (typeId: number) => roomTypes.find((rt: any) => rt.id === typeId)?.name || "Unknown";

  const filteredArchivedBookings = archivedBookings.filter((b: any) => {
    if (!archivalSearch.trim()) return true;
    const q = archivalSearch.toLowerCase().trim();
    const guestName = `${b.guestName} ${b.guestLastName || ""}`.toLowerCase();
    return guestName.includes(q) || (b.bookingId || "").toLowerCase().includes(q) || (b.guestPhone || "").toLowerCase().includes(q) || (b.guestEmail || "").toLowerCase().includes(q);
  });

  const handleAddCategory = () => {
    if (!newCategoryType.trim()) {
      toast({ title: "Validation Error", description: "Category type is required.", variant: "destructive" });
      return;
    }
    const duplicate = categories.find(
      (c: any) => c.type.toLowerCase() === newCategoryType.trim().toLowerCase()
    );
    if (duplicate) {
      toast({ title: "Duplicate Category", description: `A category with type "${newCategoryType}" already exists.`, variant: "destructive" });
      return;
    }
    const validSubtypes = newCategorySubtypes.filter(s => s.subtype.trim());
    if (validSubtypes.length === 0) {
      toast({ title: "Validation Error", description: "Add at least one subtype.", variant: "destructive" });
      return;
    }
    const subtypeNames = validSubtypes.map(s => s.subtype.trim().toLowerCase());
    if (new Set(subtypeNames).size !== subtypeNames.length) {
      toast({ title: "Duplicate Subtype", description: "Each subtype must be unique within a category.", variant: "destructive" });
      return;
    }
    const flatSubtypes = validSubtypes.flatMap(s => {
      const validItems = s.items.filter(i => i.trim());
      if (validItems.length === 0) return [{ subtype: s.subtype.trim(), item: "" }];
      return validItems.map(i => ({ subtype: s.subtype.trim(), item: i.trim() }));
    });
    bulkAddCategoryMutation.mutate(
      { type: newCategoryType.trim(), taxable: newCategoryTaxable, subtypes: flatSubtypes },
      {
        onSuccess: () => {
          setNewCategoryType("");
          setNewCategoryTaxable(false);
          setNewCategorySubtypes([{ subtype: "", items: [""] }]);
          setAddCategoryDialogOpen(false);
          toast({ title: "Category Added", description: "New category has been added." });
        },
      }
    );
  };

  const handleEditCategory = () => {
    if (!editCategoryType.trim()) {
      toast({ title: "Validation Error", description: "Category type is required.", variant: "destructive" });
      return;
    }
    const validSubtypes = editCategorySubtypes.filter(s => s.subtype.trim());
    if (validSubtypes.length === 0) {
      toast({ title: "Validation Error", description: "Add at least one subtype.", variant: "destructive" });
      return;
    }
    const subtypeNames = validSubtypes.map(s => s.subtype.trim().toLowerCase());
    if (new Set(subtypeNames).size !== subtypeNames.length) {
      toast({ title: "Duplicate Subtype", description: "Each subtype must be unique within a category.", variant: "destructive" });
      return;
    }
    const flatSubtypes = validSubtypes.flatMap(s => {
      const validItems = s.items.filter(i => i.name.trim());
      if (validItems.length === 0) return [{ id: s.items[0]?.id, subtype: s.subtype.trim(), item: "" }];
      return validItems.map(i => ({ id: i.id, subtype: s.subtype.trim(), item: i.name.trim() }));
    });
    syncCategoryMutation.mutate(
      { type: editCategoryType.trim(), taxable: editCategoryTaxable, subtypes: flatSubtypes },
      {
        onSuccess: () => {
          setEditCategoryDialogOpen(false);
          toast({ title: "Category Updated", description: "Category has been updated." });
        },
      }
    );
  };

  const handleDeleteCategoryType = (type: string) => {
    deleteCategoryTypeMutation.mutate(type, {
      onSuccess: () => {
        toast({ title: "Category Removed", description: `All "${type}" categories have been removed.` });
      },
    });
  };

  const handleOpenEditCategory = (type: string) => {
    const typeCategories = categories.filter((c: any) => c.type === type);
    if (typeCategories.length === 0) return;
    setEditCategoryOriginalType(type);
    setEditCategoryType(type);
    setEditCategoryTaxable(typeCategories[0].taxable);
    const subtypeMap: Record<string, Array<{ id?: number; name: string }>> = {};
    typeCategories.forEach((c: any) => {
      const st = c.subtype || "";
      if (!subtypeMap[st]) subtypeMap[st] = [];
      subtypeMap[st].push({ id: c.id, name: c.item || "" });
    });
    setEditCategorySubtypes(Object.entries(subtypeMap).map(([subtype, items]) => ({ subtype, items })));
    setEditCategoryDialogOpen(true);
  };

  const handleAddRoomType = () => {
    const defaultFacilityIds = facilities
      .filter((f: any) => f.isDefault && f.active)
      .map((f: any) => f.id);
    const allFacilityIds = [...new Set([...defaultFacilityIds, ...newRoomType.selectedFacilityIds])];
    addRoomTypeMutation.mutate(
      {
        name: newRoomType.name,
        beds: newRoomType.beds,
        maxAdults: newRoomType.maxAdults,
        maxChildren: newRoomType.maxChildren,
        basePrice: String(newRoomType.price),
        size: newRoomType.size || "",
        facilityIds: JSON.stringify(allFacilityIds),
      },
      {
        onSuccess: () => {
          setIsRoomTypeDialogOpen(false);
          setNewRoomType({ name: "", beds: "", capacity: 2, price: 0, size: "", selectedFacilityIds: [] });
          toast({ title: "Room Type Added", description: `${newRoomType.name} has been added to your configuration.` });
        },
      }
    );
  };

  const handleDeleteRoomType = (id: number) => {
    deleteRoomTypeMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: "Room Type Removed", description: "The room type has been removed from configuration." });
      },
    });
  };

  const handleSaveEditRoomType = () => {
    if (!editingRoomType) return;
    const defaultFacilityIds = facilities
      .filter((f: any) => f.isDefault && f.active)
      .map((f: any) => f.id);
    const allFacilityIds = [...new Set([...defaultFacilityIds, ...(editingRoomType.selectedFacilityIds || [])])];
    updateRoomTypeMutation.mutate(
      {
        id: editingRoomType.id,
        name: editingRoomType.name,
        beds: editingRoomType.beds,
        maxAdults: editingRoomType.maxAdults,
        maxChildren: editingRoomType.maxChildren,
        basePrice: String(editingRoomType.basePrice),
        size: editingRoomType.size || "",
        facilityIds: JSON.stringify(allFacilityIds),
      },
      {
        onSuccess: () => {
          setIsEditRoomTypeDialogOpen(false);
          setEditingRoomType(null);
          toast({ title: "Room Type Updated", description: `${editingRoomType.name} has been updated.` });
        },
      }
    );
  };

  const handleAddTax = () => {
    const updatedTaxes = [...taxes, { id: Date.now(), ...newTax }];
    saveSettingMutation.mutate(
      { taxes: JSON.stringify(updatedTaxes) },
      {
        onSuccess: () => {
          setIsTaxDialogOpen(false);
          setNewTax({ name: "", rate: 0, type: "Percentage", appliedTo: "All" });
          toast({ title: "Tax Rule Added", description: `${newTax.name} has been added to tax rules.` });
        },
      }
    );
  };

  const handleDeleteTax = (id: number) => {
    const updatedTaxes = taxes.filter((t: any) => t.id !== id);
    saveSettingMutation.mutate(
      { taxes: JSON.stringify(updatedTaxes) },
      {
        onSuccess: () => {
          toast({ title: "Tax Rule Removed", description: "The tax rule has been removed." });
        },
      }
    );
  };

  const handleAddPriceRule = () => {
    const updatedRules = [...priceRules, { id: Date.now(), ...newPriceRule }];
    saveSettingMutation.mutate(
      { priceRules: JSON.stringify(updatedRules) },
      {
        onSuccess: () => {
          setIsPriceRuleDialogOpen(false);
          setNewPriceRule({ roomTypeId: "", startDate: "", endDate: "", price: 0 });
          toast({ title: "Price Rule Added", description: "Seasonal pricing rule has been activated." });
        },
      }
    );
  };

  const handleDeletePriceRule = (id: number) => {
    const updatedRules = priceRules.filter((pr: any) => pr.id !== id);
    saveSettingMutation.mutate(
      { priceRules: JSON.stringify(updatedRules) },
      {
        onSuccess: () => {
          toast({ title: "Price Rule Removed", description: "Pricing rule has been deactivated." });
        },
      }
    );
  };

  const handleAddFacility = () => {
    addFacilityMutation.mutate(
      {
        name: newFacility.name,
        description: "",
        price: newFacility.isFree ? "0" : String(newFacility.price),
        unit: newFacility.isFree ? "item" : newFacility.unit,
        isFree: newFacility.isFree,
        isDefault: newFacility.isDefault,
        taxable: newFacility.taxable,
        active: newFacility.active,
      },
      {
        onSuccess: () => {
          setIsFacilityDialogOpen(false);
          setNewFacility({ name: "", price: 0, unit: "item", isFree: true, isDefault: false, taxable: false, active: true });
          toast({ title: "Facility Added", description: `${newFacility.name} is now available for booking.` });
        },
      }
    );
  };

  const openEditFacility = (facility: any) => {
    setEditFacility({
      id: facility.id,
      name: facility.name,
      price: parseFloat(facility.price) || 0,
      unit: facility.unit || "item",
      isFree: facility.isFree,
      isDefault: facility.isDefault,
      taxable: facility.taxable || false,
      active: facility.active
    });
    setIsEditFacilityDialogOpen(true);
  };

  const handleSaveEditFacility = () => {
    if (!editFacility) return;
    updateFacilityMutation.mutate(
      {
        id: editFacility.id,
        data: {
          name: editFacility.name,
          price: editFacility.isFree ? "0" : String(editFacility.price),
          unit: editFacility.isFree ? "item" : editFacility.unit,
          isFree: editFacility.isFree,
          isDefault: editFacility.isDefault,
          taxable: editFacility.taxable,
          active: editFacility.active,
        }
      },
      {
        onSuccess: () => {
          setIsEditFacilityDialogOpen(false);
          setEditFacility(null);
          toast({ title: "Facility Updated", description: `${editFacility.name} has been updated.` });
        }
      }
    );
  };

  const handleDeleteFacility = (id: number) => {
    deleteFacilityMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: "Facility Removed", description: "The facility has been removed from options." });
      },
    });
  };

  const toggleFacility = (id: number) => {
    const facility = facilities.find((f: any) => f.id === id);
    if (facility) {
      updateFacilityMutation.mutate({ id, data: { active: !facility.active } });
    }
  };



  const handleSaveCurrency = (newCurrency: string) => {
    saveSettingMutation.mutate(
      { currency: newCurrency },
      {
        onSuccess: () => {
          toast({ title: "Settings Saved", description: "Currency has been updated." });
        },
      }
    );
  };

  const handleSaveCheckInOutTimes = () => {
    saveSettingMutation.mutate(
      { checkInTime: localCheckInTime, checkOutTime: localCheckOutTime },
      {
        onSuccess: () => {
          toast({ title: "Settings Saved", description: "Check-in/Check-out times have been updated." });
        },
      }
    );
  };

  const handleSaveAgeRules = () => {
    saveSettingMutation.mutate(
      { ageRuleAdult: String(localAgeAdult), ageRuleChild: String(localAgeChild), ageRuleInfant: String(localAgeInfant) },
      {
        onSuccess: () => {
          toast({ title: "Settings Saved", description: "Age classification rules have been updated." });
        },
      }
    );
  };

  const handleSaveWeekendDays = (days: number[]) => {
    setLocalWeekendDays(days);
    saveSettingMutation.mutate(
      { weekendDays: JSON.stringify(days) },
      {
        onSuccess: () => {
          toast({ title: "Settings Saved", description: "Weekend configuration has been updated." });
        },
      }
    );
  };

  const handleSaveInvoiceSettings = (newSettings: any) => {
    saveSettingMutation.mutate(
      { invoiceSettings: JSON.stringify(newSettings) },
      {
        onSuccess: () => {
          toast({ title: "Invoice Settings Saved", description: "Invoice configuration has been updated." });
        },
      }
    );
  };

  const handleSaveWelfareSettings = (newSettings: any) => {
    saveSettingMutation.mutate(
      { welfareSettings: JSON.stringify(newSettings) },
      {
        onSuccess: () => {
          toast({ title: "HR Settings Saved", description: "Welfare settings have been updated." });
        },
      }
    );
  };

  const handleSaveSalarySchedulerSettings = async (enabled: boolean, day: number) => {
    try {
      await apiRequest("POST", "/api/salary-scheduler/settings", { enabled, dayOfMonth: day });
      queryClient.invalidateQueries({ queryKey: ['/api/salary-scheduler/settings'] });
      toast({ title: "Salary Scheduler Updated", description: enabled ? `Scheduler enabled. Runs on day ${day} of each month.` : "Scheduler disabled." });
    } catch {
      toast({ title: "Error", description: "Failed to update salary scheduler settings.", variant: "destructive" });
    }
  };

  const handleManualSalaryGeneration = async (overrideMonth?: string) => {
    const month = overrideMonth || salaryManualMonth;
    if (!month) return;
    setIsGeneratingSalaries(true);
    try {
      const res = await apiRequest("POST", "/api/salary-scheduler/run", { month });
      const result = await res.json();
      queryClient.invalidateQueries({ queryKey: ['/api/salary-scheduler/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salaries'] });
      toast({
        title: result.success ? "Salaries Generated" : "Generation Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate salaries.", variant: "destructive" });
    } finally {
      setIsGeneratingSalaries(false);
    }
  };

  const isLoading = roomTypesLoading || categoriesLoading || facilitiesLoading || settingsLoading;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading settings...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-serif text-primary">Configuration & Settings</h2>
          <p className="text-muted-foreground">Manage global settings, pricing rules, and categories for this branch.</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <div className="w-full overflow-x-auto -mx-1 px-1">
            <TabsList className="inline-flex w-max gap-1 h-auto flex-nowrap p-1">
              <TabsTrigger value="general" className="text-xs sm:text-sm whitespace-nowrap">General</TabsTrigger>
              <TabsTrigger value="roomtypes" className="text-xs sm:text-sm whitespace-nowrap">Room Types</TabsTrigger>
              <TabsTrigger value="createroom" className="text-xs sm:text-sm whitespace-nowrap">Create Room</TabsTrigger>
              <TabsTrigger value="categories" className="text-xs sm:text-sm whitespace-nowrap">Categories</TabsTrigger>
              <TabsTrigger value="facilities" className="text-xs sm:text-sm whitespace-nowrap">Facilities</TabsTrigger>
              <TabsTrigger value="hr" className="text-xs sm:text-sm whitespace-nowrap">HR & Payroll</TabsTrigger>

              <TabsTrigger value="communication" className="text-xs sm:text-sm whitespace-nowrap">Communication</TabsTrigger>
              <TabsTrigger value="invoice" className="text-xs sm:text-sm whitespace-nowrap">Invoice & Taxes</TabsTrigger>
              <TabsTrigger value="archival" className="text-xs sm:text-sm whitespace-nowrap">Archival</TabsTrigger>
              <TabsTrigger value="devtools" className="text-xs sm:text-sm whitespace-nowrap text-amber-600">Dev Tools</TabsTrigger>
            </TabsList>
          </div>

          {/* General Settings */}
          <TabsContent value="general" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Configuration</CardTitle>
                <CardDescription>Set the base currency and regional formats.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                  <div className="space-y-2">
                    <Label>Base Currency</Label>
                    <Select value={currency} onValueChange={(val) => handleSaveCurrency(val)}>
                      <SelectTrigger data-testid="select-currency">
                        <SelectValue placeholder="Select Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                        <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                        <SelectItem value="INR">INR (₹) - Indian Rupee</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">This currency will be used for all transactions and reports.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select defaultValue="utc-5">
                      <SelectTrigger data-testid="select-timezone">
                        <SelectValue placeholder="Select Timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utc-5">Eastern Time (US & Canada)</SelectItem>
                        <SelectItem value="utc+0">UTC</SelectItem>
                        <SelectItem value="utc+5.5">IST (India Standard Time)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="pt-4">
                  <Button onClick={() => toast({ title: "Settings Saved", description: "General settings have been saved." })}>
                    <Save className="mr-2 h-4 w-4" />
                    Save General Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Check-in & Check-out Time
                </CardTitle>
                <CardDescription>Standard check-in and check-out times. Night calculations will be based on these times.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                  <div className="space-y-2">
                    <Label>Check-in Time</Label>
                    <Select value={localCheckInTime} onValueChange={(val) => setLocalCheckInTime(val)}>
                      <SelectTrigger data-testid="select-checkin-time">
                        <SelectValue placeholder="Select Check-in Time" />
                      </SelectTrigger>
                      <SelectContent>
                        {HOUR_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Check-out Time</Label>
                    <Select value={localCheckOutTime} onValueChange={(val) => setLocalCheckOutTime(val)}>
                      <SelectTrigger data-testid="select-checkout-time">
                        <SelectValue placeholder="Select Check-out Time" />
                      </SelectTrigger>
                      <SelectContent>
                        {HOUR_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">These times define when guests can check in and must check out. Early check-in or late check-out may incur additional charges.</p>
                <div className="pt-2">
                  <Button onClick={handleSaveCheckInOutTimes} data-testid="button-save-checkin-checkout">
                    <Save className="mr-2 h-4 w-4" />
                    Save Times
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Guest Age Classification
                </CardTitle>
                <CardDescription>Define age thresholds to classify guests as Adult, Child, or Infant during bookings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="space-y-2 p-4 border rounded-lg bg-blue-50/50">
                    <Label className="text-sm font-semibold text-blue-700">Adult</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={99}
                        value={localAgeAdult}
                        onChange={(e) => setLocalAgeAdult(parseInt(e.target.value) || 13)}
                        className="w-20"
                        data-testid="input-age-adult"
                      />
                      <span className="text-sm text-muted-foreground">years & above</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{localAgeAdult}+ years old</p>
                  </div>
                  <div className="space-y-2 p-4 border rounded-lg bg-amber-50/50">
                    <Label className="text-sm font-semibold text-amber-700">Child</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={98}
                        value={localAgeChild}
                        onChange={(e) => setLocalAgeChild(parseInt(e.target.value) || 3)}
                        className="w-20"
                        data-testid="input-age-child"
                      />
                      <span className="text-sm text-muted-foreground">to {localAgeAdult - 1} years</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{localAgeChild} – {localAgeAdult - 1} years old</p>
                  </div>
                  <div className="space-y-2 p-4 border rounded-lg bg-green-50/50">
                    <Label className="text-sm font-semibold text-green-700">Infant</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">0 to</span>
                      <Input
                        type="number"
                        min={0}
                        max={97}
                        value={localAgeInfant}
                        onChange={(e) => setLocalAgeInfant(parseInt(e.target.value) || 2)}
                        className="w-20"
                        data-testid="input-age-infant"
                      />
                      <span className="text-sm text-muted-foreground">years</span>
                    </div>
                    <p className="text-xs text-muted-foreground">0 – {localAgeInfant} years old</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">These rules are used to classify guests by age during booking. Infant age should be less than child age, and child age should be less than adult age.</p>
                <div className="pt-2">
                  <Button onClick={handleSaveAgeRules} data-testid="button-save-age-rules">
                    <Save className="mr-2 h-4 w-4" />
                    Save Age Rules
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Weekend Configuration
                </CardTitle>
                <CardDescription>Select which days of the week are considered weekends. This affects pricing (weekday vs weekend rates) and inventory operations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {DAY_NAMES.map((day) => {
                    const isSelected = localWeekendDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          const newDays = isSelected
                            ? localWeekendDays.filter(d => d !== day.value)
                            : [...localWeekendDays, day.value].sort();
                          handleSaveWeekendDays(newDays);
                        }}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          isSelected
                            ? "bg-amber-100 border-amber-400 text-amber-800"
                            : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                        data-testid={`btn-weekend-${day.label.toLowerCase()}`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-amber-50"
                    onClick={() => handleSaveWeekendDays([5, 6])}
                    data-testid="btn-preset-fri-sat"
                  >
                    Preset: Fri – Sat
                  </Badge>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-amber-50"
                    onClick={() => handleSaveWeekendDays([0, 6])}
                    data-testid="btn-preset-sat-sun"
                  >
                    Preset: Sat – Sun
                  </Badge>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-amber-50"
                    onClick={() => handleSaveWeekendDays([4, 5])}
                    data-testid="btn-preset-thu-fri"
                  >
                    Preset: Thu – Fri
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently selected: {localWeekendDays.length === 0 ? "None" : localWeekendDays.map(d => DAY_NAMES.find(n => n.value === d)?.label).join(", ")}.
                  Weekend rates from the pricing calendar will apply on these days.
                </p>
              </CardContent>
            </Card>

            {/* Discounts & Offers Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Discounts & Offers Configuration</CardTitle>
                <CardDescription>Manage discount codes and role-based limits for manual discounts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                
                {/* Role-Based Limits */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" /> Role-Based Discount Limits
                  </h3>
                  <div className="grid gap-4 border p-4 rounded-lg bg-muted/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                      <div className="space-y-1">
                        <Label className="text-base">Manager Limit</Label>
                        <p className="text-sm text-muted-foreground">Maximum discount a Manager can apply manually.</p>
                      </div>
                      <div className="flex items-center gap-2">
                         <Input type="number" min={0} max={100} value={localManagerLimit} onChange={(e) => setLocalManagerLimit(parseInt(e.target.value) || 0)} className="w-24" data-testid="input-manager-limit" />
                         <span className="text-sm font-medium">%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2 border-t">
                      <div className="space-y-1">
                        <Label className="text-base">Receptionist Limit</Label>
                        <p className="text-sm text-muted-foreground">Maximum discount a Receptionist can apply manually.</p>
                      </div>
                      <div className="flex items-center gap-2">
                         <Input type="number" min={0} max={100} value={localReceptionistLimit} onChange={(e) => setLocalReceptionistLimit(parseInt(e.target.value) || 0)} className="w-24" data-testid="input-receptionist-limit" />
                         <span className="text-sm font-medium">%</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2">Note: Owners always have unlimited discount authority.</p>
                    <div className="pt-2">
                      <Button onClick={() => {
                        saveSettingMutation.mutate(
                          { discountLimitManager: String(localManagerLimit), discountLimitReceptionist: String(localReceptionistLimit) },
                          { onSuccess: () => toast({ title: "Saved", description: "Discount limits updated." }) }
                        );
                      }} data-testid="button-save-discount-limits">
                        <Save className="mr-2 h-4 w-4" />
                        Save Discount Limits
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Pre-defined Coupons */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <h3 className="text-lg font-medium flex items-center gap-2">
                       <Tags className="h-5 w-5" /> Active Coupons
                     </h3>
                     <Button size="sm" variant="outline" onClick={() => { setNewCoupon({ code: "", value: 0, type: "percentage", expiry: "" }); setIsCouponDialogOpen(true); }} data-testid="button-add-coupon">
                       <Plus className="h-4 w-4 mr-2" /> Add Coupon
                     </Button>
                   </div>
                   
                   <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Discount</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Expiry</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {coupons.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No coupons configured. Click "Add Coupon" to create one.</TableCell>
                          </TableRow>
                        )}
                        {coupons.map((coupon: any) => {
                          const isExpired = coupon.expiry && new Date(coupon.expiry) < new Date();
                          return (
                            <TableRow key={coupon.id} data-testid={`row-coupon-${coupon.id}`}>
                              <TableCell className="font-medium font-mono">{coupon.code}</TableCell>
                              <TableCell>{coupon.type === "percentage" ? `${coupon.value}%` : `${currency} ${coupon.value}`}</TableCell>
                              <TableCell>{coupon.type === "percentage" ? "Percentage" : "Fixed Amount"}</TableCell>
                              <TableCell>{coupon.expiry ? new Date(coupon.expiry).toLocaleDateString(undefined, { dateStyle: "medium" }) : "No Expiry"}</TableCell>
                              <TableCell>
                                {isExpired
                                  ? <Badge variant="destructive">Expired</Badge>
                                  : <Badge variant="default" className="bg-green-600">Active</Badge>
                                }
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    const updated = coupons.filter((c: any) => c.id !== coupon.id);
                                    saveSettingMutation.mutate(
                                      { coupons: JSON.stringify(updated) },
                                      { onSuccess: () => toast({ title: "Deleted", description: `Coupon "${coupon.code}" removed.` }) }
                                    );
                                  }}
                                  data-testid={`button-delete-coupon-${coupon.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                   </Table>
                </div>

              </CardContent>
            </Card>

            <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Coupon Code</DialogTitle>
                  <DialogDescription>Create a new discount coupon that can be applied during checkout.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Coupon Code</Label>
                    <Input
                      placeholder="e.g. WELCOME10"
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                      data-testid="input-coupon-code"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Discount Type</Label>
                      <Select value={newCoupon.type} onValueChange={(v) => setNewCoupon({ ...newCoupon, type: v as "percentage" | "fixed" })}>
                        <SelectTrigger data-testid="select-coupon-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount ({currency})</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Value</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          max={newCoupon.type === "percentage" ? 100 : undefined}
                          value={newCoupon.value || ""}
                          onChange={(e) => setNewCoupon({ ...newCoupon, value: parseFloat(e.target.value) || 0 })}
                          data-testid="input-coupon-value"
                        />
                        <span className="text-sm font-medium">{newCoupon.type === "percentage" ? "%" : currency}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Date (optional)</Label>
                    <Input
                      type="date"
                      value={newCoupon.expiry}
                      onChange={(e) => setNewCoupon({ ...newCoupon, expiry: e.target.value })}
                      data-testid="input-coupon-expiry"
                    />
                    <p className="text-xs text-muted-foreground">Leave empty for no expiry.</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCouponDialogOpen(false)}>Cancel</Button>
                  <Button
                    disabled={!newCoupon.code || newCoupon.value <= 0}
                    onClick={() => {
                      if (coupons.some((c: any) => c.code === newCoupon.code)) {
                        toast({ title: "Duplicate Code", description: "A coupon with this code already exists.", variant: "destructive" });
                        return;
                      }
                      const updated = [...coupons, { id: Date.now(), ...newCoupon }];
                      saveSettingMutation.mutate(
                        { coupons: JSON.stringify(updated) },
                        {
                          onSuccess: () => {
                            toast({ title: "Coupon Added", description: `Coupon "${newCoupon.code}" created successfully.` });
                            setIsCouponDialogOpen(false);
                          }
                        }
                      );
                    }}
                    data-testid="button-save-coupon"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Coupon
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Communication Settings */}
          <TabsContent value="communication" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Communication Templates</CardTitle>
                <CardDescription>Customize automated messages sent to guests via Email and WhatsApp.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="welcome" className="w-full">
                  <div className="w-full overflow-x-auto mb-4">
                    <TabsList className="inline-flex w-max gap-1 h-auto flex-nowrap p-1">
                      <TabsTrigger value="welcome" className="text-xs sm:text-sm whitespace-nowrap">Welcome</TabsTrigger>
                      <TabsTrigger value="invoice" className="text-xs sm:text-sm whitespace-nowrap">Invoice</TabsTrigger>
                      <TabsTrigger value="feedback" className="text-xs sm:text-sm whitespace-nowrap">Feedback</TabsTrigger>
                      <TabsTrigger value="promotional" className="text-xs sm:text-sm whitespace-nowrap">Promotional</TabsTrigger>
                    </TabsList>
                  </div>

                  {["welcome", "invoice", "feedback", "promotional"].map((category) => (
                    <TabsContent key={category} value={category} className="space-y-4">
                      <div className="grid gap-6">
                        {/* Email Template */}
                        <div className="space-y-2 border p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold flex items-center gap-2">
                              <Mail className="h-4 w-4" /> Email Template
                            </Label>
                            <Switch defaultChecked={true} />
                          </div>
                          <div className="space-y-2">
                             <Label className="text-xs text-muted-foreground">Subject Line</Label>
                             <Input 
                               defaultValue={
                                 category === "welcome" ? "Welcome to Our Hotel!" : 
                                 category === "invoice" ? "Your Invoice from Our Hotel" : 
                                 category === "feedback" ? "How was your stay?" : "Special Offer Just for You!"
                               } 
                             />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Message Body</Label>
                            <Textarea 
                              className="min-h-[120px]" 
                              defaultValue={
                                 category === "welcome" ? "Dear {GuestName},\n\nWe are delighted to welcome you to our hotel. Your reservation {BookingID} is confirmed.\n\nWarm regards,\nHotel Team" : 
                                 category === "invoice" ? "Dear {GuestName},\n\nPlease find attached the invoice for your recent stay. We hope you had a pleasant experience.\n\nBest regards,\nHotel Team" : 
                                 category === "feedback" ? "Dear {GuestName},\n\nThank you for staying with us! We would love to hear your thoughts on your recent visit.\n\nBest,\nHotel Team" : "Hello {GuestName},\n\nWe have an exclusive offer waiting for you! Book your next stay and get 20% off.\n\nCheers,\nHotel Team"
                               }
                            />
                            <p className="text-[10px] text-muted-foreground">Available variables: {'{GuestName}'}, {'{BookingID}'}, {'{CheckInDate}'}, {'{CheckOutDate}'}</p>
                          </div>
                        </div>

                        {/* WhatsApp Template */}
                        <div className="space-y-2 border p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                             <Label className="text-base font-semibold flex items-center gap-2">
                               <MessageCircle className="h-4 w-4" /> WhatsApp Template
                             </Label>
                             <Switch defaultChecked={category === "invoice" || category === "welcome"} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Message Text</Label>
                            <Textarea 
                              className="min-h-[80px]" 
                              defaultValue={
                                 category === "welcome" ? "Hi {GuestName}, welcome to our hotel! Your booking {BookingID} is confirmed. See you soon! 🏨" : 
                                 category === "invoice" ? "Hi {GuestName}, thank you for your stay. Here is your invoice link: {InvoiceLink}. Safe travels! ✈️" : 
                                 category === "feedback" ? "Hi {GuestName}, hope you enjoyed your stay! Rate us here: {FeedbackLink}. ⭐" : "Hey {GuestName}! 🌟 Get 20% off your next booking with code SAVE20. Book now!"
                               }
                            />
                             <p className="text-[10px] text-muted-foreground">Keep WhatsApp messages concise.</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
                <div className="pt-4 flex justify-end">
                   <Button>
                     <Save className="mr-2 h-4 w-4" />
                     Save Templates
                   </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoice & Tax Settings */}
          <TabsContent value="invoice" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Configuration</CardTitle>
                <CardDescription>Configure which items are taxable and automation preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Taxable Items</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          id="tax-room" 
                          checked={parsedInvoiceSettings.taxableItems.room}
                          onCheckedChange={(checked) => {
                            const updated = {
                              ...parsedInvoiceSettings, 
                              taxableItems: { ...parsedInvoiceSettings.taxableItems, room: !!checked }
                            };
                            handleSaveInvoiceSettings(updated);
                          }}
                        />
                        <div className="space-y-0.5">
                          <Label htmlFor="tax-room" className="text-base font-medium">Room Charges</Label>
                          <p className="text-xs text-muted-foreground">Apply tax to room rates and accommodation</p>
                        </div>
                      </div>
                      {parsedInvoiceSettings.taxableItems.room && (
                        <div className="flex items-center gap-2">
                           <Label htmlFor="room-tax-rate" className="text-xs whitespace-nowrap">Tax Rate %</Label>
                           <Input 
                             className="h-8 w-20" 
                             type="number" 
                             value={effectiveTaxRates.room} 
                             id="room-tax-rate"
                             onChange={(e) => {
                               setLocalTaxRates(prev => ({ ...(prev ?? parsedInvoiceSettings.taxRates), room: parseFloat(e.target.value) || 0 }));
                             }}
                           />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          id="tax-food" 
                          checked={parsedInvoiceSettings.taxableItems.food}
                          onCheckedChange={(checked) => {
                            const updated = {
                              ...parsedInvoiceSettings, 
                              taxableItems: { ...parsedInvoiceSettings.taxableItems, food: !!checked }
                            };
                            handleSaveInvoiceSettings(updated);
                          }}
                        />
                        <div className="space-y-0.5">
                          <Label htmlFor="tax-food" className="text-base font-medium">Food & Beverage</Label>
                          <p className="text-xs text-muted-foreground">Apply tax to restaurant and room service orders</p>
                        </div>
                      </div>
                      {parsedInvoiceSettings.taxableItems.food && (
                        <div className="flex items-center gap-2">
                           <Label htmlFor="food-tax-rate" className="text-xs whitespace-nowrap">Tax Rate %</Label>
                           <Input 
                             className="h-8 w-20" 
                             type="number" 
                             value={effectiveTaxRates.food} 
                             id="food-tax-rate"
                             onChange={(e) => {
                               setLocalTaxRates(prev => ({ ...(prev ?? parsedInvoiceSettings.taxRates), food: parseFloat(e.target.value) || 0 }));
                             }}
                           />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          id="tax-facility" 
                          checked={parsedInvoiceSettings.taxableItems.facility}
                          onCheckedChange={(checked) => {
                            const updated = {
                              ...parsedInvoiceSettings, 
                              taxableItems: { ...parsedInvoiceSettings.taxableItems, facility: !!checked }
                            };
                            handleSaveInvoiceSettings(updated);
                          }}
                        />
                        <div className="space-y-0.5">
                          <Label htmlFor="tax-facility" className="text-base font-medium">Facilities & Services</Label>
                          <p className="text-xs text-muted-foreground">Apply tax to spa, transport, and extra services</p>
                        </div>
                      </div>
                      {parsedInvoiceSettings.taxableItems.facility && (
                        <div className="flex items-center gap-2">
                           <Label htmlFor="facility-tax-rate" className="text-xs whitespace-nowrap">Tax Rate %</Label>
                           <Input 
                             className="h-8 w-20" 
                             type="number" 
                             value={effectiveTaxRates.facility} 
                             id="facility-tax-rate"
                             onChange={(e) => {
                               setLocalTaxRates(prev => ({ ...(prev ?? parsedInvoiceSettings.taxRates), facility: parseFloat(e.target.value) || 0 }));
                             }}
                           />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          id="tax-other" 
                          checked={parsedInvoiceSettings.taxableItems.other}
                          onCheckedChange={(checked) => {
                            const updated = {
                              ...parsedInvoiceSettings, 
                              taxableItems: { ...parsedInvoiceSettings.taxableItems, other: !!checked }
                            };
                            handleSaveInvoiceSettings(updated);
                          }}
                        />
                        <div className="space-y-0.5">
                          <Label htmlFor="tax-other" className="text-base font-medium">Other Charges</Label>
                          <p className="text-xs text-muted-foreground">Apply tax to miscellaneous items</p>
                        </div>
                      </div>
                      {parsedInvoiceSettings.taxableItems.other && (
                        <div className="flex items-center gap-2">
                           <Label htmlFor="other-tax-rate" className="text-xs whitespace-nowrap">Tax Rate %</Label>
                           <Input 
                             className="h-8 w-20" 
                             type="number" 
                             value={effectiveTaxRates.other} 
                             id="other-tax-rate"
                             onChange={(e) => {
                               setLocalTaxRates(prev => ({ ...(prev ?? parsedInvoiceSettings.taxRates), other: parseFloat(e.target.value) || 0 }));
                             }}
                           />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h3 className="text-lg font-medium">Automation</h3>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-Send Email</Label>
                        <p className="text-sm text-muted-foreground">Automatically email invoice to guest upon checkout.</p>
                      </div>
                      <Switch 
                        checked={parsedInvoiceSettings.autoSend.email}
                        onCheckedChange={(checked) => {
                          const updated = {
                            ...parsedInvoiceSettings, 
                            autoSend: { ...parsedInvoiceSettings.autoSend, email: checked }
                          };
                          handleSaveInvoiceSettings(updated);
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-Send WhatsApp</Label>
                        <p className="text-sm text-muted-foreground">Automatically send invoice via WhatsApp upon checkout.</p>
                      </div>
                      <Switch 
                        checked={parsedInvoiceSettings.autoSend.whatsapp}
                        onCheckedChange={(checked) => {
                          const updated = {
                            ...parsedInvoiceSettings, 
                            autoSend: { ...parsedInvoiceSettings.autoSend, whatsapp: checked }
                          };
                          handleSaveInvoiceSettings(updated);
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button onClick={() => {
                    const settingsToSave = {
                      ...parsedInvoiceSettings,
                      taxRates: effectiveTaxRates
                    };
                    handleSaveInvoiceSettings(settingsToSave);
                    setLocalTaxRates(null);
                  }}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Invoice Settings
                  </Button>
                </div>

              </CardContent>
            </Card>

            {/* Tax Reporting / Invoice Emails */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <CardTitle>Tax Reporting / Invoice Emails</CardTitle>
                </div>
                <CardDescription>Configure automated monthly tax invoice emails for auditors and owners.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Recipient Email Addresses</h3>
                  <p className="text-sm text-muted-foreground">Add email addresses that will receive the monthly tax invoice reports (e.g., hotel owner, auditor).</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter email address"
                      type="email"
                      value={taxEmailInput}
                      onChange={(e) => setTaxEmailInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && taxEmailInput.trim()) {
                          e.preventDefault();
                          const emails: string[] = (() => { try { return JSON.parse(settingsData?.taxReportingEmails || '[]'); } catch { return []; } })();
                          if (!emails.includes(taxEmailInput.trim())) {
                            const updated = [...emails, taxEmailInput.trim()];
                            apiRequest("POST", "/api/settings", { taxReportingEmails: JSON.stringify(updated) })
                              .then(() => { queryClient.invalidateQueries({ queryKey: ['/api/settings'] }); setTaxEmailInput(""); toast({ title: "Email Added" }); });
                          }
                        }
                      }}
                      data-testid="input-tax-email"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!taxEmailInput.trim()) return;
                        const emails: string[] = (() => { try { return JSON.parse(settingsData?.taxReportingEmails || '[]'); } catch { return []; } })();
                        if (!emails.includes(taxEmailInput.trim())) {
                          const updated = [...emails, taxEmailInput.trim()];
                          apiRequest("POST", "/api/settings", { taxReportingEmails: JSON.stringify(updated) })
                            .then(() => { queryClient.invalidateQueries({ queryKey: ['/api/settings'] }); setTaxEmailInput(""); toast({ title: "Email Added" }); });
                        }
                      }}
                      data-testid="button-add-tax-email"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const emails: string[] = (() => { try { return JSON.parse(settingsData?.taxReportingEmails || '[]'); } catch { return []; } })();
                      return emails.map((email, idx) => (
                        <Badge key={idx} variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
                          <Mail className="h-3 w-3" />
                          {email}
                          <button
                            className="ml-1 hover:text-red-500"
                            onClick={() => {
                              const updated = emails.filter((_, i) => i !== idx);
                              apiRequest("POST", "/api/settings", { taxReportingEmails: JSON.stringify(updated) })
                                .then(() => { queryClient.invalidateQueries({ queryKey: ['/api/settings'] }); toast({ title: "Email Removed" }); });
                            }}
                            data-testid={`button-remove-tax-email-${idx}`}
                          >
                            <XCircle className="h-3 w-3" />
                          </button>
                        </Badge>
                      ));
                    })()}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h3 className="text-lg font-medium">Monthly Scheduler</h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Monthly Tax Invoice Scheduler</Label>
                      <p className="text-sm text-muted-foreground">Automatically email all taxable invoices from the previous month.</p>
                    </div>
                    <Switch
                      checked={settingsData?.taxSchedulerEnabled === "true"}
                      onCheckedChange={(checked) => {
                        apiRequest("POST", "/api/settings", { taxSchedulerEnabled: checked ? "true" : "false" })
                          .then(() => {
                            queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
                            apiRequest("POST", "/api/tax-scheduler/refresh", {});
                            toast({ title: checked ? "Scheduler Enabled" : "Scheduler Disabled" });
                          });
                      }}
                      data-testid="switch-tax-scheduler"
                    />
                  </div>
                  {settingsData?.taxSchedulerEnabled === "true" && (
                    <div className="flex items-center gap-4 bg-muted/50 p-3 rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-sm">Run on Day of Month</Label>
                        <Select
                          value={settingsData?.taxSchedulerDay || "1"}
                          onValueChange={(val) => {
                            apiRequest("POST", "/api/settings", { taxSchedulerDay: val })
                              .then(() => {
                                queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
                                apiRequest("POST", "/api/tax-scheduler/refresh", {});
                                toast({ title: "Scheduler Day Updated", description: `Scheduler will run on the ${val}${val === "1" ? "st" : val === "2" ? "nd" : val === "3" ? "rd" : "th"} of every month.` });
                              });
                          }}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 28 }, (_, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>
                                {i + 1}{i + 1 === 1 ? "st" : i + 1 === 2 ? "nd" : i + 1 === 3 ? "rd" : "th"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-xs text-muted-foreground">The job collects invoices from the previous calendar month and emails them to configured recipients.</p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h3 className="text-lg font-medium">Send Tax Invoices Now</h3>
                  <p className="text-sm text-muted-foreground">Manually run the tax invoice job for a specific date range.</p>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">Start Date</Label>
                      <Input
                        type="date"
                        value={manualStartDate}
                        onChange={(e) => setManualStartDate(e.target.value)}
                        className="w-[160px]"
                        data-testid="input-manual-start-date"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">End Date</Label>
                      <Input
                        type="date"
                        value={manualEndDate}
                        onChange={(e) => setManualEndDate(e.target.value)}
                        className="w-[160px]"
                        data-testid="input-manual-end-date"
                      />
                    </div>
                    <Button
                      disabled={!manualStartDate || !manualEndDate || isSendingTaxInvoices}
                      onClick={async () => {
                        setIsSendingTaxInvoices(true);
                        try {
                          const res = await apiRequest("POST", "/api/tax-invoices/send", { startDate: manualStartDate, endDate: manualEndDate });
                          const result = await res.json();
                          queryClient.invalidateQueries({ queryKey: ['/api/invoice-scheduler-logs'] });
                          toast({
                            title: result.success ? "Tax Invoices Sent" : "Job Completed with Issues",
                            description: result.message,
                            variant: result.success ? "default" : "destructive",
                          });
                        } catch (err: any) {
                          toast({ title: "Error", description: err.message || "Failed to send tax invoices", variant: "destructive" });
                        } finally {
                          setIsSendingTaxInvoices(false);
                        }
                      }}
                      data-testid="button-send-tax-invoices"
                    >
                      {isSendingTaxInvoices ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Send Tax Invoices Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scheduler Logs */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <CardTitle>Scheduler Logs</CardTitle>
                </div>
                <CardDescription>History of automated and manual tax invoice jobs.</CardDescription>
              </CardHeader>
              <CardContent>
                {(!schedulerLogsData || schedulerLogsData.length === 0) ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No scheduler runs yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Invoices</TableHead>
                          <TableHead>Emails</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {schedulerLogsData.map((log: any) => (
                          <TableRow key={log.id} data-testid={`row-scheduler-log-${log.id}`}>
                            <TableCell className="text-xs whitespace-nowrap">
                              {log.createdAt ? new Date(log.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={log.jobType === "scheduled" ? "default" : "outline"} className="text-xs">
                                {log.jobType === "scheduled" ? "Auto" : "Manual"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {log.startDate} — {log.endDate}
                            </TableCell>
                            <TableCell className="text-center">{log.totalInvoices}</TableCell>
                            <TableCell className="text-center">{log.emailsSent}</TableCell>
                            <TableCell>
                              {log.status === "success" && <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>}
                              {log.status === "failed" && <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>}
                              {log.status === "running" && <Badge className="bg-blue-100 text-blue-700 border-blue-200"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Running</Badge>}
                              {log.status === "partial" && <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><AlertTriangle className="h-3 w-3 mr-1" />Partial</Badge>}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={log.errorMessage || ""}>
                              {log.errorMessage || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Room Types Configuration */}
          <TabsContent value="roomtypes" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Room Types Configuration</CardTitle>
                  <CardDescription>Define the types of rooms available in your hotel. These settings will appear when adding new rooms.</CardDescription>
                </div>
                <Dialog open={isRoomTypeDialogOpen} onOpenChange={setIsRoomTypeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Room Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Room Type</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Type Name</Label>
                        <Input 
                          placeholder="e.g. Garden Villa" 
                          value={newRoomType.name}
                          onChange={(e) => setNewRoomType({...newRoomType, name: e.target.value})}
                          data-testid="input-roomtype-name"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Bed Configuration</Label>
                          <Input 
                            placeholder="e.g. 1 Queen Bed" 
                            value={newRoomType.beds}
                            onChange={(e) => setNewRoomType({...newRoomType, beds: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Adults</Label>
                          <Input 
                            type="number" 
                            placeholder="2" 
                            value={newRoomType.maxAdults}
                            onChange={(e) => setNewRoomType({...newRoomType, maxAdults: parseInt(e.target.value) || 0})}
                            data-testid="input-roomtype-max-adults"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Max Children</Label>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            value={newRoomType.maxChildren}
                            onChange={(e) => setNewRoomType({...newRoomType, maxChildren: parseInt(e.target.value) || 0})}
                            data-testid="input-roomtype-max-children"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Default Base Price ({currency})</Label>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            value={newRoomType.price}
                            onChange={(e) => setNewRoomType({...newRoomType, price: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Room Size</Label>
                          <Input 
                            placeholder="e.g. 350 sq ft" 
                            value={newRoomType.size}
                            onChange={(e) => setNewRoomType({...newRoomType, size: e.target.value})}
                            data-testid="input-roomtype-size"
                          />
                        </div>
                      </div>
                      {facilities.filter((f: any) => f.active).length > 0 && (
                        <div className="space-y-3 pt-2">
                          <Label className="text-sm font-semibold">Facilities</Label>
                          {facilities.filter((f: any) => f.active && f.isDefault).length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Default (auto-included)</p>
                              <div className="space-y-1.5">
                                {facilities.filter((f: any) => f.active && f.isDefault).map((f: any) => (
                                  <div key={f.id} className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md">
                                    <Checkbox checked={true} disabled />
                                    <span className="text-sm">{f.name}</span>
                                    {f.isFree ? (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded ml-auto">Free</span>
                                    ) : (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded ml-auto">{currency} {Number(f.price).toFixed(2)}/{f.unit}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {facilities.filter((f: any) => f.active && !f.isDefault).length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Optional (select to include)</p>
                              <div className="space-y-1.5">
                                {facilities.filter((f: any) => f.active && !f.isDefault).map((f: any) => (
                                  <div key={f.id} className="flex items-center gap-2 px-3 py-2 border rounded-md">
                                    <Checkbox
                                      checked={newRoomType.selectedFacilityIds.includes(f.id)}
                                      onCheckedChange={(checked) => {
                                        const ids = checked
                                          ? [...newRoomType.selectedFacilityIds, f.id]
                                          : newRoomType.selectedFacilityIds.filter((id: number) => id !== f.id);
                                        setNewRoomType({...newRoomType, selectedFacilityIds: ids});
                                      }}
                                      data-testid={`checkbox-facility-${f.id}`}
                                    />
                                    <span className="text-sm">{f.name}</span>
                                    {f.isFree ? (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded ml-auto">Free</span>
                                    ) : (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded ml-auto">{currency} {Number(f.price).toFixed(2)}/{f.unit}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsRoomTypeDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddRoomType} data-testid="button-save-roomtype">Save Room Type</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Edit Room Type Dialog */}
                <Dialog open={isEditRoomTypeDialogOpen} onOpenChange={setIsEditRoomTypeDialogOpen}>
                  <DialogContent>
                    <DialogTitle>Edit Room Type</DialogTitle>
                    {editingRoomType && (
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-room-name">Room Type Name</Label>
                          <Input id="edit-room-name" value={editingRoomType.name || ""} onChange={(e) => setEditingRoomType({...editingRoomType, name: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="edit-beds">Number of Beds</Label>
                            <Input id="edit-beds" type="number" value={editingRoomType.beds || ""} onChange={(e) => setEditingRoomType({...editingRoomType, beds: parseInt(e.target.value) || 0})} />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="edit-price">Base Price ({currency})</Label>
                            <Input id="edit-price" type="number" value={Number(editingRoomType.basePrice) || 0} onChange={(e) => setEditingRoomType({...editingRoomType, basePrice: parseFloat(e.target.value) || 0})} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="edit-adults">Max Adults</Label>
                            <Input id="edit-adults" type="number" value={editingRoomType.maxAdults ?? ""} onChange={(e) => setEditingRoomType({...editingRoomType, maxAdults: parseInt(e.target.value) || 0})} />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="edit-children">Max Children</Label>
                            <Input id="edit-children" type="number" value={editingRoomType.maxChildren ?? ""} onChange={(e) => setEditingRoomType({...editingRoomType, maxChildren: parseInt(e.target.value) || 0})} />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-size">Room Size (sq ft)</Label>
                          <Input id="edit-size" value={editingRoomType.size || ""} onChange={(e) => setEditingRoomType({...editingRoomType, size: e.target.value})} />
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button variant="outline" onClick={() => { setIsEditRoomTypeDialogOpen(false); setEditingRoomType(null); }}>Cancel</Button>
                      <Button onClick={handleSaveEditRoomType} data-testid="button-save-edit-roomtype">Save Changes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type Name</TableHead>
                      <TableHead>Bedding</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Default Price</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Facilities</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roomTypes.map((rt: any) => (
                      <TableRow key={rt.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <BedDouble className="h-4 w-4 text-muted-foreground" />
                            {rt.name}
                          </div>
                        </TableCell>
                        <TableCell>{rt.beds}</TableCell>
                        <TableCell>{rt.maxAdults} Adults, {rt.maxChildren} Children</TableCell>
                        <TableCell>{currency} {Number(rt.basePrice)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{rt.size || "—"}</TableCell>
                        <TableCell>
                          {(() => {
                            const ids: number[] = (() => { try { return JSON.parse(rt.facilityIds || "[]"); } catch { return []; } })();
                            const count = ids.length;
                            return count > 0 ? (
                              <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">{count} facilities</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">None</span>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => { const facilityIds = (() => { try { return JSON.parse(rt.facilityIds || "[]"); } catch { return []; } })(); setEditingRoomType({...rt, selectedFacilityIds: facilityIds}); setIsEditRoomTypeDialogOpen(true); }} data-testid="button-edit-roomtype">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteRoomType(rt.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Room */}
          <TabsContent value="createroom" className="mt-6">
            <AdminRooms role="owner" />
          </TabsContent>

          {/* HR & Payroll Settings */}
          <TabsContent value="hr" className="mt-6 space-y-6">
             <Card>
               <CardHeader>
                 <CardTitle>HR & Payroll Configuration</CardTitle>
                 <CardDescription>Manage employee compensation, welfare funds, and compliance.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-6">
                 
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <div className="space-y-0.5">
                       <h3 className="font-medium text-lg">Welfare Fund Liability</h3>
                       <p className="text-sm text-muted-foreground">Configure owner's contribution to employee welfare fund.</p>
                     </div>
                     <Switch 
                        checked={welfareSettings.enabled}
                        onCheckedChange={(checked) => handleSaveWelfareSettings({...welfareSettings, enabled: checked})}
                     />
                   </div>
                   
                   {welfareSettings.enabled && (
                     <div className="grid gap-6 border p-4 rounded-lg bg-muted/20 animate-in fade-in zoom-in-95 duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                           <div className="space-y-2">
                             <Label>Contribution Type</Label>
                             <Select 
                               value={welfareSettings.contributionType}
                               onValueChange={(val) => handleSaveWelfareSettings({...welfareSettings, contributionType: val})}
                             >
                               <SelectTrigger>
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="Fixed">Fixed Amount</SelectItem>
                                 <SelectItem value="Percentage">Percentage of Salary</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                           <div className="space-y-2">
                              <Label>1st Year Contribution</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">{welfareSettings.contributionType === 'Fixed' ? currency : '%'}</span>
                                <Input 
                                  type="number" 
                                  className="pl-8"
                                  value={welfareSettings.firstYearAmount}
                                  onChange={(e) => handleSaveWelfareSettings({...welfareSettings, firstYearAmount: Number(e.target.value)})}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">Monthly contribution for employees &lt; 1 year tenure.</p>
                           </div>
                           <div className="space-y-2">
                              <Label>After 1 Year Contribution</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">{welfareSettings.contributionType === 'Fixed' ? currency : '%'}</span>
                                <Input 
                                  type="number" 
                                  className="pl-8"
                                  value={welfareSettings.afterFirstYearAmount}
                                  onChange={(e) => handleSaveWelfareSettings({...welfareSettings, afterFirstYearAmount: Number(e.target.value)})}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">Monthly contribution for employees &gt; 1 year tenure.</p>
                           </div>
                        </div>
                     </div>
                   )}
                 </div>

                 <div className="pt-4 flex justify-end">
                   <Button onClick={() => handleSaveWelfareSettings(welfareSettings)}>
                     <Save className="mr-2 h-4 w-4" />
                     Save HR Settings
                   </Button>
                 </div>
               </CardContent>
             </Card>

             <Card>
               <CardHeader>
                 <CardTitle>Monthly Salary Scheduler</CardTitle>
                 <CardDescription>Automatically generate salary records for all active staff at the beginning of each month.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-6">
                 <div className="flex items-center justify-between">
                   <div className="space-y-0.5">
                     <h3 className="font-medium">Enable Monthly Salary Auto-Generation</h3>
                     <p className="text-sm text-muted-foreground">Automatically create salary records for all active staff. Already generated salaries will not be duplicated.</p>
                   </div>
                   <Switch
                     checked={salarySchedulerEnabled}
                     onCheckedChange={(checked) => {
                       setSalarySchedulerEnabled(checked);
                       handleSaveSalarySchedulerSettings(checked, salarySchedulerDay);
                     }}
                     data-testid="switch-salary-scheduler"
                   />
                 </div>

                 {salarySchedulerEnabled && (
                   <div className="border p-4 rounded-lg bg-muted/20 animate-in fade-in zoom-in-95 duration-200">
                     <div className="flex items-center gap-4">
                       <div className="space-y-1">
                         <Label className="font-medium">Run on Day of Month</Label>
                         <Select
                           value={String(salarySchedulerDay)}
                           onValueChange={(val) => {
                             const day = Number(val);
                             setSalarySchedulerDay(day);
                             handleSaveSalarySchedulerSettings(true, day);
                           }}
                         >
                           <SelectTrigger className="w-24" data-testid="select-salary-scheduler-day">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             {Array.from({ length: 28 }, (_, i) => (
                               <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}{i === 0 ? "st" : i === 1 ? "nd" : i === 2 ? "rd" : "th"}</SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>
                       <p className="text-sm text-muted-foreground mt-5">The job generates salary records for the current month for all active staff at 1:00 AM.</p>
                     </div>
                   </div>
                 )}

                 <div className="pt-4 border-t space-y-3">
                   <h3 className="font-medium text-lg">Generate Salaries Now</h3>
                   <p className="text-sm text-muted-foreground">Manually generate salary records for a specific month. Staff with existing records for the month will be skipped.</p>
                   <div className="flex items-end gap-4">
                     <div className="space-y-1.5">
                       <Label>Month</Label>
                       <Input type="month" value={salaryManualMonth} onChange={e => setSalaryManualMonth(e.target.value)} className="w-48" data-testid="input-salary-manual-month" />
                     </div>
                     <Button
                       onClick={() => handleManualSalaryGeneration()}
                       disabled={isGeneratingSalaries || !salaryManualMonth}
                       data-testid="button-generate-salaries-now"
                     >
                       {isGeneratingSalaries ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                       Generate Salaries Now
                     </Button>
                   </div>
                 </div>
               </CardContent>
             </Card>

             <Card>
               <CardHeader>
                 <div className="flex items-center gap-2">
                   <FileText className="h-5 w-5 text-gray-600" />
                   <CardTitle>Salary Scheduler Logs</CardTitle>
                 </div>
                 <CardDescription>History of automated and manual salary generation jobs. Click a row to see per-employee details.</CardDescription>
               </CardHeader>
               <CardContent>
                 {(!salarySchedulerLogsData || salarySchedulerLogsData.length === 0) ? (
                   <p className="text-sm text-muted-foreground text-center py-6">No salary generation runs yet.</p>
                 ) : (
                   <div className="overflow-x-auto">
                     <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>Date</TableHead>
                           <TableHead>Type</TableHead>
                           <TableHead>Month</TableHead>
                           <TableHead className="text-center">Total Staff</TableHead>
                           <TableHead className="text-center">Generated</TableHead>
                           <TableHead className="text-center">Skipped</TableHead>
                           <TableHead>Status</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {salarySchedulerLogsData.map((log: any) => (
                           <TableRow
                             key={log.id}
                             className="cursor-pointer hover:bg-muted/50"
                             onClick={() => setViewingSalaryLog(log)}
                             data-testid={`row-salary-log-${log.id}`}
                           >
                             <TableCell className="text-xs whitespace-nowrap">
                               {log.createdAt ? new Date(log.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : "—"}
                             </TableCell>
                             <TableCell>
                               <Badge variant={log.jobType === "scheduled" ? "default" : "outline"} className="text-xs">
                                 {log.jobType === "scheduled" ? "Auto" : "Manual"}
                               </Badge>
                             </TableCell>
                             <TableCell className="font-mono text-sm">{log.month}</TableCell>
                             <TableCell className="text-center">{log.totalStaff}</TableCell>
                             <TableCell className="text-center font-medium text-green-700">{log.generated}</TableCell>
                             <TableCell className="text-center font-medium text-amber-600">{log.skipped}</TableCell>
                             <TableCell>
                               {log.status === "success" && <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>}
                               {log.status === "failed" && <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>}
                               {log.status === "running" && <Badge className="bg-blue-100 text-blue-700 border-blue-200"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Running</Badge>}
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                   </div>
                 )}
               </CardContent>
             </Card>

             <Dialog open={!!viewingSalaryLog} onOpenChange={(open) => !open && setViewingSalaryLog(null)}>
               <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                 <DialogHeader>
                   <DialogTitle>Salary Generation Details</DialogTitle>
                   <DialogDescription>
                     {viewingSalaryLog?.jobType === "scheduled" ? "Automated" : "Manual"} run for month {viewingSalaryLog?.month} &mdash; {viewingSalaryLog?.createdAt ? new Date(viewingSalaryLog.createdAt).toLocaleString() : ""}
                   </DialogDescription>
                 </DialogHeader>
                 {(() => {
                   if (!viewingSalaryLog?.details) return <p className="text-sm text-muted-foreground py-4">No detailed breakdown available for this run.</p>;
                   let parsed: any = {};
                   try { parsed = JSON.parse(viewingSalaryLog.details); } catch { return <p className="text-sm text-muted-foreground py-4">Could not parse details.</p>; }
                   return (
                     <div className="space-y-4 py-2">
                       {parsed.generated?.length > 0 && (
                         <div>
                           <h4 className="font-medium text-green-700 flex items-center gap-2 mb-2"><CheckCircle className="h-4 w-4" /> Generated ({parsed.generated.length})</h4>
                           <div className="border rounded-md">
                             <Table>
                               <TableHeader>
                                 <TableRow>
                                   <TableHead>Employee ID</TableHead>
                                   <TableHead>Name</TableHead>
                                 </TableRow>
                               </TableHeader>
                               <TableBody>
                                 {parsed.generated.map((g: any, i: number) => (
                                   <TableRow key={i}>
                                     <TableCell className="font-mono text-xs">{g.employeeId || "—"}</TableCell>
                                     <TableCell>{g.name}</TableCell>
                                   </TableRow>
                                 ))}
                               </TableBody>
                             </Table>
                           </div>
                         </div>
                       )}
                       {parsed.skipped?.length > 0 && (
                         <div>
                           <h4 className="font-medium text-amber-600 flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4" /> Skipped ({parsed.skipped.length})</h4>
                           <div className="border rounded-md">
                             <Table>
                               <TableHeader>
                                 <TableRow>
                                   <TableHead>Employee ID</TableHead>
                                   <TableHead>Name</TableHead>
                                   <TableHead>Reason</TableHead>
                                 </TableRow>
                               </TableHeader>
                               <TableBody>
                                 {parsed.skipped.map((s: any, i: number) => (
                                   <TableRow key={i}>
                                     <TableCell className="font-mono text-xs">{s.employeeId || "—"}</TableCell>
                                     <TableCell>{s.name}</TableCell>
                                     <TableCell className="text-xs text-muted-foreground">{s.reason}</TableCell>
                                   </TableRow>
                                 ))}
                               </TableBody>
                             </Table>
                           </div>
                         </div>
                       )}
                       {(!parsed.generated?.length && !parsed.skipped?.length) && (
                         <p className="text-sm text-muted-foreground">No staff were processed in this run.</p>
                       )}
                     </div>
                   );
                 })()}
                 {viewingSalaryLog?.errorMessage && (
                   <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2">
                     <p className="text-sm text-red-700"><span className="font-medium">Error:</span> {viewingSalaryLog.errorMessage}</p>
                   </div>
                 )}
                 <DialogFooter>
                   <Button variant="outline" onClick={() => setViewingSalaryLog(null)}>Close</Button>
                 </DialogFooter>
               </DialogContent>
             </Dialog>
          </TabsContent>

          {/* Categories */}
          <TabsContent value="categories" className="mt-6">
             <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Expense & Inventory Categories</CardTitle>
                  <CardDescription>Manage types, subtypes, and standard items.</CardDescription>
                </div>
                <Button size="sm" onClick={() => { setNewCategoryType(""); setNewCategoryTaxable(false); setNewCategorySubtypes([{ subtype: "", items: [""] }]); setAddCategoryDialogOpen(true); }} data-testid="button-add-category">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </CardHeader>
              <CardContent>
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Subtype</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Taxable</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const grouped: Record<string, any[]> = {};
                      categories.forEach((cat: any) => {
                        if (!grouped[cat.type]) grouped[cat.type] = [];
                        grouped[cat.type].push(cat);
                      });
                      return Object.entries(grouped).map(([type, items]) => (
                        items.map((cat: any, idx: number) => (
                          <TableRow key={cat.id}>
                            {idx === 0 ? (
                              <TableCell rowSpan={items.length} className="align-top font-semibold border-r">{type}</TableCell>
                            ) : null}
                            <TableCell>{cat.subtype}</TableCell>
                            <TableCell className="font-medium">{cat.item}</TableCell>
                            {idx === 0 ? (
                              <TableCell rowSpan={items.length} className="align-top border-l">
                                {cat.taxable && <Badge variant="secondary" className="bg-amber-100 text-amber-800">Taxable</Badge>}
                              </TableCell>
                            ) : null}
                            {idx === 0 ? (
                              <TableCell rowSpan={items.length} className="text-right align-top border-l space-x-1">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenEditCategory(type)} data-testid={`button-edit-category-${type}`}><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteCategoryType(type)} data-testid={`button-delete-category-${type}`}><Trash2 className="h-4 w-4" /></Button>
                              </TableCell>
                            ) : null}
                          </TableRow>
                        ))
                      ));
                    })()}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Dialog open={addCategoryDialogOpen} onOpenChange={setAddCategoryDialogOpen}>
              <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Category Type</Label>
                    <Input placeholder="e.g. Grocery" value={newCategoryType} onChange={(e) => setNewCategoryType(e.target.value)} data-testid="input-new-category-type" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="new-cat-taxable" checked={newCategoryTaxable} onCheckedChange={(checked) => setNewCategoryTaxable(checked === true)} />
                    <Label htmlFor="new-cat-taxable">Taxable Category (Requires Invoice)</Label>
                  </div>
                  <div className="space-y-3">
                    <Label>Subtypes & Items</Label>
                    {newCategorySubtypes.map((st, stIdx) => (
                      <div key={stIdx} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Input placeholder="Subtype name" value={st.subtype} onChange={(e) => { const u = [...newCategorySubtypes]; u[stIdx] = { ...u[stIdx], subtype: e.target.value }; setNewCategorySubtypes(u); }} className="flex-1 font-medium" data-testid={`input-new-subtype-${stIdx}`} />
                          {newCategorySubtypes.length > 1 && (
                            <Button variant="ghost" size="icon" className="text-red-500 shrink-0 h-8 w-8" onClick={() => setNewCategorySubtypes(newCategorySubtypes.filter((_, i) => i !== stIdx))} data-testid={`button-remove-subtype-${stIdx}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="pl-4 space-y-1">
                          {st.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex items-center gap-2">
                              <Input placeholder="Item name (optional)" value={item} onChange={(e) => { const u = [...newCategorySubtypes]; const items = [...u[stIdx].items]; items[itemIdx] = e.target.value; u[stIdx] = { ...u[stIdx], items }; setNewCategorySubtypes(u); }} className="flex-1 h-8 text-sm" data-testid={`input-new-item-${stIdx}-${itemIdx}`} />
                              {st.items.length > 1 && (
                                <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0 h-6 w-6" onClick={() => { const u = [...newCategorySubtypes]; u[stIdx] = { ...u[stIdx], items: u[stIdx].items.filter((_, i) => i !== itemIdx) }; setNewCategorySubtypes(u); }}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => { const u = [...newCategorySubtypes]; u[stIdx] = { ...u[stIdx], items: [...u[stIdx].items, ""] }; setNewCategorySubtypes(u); }}>
                            <Plus className="mr-1 h-3 w-3" /> Add Item
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setNewCategorySubtypes([...newCategorySubtypes, { subtype: "", items: [""] }])} data-testid="button-add-subtype">
                      <Plus className="mr-1 h-3 w-3" /> Add Subtype
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddCategory} disabled={bulkAddCategoryMutation.isPending} data-testid="button-save-category">
                    {bulkAddCategoryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={editCategoryDialogOpen} onOpenChange={setEditCategoryDialogOpen}>
              <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Category</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Category Type</Label>
                    <Input value={editCategoryType} onChange={(e) => setEditCategoryType(e.target.value)} data-testid="input-edit-category-type" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="edit-cat-taxable" checked={editCategoryTaxable} onCheckedChange={(checked) => setEditCategoryTaxable(checked === true)} />
                    <Label htmlFor="edit-cat-taxable">Taxable Category (Requires Invoice)</Label>
                  </div>
                  <div className="space-y-3">
                    <Label>Subtypes & Items</Label>
                    {editCategorySubtypes.map((st, stIdx) => (
                      <div key={stIdx} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Input placeholder="Subtype name" value={st.subtype} onChange={(e) => { const u = [...editCategorySubtypes]; u[stIdx] = { ...u[stIdx], subtype: e.target.value }; setEditCategorySubtypes(u); }} className="flex-1 font-medium" data-testid={`input-edit-subtype-${stIdx}`} />
                          {editCategorySubtypes.length > 1 && (
                            <Button variant="ghost" size="icon" className="text-red-500 shrink-0 h-8 w-8" onClick={() => setEditCategorySubtypes(editCategorySubtypes.filter((_, i) => i !== stIdx))} data-testid={`button-remove-edit-subtype-${stIdx}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="pl-4 space-y-1">
                          {st.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex items-center gap-2">
                              <Input placeholder="Item name (optional)" value={item.name} onChange={(e) => { const u = [...editCategorySubtypes]; const items = [...u[stIdx].items]; items[itemIdx] = { ...items[itemIdx], name: e.target.value }; u[stIdx] = { ...u[stIdx], items }; setEditCategorySubtypes(u); }} className="flex-1 h-8 text-sm" data-testid={`input-edit-item-${stIdx}-${itemIdx}`} />
                              {st.items.length > 1 && (
                                <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0 h-6 w-6" onClick={() => { const u = [...editCategorySubtypes]; u[stIdx] = { ...u[stIdx], items: u[stIdx].items.filter((_, i) => i !== itemIdx) }; setEditCategorySubtypes(u); }}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => { const u = [...editCategorySubtypes]; u[stIdx] = { ...u[stIdx], items: [...u[stIdx].items, { name: "" }] }; setEditCategorySubtypes(u); }}>
                            <Plus className="mr-1 h-3 w-3" /> Add Item
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setEditCategorySubtypes([...editCategorySubtypes, { subtype: "", items: [{ name: "" }] }])} data-testid="button-add-edit-subtype">
                      <Plus className="mr-1 h-3 w-3" /> Add Subtype
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleEditCategory} disabled={syncCategoryMutation.isPending} data-testid="button-save-edit-category">
                    {syncCategoryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          {/* Facilities */}
          <TabsContent value="facilities" className="mt-6">
             <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Facilities & Extras</CardTitle>
                  <CardDescription>Configure extra services available for booking.</CardDescription>
                </div>
                <Dialog open={isFacilityDialogOpen} onOpenChange={setIsFacilityDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Facility
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New Facility</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Facility / Service Name</Label>
                        <Input 
                          placeholder="e.g. Airport Pickup" 
                          value={newFacility.name}
                          onChange={(e) => setNewFacility({...newFacility, name: e.target.value})}
                          data-testid="input-facility-name"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={newFacility.isDefault}
                            onCheckedChange={(checked) => setNewFacility({...newFacility, isDefault: !!checked})}
                            data-testid="switch-facility-default"
                          />
                          <Label>Default (auto-included in all room types)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={!newFacility.isFree}
                            onCheckedChange={(checked) => setNewFacility({...newFacility, isFree: !checked})}
                            data-testid="switch-facility-paid"
                          />
                          <Label>Paid</Label>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="facility-taxable"
                          checked={newFacility.taxable}
                          onCheckedChange={(checked) => setNewFacility({...newFacility, taxable: !!checked})}
                          data-testid="checkbox-facility-taxable"
                        />
                        <Label htmlFor="facility-taxable">Taxable (tax will be applied during checkout)</Label>
                      </div>
                      {!newFacility.isFree && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Price ({currency})</Label>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              value={newFacility.price}
                              onChange={(e) => setNewFacility({...newFacility, price: parseFloat(e.target.value)})}
                              data-testid="input-facility-price"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Unit</Label>
                            <Select 
                              value={newFacility.unit}
                              onValueChange={(val) => setNewFacility({...newFacility, unit: val})}
                            >
                              <SelectTrigger data-testid="select-facility-unit">
                                <SelectValue placeholder="Select Unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="item">Per Item</SelectItem>
                                <SelectItem value="person">Per Person</SelectItem>
                                <SelectItem value="night">Per Night</SelectItem>
                                <SelectItem value="stay">Per Stay</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 pt-2">
                         <Switch 
                            checked={newFacility.active}
                            onCheckedChange={(checked) => setNewFacility({...newFacility, active: !!checked})}
                            data-testid="switch-facility-active"
                         />
                         <Label>Active (Available for booking)</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsFacilityDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddFacility} data-testid="button-save-facility">Save Facility</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {facilities.map((facility: any) => (
                    <div key={facility.id} className="border rounded-lg p-4 flex items-center justify-between" data-testid={`card-facility-${facility.id}`}>
                       <div className="flex items-start gap-3">
                         <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-1">
                           <Sparkles className="h-4 w-4" />
                         </div>
                         <div>
                           <div className="flex items-center gap-2">
                             <h4 className="font-bold">{facility.name}</h4>
                             {facility.isDefault && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">Default</span>}
                             {facility.isFree ? (
                               <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">Free</span>
                             ) : (
                               <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">Paid</span>
                             )}
                             {facility.taxable && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">Taxable</span>}
                           </div>
                           <p className="text-sm text-muted-foreground">
                             {facility.isFree ? "Complimentary" : `${currency} ${Number(facility.price).toFixed(2)} / ${facility.unit}`}
                           </p>
                         </div>
                       </div>
                       <div className="flex items-center gap-2">
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEditFacility(facility)} data-testid={`button-edit-facility-${facility.id}`}>
                           <Pencil className="h-4 w-4" />
                         </Button>
                         <Switch 
                            checked={facility.active} 
                            onCheckedChange={() => toggleFacility(facility.id)}
                         />
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => handleDeleteFacility(facility.id)}>
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                    </div>
                  ))}
                  
                  {facilities.length === 0 && (
                    <div className="col-span-full py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                      No facilities configured. Add services like Extra Bed, Airport Transfer, etc.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Dialog open={isEditFacilityDialogOpen} onOpenChange={setIsEditFacilityDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Edit Facility</DialogTitle>
                  <DialogDescription>Update facility details.</DialogDescription>
                </DialogHeader>
                {editFacility && (
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Facility Name</Label>
                      <Input value={editFacility.name} onChange={(e) => setEditFacility({...editFacility, name: e.target.value})} data-testid="input-edit-facility-name" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch checked={editFacility.isDefault} onCheckedChange={(checked) => setEditFacility({...editFacility, isDefault: !!checked})} data-testid="switch-edit-facility-default" />
                        <Label>Default (auto-included)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch checked={!editFacility.isFree} onCheckedChange={(checked) => setEditFacility({...editFacility, isFree: !checked})} data-testid="switch-edit-facility-paid" />
                        <Label>Paid</Label>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="edit-facility-taxable" checked={editFacility.taxable} onCheckedChange={(checked) => setEditFacility({...editFacility, taxable: !!checked})} data-testid="checkbox-edit-facility-taxable" />
                      <Label htmlFor="edit-facility-taxable">Taxable (tax will be applied during checkout)</Label>
                    </div>
                    {!editFacility.isFree && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Price ({currency})</Label>
                          <Input type="number" placeholder="0.00" value={editFacility.price} onChange={(e) => setEditFacility({...editFacility, price: parseFloat(e.target.value)})} data-testid="input-edit-facility-price" />
                        </div>
                        <div className="space-y-2">
                          <Label>Unit</Label>
                          <Select value={editFacility.unit} onValueChange={(val) => setEditFacility({...editFacility, unit: val})}>
                            <SelectTrigger data-testid="select-edit-facility-unit"><SelectValue placeholder="Select Unit" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="item">Per Item</SelectItem>
                              <SelectItem value="person">Per Person</SelectItem>
                              <SelectItem value="night">Per Night</SelectItem>
                              <SelectItem value="stay">Per Stay</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch checked={editFacility.active} onCheckedChange={(checked) => setEditFacility({...editFacility, active: !!checked})} data-testid="switch-edit-facility-active" />
                      <Label>Active</Label>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditFacilityDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveEditFacility} data-testid="button-save-edit-facility">Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          {/* Archival */}
          <TabsContent value="archival" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Archive className="h-5 w-5 text-gray-500" />
                      Archived Customer Records
                    </CardTitle>
                    <CardDescription>Past bookings archived for record-keeping. Only the hotel owner can edit or delete archived records.</CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, booking ID, phone..."
                      value={archivalSearch}
                      onChange={(e) => setArchivalSearch(e.target.value)}
                      className="pl-9"
                      data-testid="input-archival-search"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredArchivedBookings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Archive className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">No archived records</p>
                    <p className="text-sm">Checked-out bookings can be archived from the Bookings page to keep it clean.</p>
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Booking ID</TableHead>
                          <TableHead>Guest</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Archived On</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredArchivedBookings.map((b: any) => (
                          <TableRow key={b.id} className="bg-gray-50/60 text-gray-500" data-testid={`row-archived-${b.id}`}>
                            <TableCell className="font-mono text-xs text-gray-400">{b.bookingId}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-600">{b.guestName} {b.guestLastName || ""}</span>
                                <span className="text-xs">{b.adults} Adult{b.adults !== 1 ? "s" : ""}{b.children > 0 ? `, ${b.children} Child${b.children !== 1 ? "ren" : ""}` : ""}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col text-xs">
                                {b.guestEmail && <span>{b.guestEmail}</span>}
                                {b.guestPhone && <span>{b.guestPhone}</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>Room {getRoomNumber(b.roomId)}</span>
                                <span className="text-xs">{getRoomTypeName(b.roomTypeId)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col text-xs">
                                <span>In: {b.checkIn}</span>
                                <span>Out: {b.checkOut}</span>
                                <span>{b.nights} night{b.nights !== 1 ? "s" : ""}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-600">{currency} {parseFloat(b.totalAmount || "0").toFixed(2)}</span>
                                {parseFloat(b.advanceAmount || "0") > 0 && (
                                  <span className="text-xs">Advance: {currency} {parseFloat(b.advanceAmount).toFixed(2)}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              {b.archivedAt ? new Date(b.archivedAt).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-500" title="View Details" onClick={() => setViewingArchived(b)} data-testid={`button-view-archived-${b.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-green-600" title="Restore to Bookings" onClick={() => unarchiveBookingMutation.mutate(b.id)} data-testid={`button-unarchive-${b.id}`}>
                                  <ArchiveRestore className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" title="Delete Permanently" data-testid={`button-delete-archived-${b.id}`}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Archived Record?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the booking record for {b.guestName} {b.guestLastName || ""} (#{b.bookingId}). This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteArchivedBookingMutation.mutate(b.id)} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <div className="mt-4 text-xs text-muted-foreground">
                  Total archived records: {filteredArchivedBookings.length}
                </div>
              </CardContent>
            </Card>

            <Dialog open={!!viewingArchived} onOpenChange={(open) => !open && setViewingArchived(null)}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-gray-600">Archived Booking Details</DialogTitle>
                  <DialogDescription>Booking #{viewingArchived?.bookingId}</DialogDescription>
                </DialogHeader>
                {viewingArchived && (
                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Guest Name</Label>
                        <p className="font-medium">{viewingArchived.guestName} {viewingArchived.guestLastName || ""}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Room</Label>
                        <p className="font-medium">Room {getRoomNumber(viewingArchived.roomId)} — {getRoomTypeName(viewingArchived.roomTypeId)}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <p>{viewingArchived.guestEmail || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Phone</Label>
                        <p>{viewingArchived.guestPhone || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Check-in</Label>
                        <p>{viewingArchived.checkIn}{viewingArchived.checkedInAt ? ` (${new Date(viewingArchived.checkedInAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })})` : ""}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Check-out</Label>
                        <p>{viewingArchived.checkOut}{viewingArchived.checkedOutAt ? ` (${new Date(viewingArchived.checkedOutAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })})` : ""}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Nights</Label>
                        <p>{viewingArchived.nights}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Guests</Label>
                        <p>{viewingArchived.adults} Adult{viewingArchived.adults !== 1 ? "s" : ""}{viewingArchived.children > 0 ? `, ${viewingArchived.children} Child${viewingArchived.children !== 1 ? "ren" : ""}` : ""}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Total Amount</Label>
                        <p className="font-medium">{currency} {parseFloat(viewingArchived.totalAmount || "0").toFixed(2)}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Payment Method</Label>
                        <p>{viewingArchived.paymentMethod || "—"}</p>
                      </div>
                      {viewingArchived.notes && (
                        <div className="col-span-2">
                          <Label className="text-xs text-muted-foreground">Notes</Label>
                          <p className="text-muted-foreground">{viewingArchived.notes}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-xs text-muted-foreground">Booked On</Label>
                        <p>{viewingArchived.createdAt ? new Date(viewingArchived.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Archived On</Label>
                        <p>{viewingArchived.archivedAt ? new Date(viewingArchived.archivedAt).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-500" />
                      Archived Staff Records
                    </CardTitle>
                    <CardDescription>Deactivated staff members are archived here. You can reactivate them to move them back to Staff Management.</CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, employee ID, role..."
                      value={staffArchivalSearch}
                      onChange={(e) => setStaffArchivalSearch(e.target.value)}
                      className="pl-9"
                      data-testid="input-staff-archival-search"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const inactiveStaff = (allStaffData || []).filter((s: any) => s.status === "Inactive");
                  const filteredStaff = inactiveStaff.filter((s: any) => {
                    if (!staffArchivalSearch.trim()) return true;
                    const q = staffArchivalSearch.toLowerCase().trim();
                    return (
                      (s.firstName || "").toLowerCase().includes(q) ||
                      (s.lastName || "").toLowerCase().includes(q) ||
                      (s.employeeId || "").toLowerCase().includes(q) ||
                      (s.role || "").toLowerCase().includes(q) ||
                      (s.department || "").toLowerCase().includes(q) ||
                      (`${s.firstName} ${s.lastName}`).toLowerCase().includes(q)
                    );
                  });
                  if (filteredStaff.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="text-lg font-medium">No archived staff</p>
                        <p className="text-sm">Deactivated staff members will appear here.</p>
                      </div>
                    );
                  }
                  return (
                    <>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead>Employee ID</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Department</TableHead>
                              <TableHead>Salary</TableHead>
                              <TableHead>Joined</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredStaff.map((s: any) => (
                              <TableRow key={s.id} className="bg-gray-50/60 text-gray-500" data-testid={`row-archived-staff-${s.id}`}>
                                <TableCell className="font-mono text-xs">{s.employeeId || "—"}</TableCell>
                                <TableCell className="font-medium">{s.firstName} {s.lastName}</TableCell>
                                <TableCell>{s.role || "—"}</TableCell>
                                <TableCell>{s.department || "—"}</TableCell>
                                <TableCell>{currency} {s.salary || "0"}</TableCell>
                                <TableCell>{s.joined || "—"}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                                    onClick={() => activateStaffMutation.mutate(s.id)}
                                    disabled={activateStaffMutation.isPending}
                                    data-testid={`button-activate-staff-${s.id}`}
                                  >
                                    <ArchiveRestore className="h-3 w-3 mr-1" /> Reactivate
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="mt-4 text-xs text-muted-foreground">
                        Total archived staff: {filteredStaff.length}
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dev Tools */}
          <TabsContent value="devtools" className="mt-6">
            <Card className="border-amber-200 bg-amber-50/20">
              <CardHeader>
                <div className="flex items-center gap-2 text-amber-600">
                  <Terminal className="h-5 w-5" />
                  <CardTitle>Developer Tools</CardTitle>
                </div>
                <CardDescription>
                  Tools for simulating scheduled jobs and testing backend processes in this mock environment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-background flex items-center justify-between">
                    <div>
                      <h4 className="font-bold flex items-center gap-2">
                        <CalendarRange className="h-4 w-4 text-muted-foreground" />
                        Trigger Monthly Salary Generation
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Manually runs the scheduled job that normally runs on the 1st of every month. 
                        Generates pending salary records for all active staff for the current month.
                      </p>
                    </div>
                    <Button onClick={() => {
                      const now = new Date();
                      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                      handleManualSalaryGeneration(month);
                    }} className="bg-amber-600 hover:bg-amber-700">
                      <Play className="mr-2 h-4 w-4" />
                      Run Job
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}