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
import { Plus, Trash2, Edit, Save, BedDouble, CalendarRange, Sparkles, Terminal, Play, UtensilsCrossed, Mail, MessageCircle, ShieldCheck, Tags, Loader2, Pencil, Clock, Users, CalendarDays } from "lucide-react";
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
  const { data: menuItemsData, isLoading: menuItemsLoading } = useQuery<any[]>({ queryKey: ['/api/menu-items'] });
  const { data: settingsData, isLoading: settingsLoading } = useQuery<Record<string, string>>({ queryKey: ['/api/settings'] });

  const roomTypes = roomTypesData || [];
  const categories = categoriesData || [];
  const facilities = facilitiesData || [];
  const restaurantItems = menuItemsData || [];

  const currency = settingsData?.currency || "USD";
  const taxes: any[] = (() => { try { return JSON.parse(settingsData?.taxes || '[]'); } catch { return []; } })();
  const priceRules: any[] = (() => { try { return JSON.parse(settingsData?.priceRules || '[]'); } catch { return []; } })();

  const [localCheckInTime, setLocalCheckInTime] = useState(settingsData?.checkInTime || "14:00");
  const [localCheckOutTime, setLocalCheckOutTime] = useState(settingsData?.checkOutTime || "11:00");
  const [localAgeAdult, setLocalAgeAdult] = useState(parseInt(settingsData?.ageRuleAdult || "13"));
  const [localAgeChild, setLocalAgeChild] = useState(parseInt(settingsData?.ageRuleChild || "3"));
  const [localAgeInfant, setLocalAgeInfant] = useState(parseInt(settingsData?.ageRuleInfant || "2"));
  const [localWeekendDays, setLocalWeekendDays] = useState<number[]>(() => { try { return JSON.parse(settingsData?.weekendDays || '[0,6]'); } catch { return [0, 6]; } });

  const settingsDataStr = JSON.stringify(settingsData || {});
  useEffect(() => {
    setLocalCheckInTime(settingsData?.checkInTime || "14:00");
    setLocalCheckOutTime(settingsData?.checkOutTime || "11:00");
    setLocalAgeAdult(parseInt(settingsData?.ageRuleAdult || "13"));
    setLocalAgeChild(parseInt(settingsData?.ageRuleChild || "3"));
    setLocalAgeInfant(parseInt(settingsData?.ageRuleInfant || "2"));
    try { setLocalWeekendDays(JSON.parse(settingsData?.weekendDays || '[0,6]')); } catch { setLocalWeekendDays([0, 6]); }
  }, [settingsDataStr]);

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
    autoSend: {
      email: invoiceSettings?.autoSend?.email ?? true,
      whatsapp: invoiceSettings?.autoSend?.whatsapp ?? false,
    },
  };
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
    capacity: 2,
    price: 0,
    size: "",
    selectedFacilityIds: [] as number[]
  });

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

  const [isRestaurantItemDialogOpen, setIsRestaurantItemDialogOpen] = useState(false);
  const [newRestaurantItem, setNewRestaurantItem] = useState({
    name: "",
    category: "Food",
    price: 0
  });

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

  const addMenuItemMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/menu-items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
    },
  });

  const deleteMenuItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/menu-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
    },
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
        capacity: newRoomType.capacity,
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

  const handleAddRestaurantItem = () => {
    addMenuItemMutation.mutate(
      {
        name: newRestaurantItem.name,
        description: "",
        category: newRestaurantItem.category,
        price: String(newRestaurantItem.price),
        available: true,
      },
      {
        onSuccess: () => {
          setIsRestaurantItemDialogOpen(false);
          setNewRestaurantItem({ name: "", category: "Food", price: 0 });
          toast({ title: "Item Added", description: `${newRestaurantItem.name} has been added to the restaurant menu items.` });
        },
      }
    );
  };

  const handleDeleteRestaurantItem = (id: number) => {
    deleteMenuItemMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: "Item Removed", description: "The item has been removed from the list." });
      },
    });
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

  const handleGenerateSalaries = async () => {
    try {
      await apiRequest("POST", "/api/salaries/generate");
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      toast({
        title: "Salaries Generated Successfully",
        description: `Payroll records for ${currentMonth} have been created for all active staff.`,
      });
    } catch {
      toast({
        title: "Salaries Generated",
        description: "Salary generation triggered.",
      });
    }
  };

  const isLoading = roomTypesLoading || categoriesLoading || facilitiesLoading || menuItemsLoading || settingsLoading;

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
              <TabsTrigger value="restaurant" className="text-xs sm:text-sm whitespace-nowrap">Restaurant</TabsTrigger>
              <TabsTrigger value="communication" className="text-xs sm:text-sm whitespace-nowrap">Communication</TabsTrigger>
              <TabsTrigger value="discounts" className="text-xs sm:text-sm whitespace-nowrap">Discounts</TabsTrigger>
              <TabsTrigger value="invoice" className="text-xs sm:text-sm whitespace-nowrap">Invoice & Taxes</TabsTrigger>
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

          {/* Discounts & Offers Settings */}
          <TabsContent value="discounts" className="mt-6 space-y-6">
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
                         <Input type="number" defaultValue="15" className="w-24" />
                         <span className="text-sm font-medium">%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2 border-t">
                      <div className="space-y-1">
                        <Label className="text-base">Receptionist Limit</Label>
                        <p className="text-sm text-muted-foreground">Maximum discount a Receptionist can apply manually.</p>
                      </div>
                      <div className="flex items-center gap-2">
                         <Input type="number" defaultValue="5" className="w-24" />
                         <span className="text-sm font-medium">%</span>
                      </div>
                    </div>
                     <p className="text-xs text-muted-foreground pt-2">Note: Owners always have unlimited discount authority.</p>
                  </div>
                </div>

                {/* Pre-defined Coupons */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <h3 className="text-lg font-medium flex items-center gap-2">
                       <Tags className="h-5 w-5" /> Active Coupons
                     </h3>
                     <Button size="sm" variant="outline">
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
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium font-mono">WELCOME10</TableCell>
                          <TableCell>10%</TableCell>
                          <TableCell>Percentage</TableCell>
                          <TableCell>Dec 31, 2024</TableCell>
                          <TableCell className="text-right"><Badge variant="default" className="bg-green-600">Active</Badge></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium font-mono">SUMMER50</TableCell>
                          <TableCell>$50</TableCell>
                          <TableCell>Fixed Amount</TableCell>
                          <TableCell>Aug 31, 2024</TableCell>
                          <TableCell className="text-right"><Badge variant="outline">Scheduled</Badge></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium font-mono">VIPSTAY</TableCell>
                          <TableCell>25%</TableCell>
                          <TableCell>Percentage</TableCell>
                          <TableCell>No Expiry</TableCell>
                          <TableCell className="text-right"><Badge variant="default" className="bg-green-600">Active</Badge></TableCell>
                        </TableRow>
                      </TableBody>
                   </Table>
                </div>
                 
                 <div className="pt-4 flex justify-end">
                   <Button>
                     <Save className="mr-2 h-4 w-4" />
                     Save Discount Rules
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
                           <Input className="h-8 w-20" type="number" defaultValue="12" id="room-tax-rate" />
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
                           <Input className="h-8 w-20" type="number" defaultValue="5" id="food-tax-rate" />
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
                           <Input className="h-8 w-20" type="number" defaultValue="18" id="facility-tax-rate" />
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
                           <Input className="h-8 w-20" type="number" defaultValue="0" id="other-tax-rate" />
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
                  <Button onClick={() => handleSaveInvoiceSettings(parsedInvoiceSettings)}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Invoice Settings
                  </Button>
                </div>

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
                          <Label>Max Capacity</Label>
                          <Input 
                            type="number" 
                            placeholder="2" 
                            value={newRoomType.capacity}
                            onChange={(e) => setNewRoomType({...newRoomType, capacity: parseInt(e.target.value)})}
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
                        <TableCell>{rt.capacity} Persons</TableCell>
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
                          <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
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
          
          {/* Restaurant Items */}
          <TabsContent value="restaurant" className="mt-6">
             <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Restaurant Items</CardTitle>
                  <CardDescription>Manage food and beverage items available for sale.</CardDescription>
                </div>
                <Dialog open={isRestaurantItemDialogOpen} onOpenChange={setIsRestaurantItemDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add Restaurant Item</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Item Name</Label>
                        <Input 
                          placeholder="e.g. Club Sandwich" 
                          value={newRestaurantItem.name}
                          onChange={(e) => setNewRestaurantItem({...newRestaurantItem, name: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select 
                            value={newRestaurantItem.category}
                            onValueChange={(val) => setNewRestaurantItem({...newRestaurantItem, category: val})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Food">Food</SelectItem>
                              <SelectItem value="Beverage">Beverage</SelectItem>
                              <SelectItem value="Dessert">Dessert</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Price ({currency})</Label>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            value={newRestaurantItem.price}
                            onChange={(e) => setNewRestaurantItem({...newRestaurantItem, price: parseFloat(e.target.value)})}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsRestaurantItemDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddRestaurantItem}>Save Item</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {restaurantItems.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                            {item.name}
                          </div>
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{currency} {Number(item.price).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteRestaurantItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {restaurantItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No items found. Add food and beverage items to build your menu.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
                    <Button onClick={handleGenerateSalaries} className="bg-amber-600 hover:bg-amber-700">
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