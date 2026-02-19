import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Save, BedDouble, CalendarRange, Sparkles, Terminal, Play, UtensilsCrossed } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

// Default Room Types if nothing in local storage
const DEFAULT_ROOM_TYPES = [
  { id: "standard_king", name: "Standard King", beds: "1 King Bed", capacity: 2, price: 150, cots: true, infant: true },
  { id: "standard_twin", name: "Standard Twin", beds: "2 Twin Beds", capacity: 2, price: 140, cots: true, infant: true },
  { id: "deluxe_ocean", name: "Deluxe Ocean", beds: "1 King Bed", capacity: 2, price: 250, cots: true, infant: true, balcony: true },
  { id: "executive_suite", name: "Executive Suite", beds: "2 King Beds", capacity: 4, price: 450, cots: true, infant: true, living_area: true },
];

export default function AdminSettings() {
  const { toast } = useToast();
  const [currency, setCurrency] = useState("USD");
  const [taxes, setTaxes] = useState([
    { id: 1, name: "VAT", rate: 10, type: "Percentage", appliedTo: "All" },
    { id: 2, name: "City Tax", rate: 5, type: "Fixed", appliedTo: "Rooms" },
  ]);
  const [categories, setCategories] = useState([
    { id: 1, type: "Grocery", subtype: "Vegetables", item: "Onion" },
    { id: 2, type: "Grocery", subtype: "Vegetables", item: "Potato" },
    { id: 3, type: "Utility", subtype: "Cleaning", item: "Bleach" },
  ]);

  // Room Types State
  const [roomTypes, setRoomTypes] = useState(DEFAULT_ROOM_TYPES);
  const [isRoomTypeDialogOpen, setIsRoomTypeDialogOpen] = useState(false);
  const [newRoomType, setNewRoomType] = useState<any>({
    name: "",
    beds: "",
    capacity: 2,
    price: 0,
    cots: false,
    infant: false
  });

  // Tax Dialog State
  const [isTaxDialogOpen, setIsTaxDialogOpen] = useState(false);
  const [newTax, setNewTax] = useState({
    name: "",
    rate: 0,
    type: "Percentage",
    appliedTo: "All"
  });

  // Price Rule State
  const [priceRules, setPriceRules] = useState<any[]>([]);
  const [isPriceRuleDialogOpen, setIsPriceRuleDialogOpen] = useState(false);
  const [newPriceRule, setNewPriceRule] = useState({
    roomTypeId: "",
    startDate: "",
    endDate: "",
    price: 0
  });

  // Facility State
  const [facilities, setFacilities] = useState([
    { id: 1, name: "Extra Bed", price: 30, unit: "night", active: true },
    { id: 2, name: "Honeymoon Decoration", price: 100, unit: "stay", active: true },
    { id: 3, name: "Birthday Cake", price: 25, unit: "item", active: true },
  ]);
  const [isFacilityDialogOpen, setIsFacilityDialogOpen] = useState(false);
  const [newFacility, setNewFacility] = useState({
    name: "",
    price: 0,
    unit: "item",
    active: true
  });

  // Restaurant Item State
  const [restaurantItems, setRestaurantItems] = useState([
    { id: 1, name: "Club Sandwich", category: "Food", price: 15 },
    { id: 2, name: "Cappuccino", category: "Beverage", price: 5 },
    { id: 3, name: "Caesar Salad", category: "Food", price: 12 },
  ]);
  const [isRestaurantItemDialogOpen, setIsRestaurantItemDialogOpen] = useState(false);
  const [newRestaurantItem, setNewRestaurantItem] = useState({
    name: "",
    category: "Food",
    price: 0
  });

  // Invoice Settings State
  const [invoiceSettings, setInvoiceSettings] = useState({
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
  });

  // Load Invoice Settings
  useEffect(() => {
    const savedInvoiceSettings = localStorage.getItem("invoiceSettings");
    if (savedInvoiceSettings) {
      setInvoiceSettings(JSON.parse(savedInvoiceSettings));
    }
  }, []);

  // Save Invoice Settings
  useEffect(() => {
    localStorage.setItem("invoiceSettings", JSON.stringify(invoiceSettings));
  }, [invoiceSettings]);

  // Load Room Types from Local Storage on Mount
  useEffect(() => {
    const savedTypes = localStorage.getItem("roomTypes");
    if (savedTypes) {
      setRoomTypes(JSON.parse(savedTypes));
    }
    const savedRestaurantItems = localStorage.getItem("restaurantItems");
    if (savedRestaurantItems) {
      setRestaurantItems(JSON.parse(savedRestaurantItems));
    }
  }, []);

  // Save Room Types to Local Storage whenever they change
  useEffect(() => {
    localStorage.setItem("roomTypes", JSON.stringify(roomTypes));
  }, [roomTypes]);
  
  // Save Restaurant Items
  useEffect(() => {
    localStorage.setItem("restaurantItems", JSON.stringify(restaurantItems));
  }, [restaurantItems]);

  const handleAddRoomType = () => {
    const id = newRoomType.name.toLowerCase().replace(/\s+/g, '_');
    const typeToAdd = { ...newRoomType, id };
    setRoomTypes([...roomTypes, typeToAdd]);
    setIsRoomTypeDialogOpen(false);
    setNewRoomType({ name: "", beds: "", capacity: 2, price: 0, cots: false, infant: false });
    toast({
      title: "Room Type Added",
      description: `${newRoomType.name} has been added to your configuration.`,
    });
  };

  const handleDeleteRoomType = (id: string) => {
    setRoomTypes(roomTypes.filter(rt => rt.id !== id));
    toast({
      title: "Room Type Removed",
      description: "The room type has been removed from configuration.",
    });
  };

  const handleAddTax = () => {
    setTaxes([...taxes, { id: taxes.length + 1, ...newTax }]);
    setIsTaxDialogOpen(false);
    setNewTax({ name: "", rate: 0, type: "Percentage", appliedTo: "All" });
    toast({
      title: "Tax Rule Added",
      description: `${newTax.name} has been added to tax rules.`,
    });
  };

  const handleDeleteTax = (id: number) => {
    setTaxes(taxes.filter(t => t.id !== id));
    toast({
      title: "Tax Rule Removed",
      description: "The tax rule has been removed.",
    });
  };

  const handleAddPriceRule = () => {
    setPriceRules([...priceRules, { id: Date.now(), ...newPriceRule }]);
    setIsPriceRuleDialogOpen(false);
    setNewPriceRule({ roomTypeId: "", startDate: "", endDate: "", price: 0 });
    toast({
      title: "Price Rule Added",
      description: "Seasonal pricing rule has been activated.",
    });
  };

  const handleDeletePriceRule = (id: number) => {
    setPriceRules(priceRules.filter(pr => pr.id !== id));
    toast({
      title: "Price Rule Removed",
      description: "Pricing rule has been deactivated.",
    });
  };

  const handleAddFacility = () => {
    setFacilities([...facilities, { id: Date.now(), ...newFacility }]);
    setIsFacilityDialogOpen(false);
    setNewFacility({ name: "", price: 0, unit: "item", active: true });
    toast({
      title: "Facility Added",
      description: `${newFacility.name} is now available for booking.`,
    });
  };

  const handleDeleteFacility = (id: number) => {
    setFacilities(facilities.filter(f => f.id !== id));
    toast({
      title: "Facility Removed",
      description: "The facility has been removed from options.",
    });
  };

  const toggleFacility = (id: number) => {
    setFacilities(facilities.map(f => f.id === id ? { ...f, active: !f.active } : f));
  };

  const handleAddRestaurantItem = () => {
    setRestaurantItems([...restaurantItems, { id: Date.now(), ...newRestaurantItem }]);
    setIsRestaurantItemDialogOpen(false);
    setNewRestaurantItem({ name: "", category: "Food", price: 0 });
    toast({
      title: "Item Added",
      description: `${newRestaurantItem.name} has been added to the restaurant menu items.`,
    });
  };

  const handleDeleteRestaurantItem = (id: number) => {
    setRestaurantItems(restaurantItems.filter(item => item.id !== id));
    toast({
      title: "Item Removed",
      description: "The item has been removed from the list.",
    });
  };

  const handleGenerateSalaries = () => {
    // Generate salary records for current month
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    // Mock new salary data (in a real app, this would come from the backend or be calculated from staff records)
    const newSalaries = [
      { id: Date.now() + 1, name: "John Doe", role: "Manager", month: currentMonth, amount: 2500, status: "Pending", paymentDate: "-" },
      { id: Date.now() + 2, name: "Jane Smith", role: "Chef", month: currentMonth, amount: 1800, status: "Pending", paymentDate: "-" },
      { id: Date.now() + 3, name: "Mike Johnson", role: "Housekeeping", month: currentMonth, amount: 1200, status: "Pending", paymentDate: "-" },
      { id: Date.now() + 4, name: "Emily Davis", role: "Receptionist", month: currentMonth, amount: 1400, status: "Pending", paymentDate: "-" },
    ];

    // Store in localStorage to simulate persistence across pages
    localStorage.setItem("generatedSalaries", JSON.stringify(newSalaries));

    toast({
      title: "Salaries Generated Successfully",
      description: `Payroll records for ${currentMonth} have been created for all active staff.`,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Configuration & Settings</h2>
          <p className="text-muted-foreground">Manage global settings, pricing rules, and categories for this branch.</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="roomtypes">Room Types</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="facilities">Facilities</TabsTrigger>
            <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
            <TabsTrigger value="invoice">Invoice & Taxes</TabsTrigger>
            <TabsTrigger value="devtools" className="text-amber-600">Dev Tools</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Configuration</CardTitle>
                <CardDescription>Set the base currency and regional formats.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label>Base Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
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
                      <SelectTrigger>
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
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Save General Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tax Rules */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tax Rules</CardTitle>
                  <CardDescription>Configure taxes applied to bookings and services.</CardDescription>
                </div>
                <Dialog open={isTaxDialogOpen} onOpenChange={setIsTaxDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Tax Rule
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New Tax Rule</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Tax Name</Label>
                        <Input 
                          placeholder="e.g. GST" 
                          value={newTax.name}
                          onChange={(e) => setNewTax({...newTax, name: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Rate</Label>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            value={newTax.rate}
                            onChange={(e) => setNewTax({...newTax, rate: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select 
                            value={newTax.type}
                            onValueChange={(val) => setNewTax({...newTax, type: val})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Percentage">Percentage (%)</SelectItem>
                              <SelectItem value="Fixed">Fixed Amount</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Applied To</Label>
                        <Select 
                          value={newTax.appliedTo}
                          onValueChange={(val) => setNewTax({...newTax, appliedTo: val})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All Transactions</SelectItem>
                            <SelectItem value="Rooms">Room Bookings Only</SelectItem>
                            <SelectItem value="Services">Services & Food Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsTaxDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddTax}>Save Tax Rule</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tax Name</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Applied To</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxes.map((tax) => (
                      <TableRow key={tax.id}>
                        <TableCell className="font-medium">{tax.name}</TableCell>
                        <TableCell>{tax.rate}{tax.type === "Percentage" ? "%" : currency}</TableCell>
                        <TableCell>{tax.type}</TableCell>
                        <TableCell>{tax.appliedTo}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteTax(tax.id)}>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="tax-room" 
                        checked={invoiceSettings.taxableItems.room}
                        onCheckedChange={(checked) => setInvoiceSettings({
                          ...invoiceSettings, 
                          taxableItems: { ...invoiceSettings.taxableItems, room: !!checked }
                        })}
                      />
                      <Label htmlFor="tax-room">Room Charges</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="tax-food" 
                        checked={invoiceSettings.taxableItems.food}
                        onCheckedChange={(checked) => setInvoiceSettings({
                          ...invoiceSettings, 
                          taxableItems: { ...invoiceSettings.taxableItems, food: !!checked }
                        })}
                      />
                      <Label htmlFor="tax-food">Food & Beverage</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="tax-facility" 
                        checked={invoiceSettings.taxableItems.facility}
                        onCheckedChange={(checked) => setInvoiceSettings({
                          ...invoiceSettings, 
                          taxableItems: { ...invoiceSettings.taxableItems, facility: !!checked }
                        })}
                      />
                      <Label htmlFor="tax-facility">Facilities & Services</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="tax-other" 
                        checked={invoiceSettings.taxableItems.other}
                        onCheckedChange={(checked) => setInvoiceSettings({
                          ...invoiceSettings, 
                          taxableItems: { ...invoiceSettings.taxableItems, other: !!checked }
                        })}
                      />
                      <Label htmlFor="tax-other">Other Charges</Label>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Only checked items will have tax applied in the final invoice.</p>
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
                        checked={invoiceSettings.autoSend.email}
                        onCheckedChange={(checked) => setInvoiceSettings({
                          ...invoiceSettings, 
                          autoSend: { ...invoiceSettings.autoSend, email: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-Send WhatsApp</Label>
                        <p className="text-sm text-muted-foreground">Automatically send invoice via WhatsApp upon checkout.</p>
                      </div>
                      <Switch 
                        checked={invoiceSettings.autoSend.whatsapp}
                        onCheckedChange={(checked) => setInvoiceSettings({
                          ...invoiceSettings, 
                          autoSend: { ...invoiceSettings.autoSend, whatsapp: checked }
                        })}
                      />
                    </div>
                  </div>
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
                  <DialogContent className="sm:max-w-[500px]">
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
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
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
                      <div className="space-y-2">
                        <Label>Default Base Price ({currency})</Label>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          value={newRoomType.price}
                          onChange={(e) => setNewRoomType({...newRoomType, price: parseFloat(e.target.value)})}
                        />
                      </div>
                      <div className="flex flex-col gap-3 pt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="new-cots" 
                            checked={newRoomType.cots}
                            onCheckedChange={(checked) => setNewRoomType({...newRoomType, cots: checked})}
                          />
                          <label htmlFor="new-cots" className="text-sm font-medium">Allows Extra Cot</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="new-infant" 
                            checked={newRoomType.infant}
                            onCheckedChange={(checked) => setNewRoomType({...newRoomType, infant: checked})}
                          />
                          <label htmlFor="new-infant" className="text-sm font-medium">Infant Friendly</label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsRoomTypeDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddRoomType}>Save Room Type</Button>
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
                      <TableHead>Features</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roomTypes.map((rt) => (
                      <TableRow key={rt.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <BedDouble className="h-4 w-4 text-muted-foreground" />
                            {rt.name}
                          </div>
                        </TableCell>
                        <TableCell>{rt.beds}</TableCell>
                        <TableCell>{rt.capacity} Persons</TableCell>
                        <TableCell>{currency} {rt.price}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {rt.cots && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">Cot</span>}
                            {rt.infant && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Infant</span>}
                          </div>
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

          {/* Pricing Rules */}
          <TabsContent value="pricing" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Seasonal Pricing Configuration</CardTitle>
                  <CardDescription>Set base rates for room types based on date ranges or seasons.</CardDescription>
                </div>
                <Dialog open={isPriceRuleDialogOpen} onOpenChange={setIsPriceRuleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Price Rule
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add Pricing Rule</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Room Type</Label>
                        <Select 
                          value={newPriceRule.roomTypeId}
                          onValueChange={(val) => setNewPriceRule({...newPriceRule, roomTypeId: val})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Room Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {roomTypes.map(rt => (
                              <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Input 
                            type="date"
                            value={newPriceRule.startDate}
                            onChange={(e) => setNewPriceRule({...newPriceRule, startDate: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Input 
                            type="date"
                            value={newPriceRule.endDate}
                            onChange={(e) => setNewPriceRule({...newPriceRule, endDate: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Special Price ({currency})</Label>
                        <Input 
                          type="number" 
                          placeholder="e.g. 250" 
                          value={newPriceRule.price}
                          onChange={(e) => setNewPriceRule({...newPriceRule, price: parseFloat(e.target.value)})}
                        />
                        <p className="text-xs text-muted-foreground">Overrides the default base price for this period.</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsPriceRuleDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddPriceRule}>Save Rule</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {priceRules.length === 0 ? (
                    <div className="bg-muted/30 p-8 rounded-lg flex flex-col items-center justify-center text-center">
                      <CalendarRange className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
                      <h4 className="text-sm font-medium">No Active Rules</h4>
                      <p className="text-xs text-muted-foreground max-w-xs mt-1">
                        No custom pricing rules are currently active. Standard base rates will apply for all dates.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Room Type</TableHead>
                          <TableHead>Date Range</TableHead>
                          <TableHead>New Price</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {priceRules.map((rule) => {
                          const roomName = roomTypes.find(rt => rt.id === rule.roomTypeId)?.name || rule.roomTypeId;
                          return (
                            <TableRow key={rule.id}>
                              <TableCell className="font-medium">{roomName}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 text-sm">
                                  <span>{rule.startDate}</span>
                                  <span className="text-muted-foreground">to</span>
                                  <span>{rule.endDate}</span>
                                </div>
                              </TableCell>
                              <TableCell>{currency} {rule.price}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeletePriceRule(rule.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
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
                <Dialog>
                  <DialogTrigger asChild>
                     <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Category Item</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Input placeholder="e.g. Grocery" />
                      </div>
                      <div className="space-y-2">
                        <Label>Subtype</Label>
                        <Input placeholder="e.g. Vegetables" />
                      </div>
                      <div className="space-y-2">
                         <Label>Default Item Name</Label>
                         <Input placeholder="e.g. Onion" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Subtype</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell>{cat.type}</TableCell>
                        <TableCell>{cat.subtype}</TableCell>
                        <TableCell className="font-medium">{cat.item}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Price ({currency})</Label>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            value={newFacility.price}
                            onChange={(e) => setNewFacility({...newFacility, price: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Unit</Label>
                          <Select 
                            value={newFacility.unit}
                            onValueChange={(val) => setNewFacility({...newFacility, unit: val})}
                          >
                            <SelectTrigger>
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
                      <div className="flex items-center space-x-2 pt-2">
                         <Switch 
                            checked={newFacility.active}
                            onCheckedChange={(checked) => setNewFacility({...newFacility, active: checked})}
                         />
                         <Label>Active (Available for booking)</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsFacilityDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddFacility}>Save Facility</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {facilities.map((facility) => (
                    <div key={facility.id} className="border rounded-lg p-4 flex items-center justify-between">
                       <div className="flex items-start gap-3">
                         <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-1">
                           <Sparkles className="h-4 w-4" />
                         </div>
                         <div>
                           <h4 className="font-bold">{facility.name}</h4>
                           <p className="text-sm text-muted-foreground">
                             {currency} {facility.price.toFixed(2)} / {facility.unit}
                           </p>
                         </div>
                       </div>
                       <div className="flex items-center gap-2">
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
                      <div className="grid grid-cols-2 gap-4">
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
                    {restaurantItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                            {item.name}
                          </div>
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{currency} {item.price.toFixed(2)}</TableCell>
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