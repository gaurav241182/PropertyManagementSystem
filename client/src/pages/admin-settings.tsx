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
import { Plus, Trash2, Edit, Save, BedDouble } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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

  // Load Room Types from Local Storage on Mount
  useEffect(() => {
    const savedTypes = localStorage.getItem("roomTypes");
    if (savedTypes) {
      setRoomTypes(JSON.parse(savedTypes));
    }
  }, []);

  // Save Room Types to Local Storage whenever they change
  useEffect(() => {
    localStorage.setItem("roomTypes", JSON.stringify(roomTypes));
  }, [roomTypes]);

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Configuration & Settings</h2>
          <p className="text-muted-foreground">Manage global settings, pricing rules, and categories for this branch.</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="roomtypes">Room Types</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="facilities">Facilities</TabsTrigger>
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

            {/* Tax Rules - Moved here */}
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
              <CardHeader>
                <CardTitle>Seasonal Pricing Configuration</CardTitle>
                <CardDescription>Set base rates for room types based on date ranges or seasons.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-end">
                   <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Price Rule
                  </Button>
                </div>
                <div className="border rounded-md p-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                       <Label>Room Type</Label>
                       <Select defaultValue="deluxe">
                         <SelectTrigger><SelectValue /></SelectTrigger>
                         <SelectContent>
                           {roomTypes.map(rt => (
                             <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                    </div>
                    <div className="flex-1 space-y-2">
                       <Label>Date Range</Label>
                       <div className="flex items-center gap-2">
                         <Input type="date" className="w-full" />
                         <span>to</span>
                         <Input type="date" className="w-full" />
                       </div>
                    </div>
                    <div className="w-32 space-y-2">
                       <Label>Price ({currency})</Label>
                       <Input type="number" placeholder="250" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Active Rules</h3>
                  <div className="bg-muted/30 p-4 rounded text-sm text-center text-muted-foreground">
                    No custom pricing rules active. Default base rates apply.
                  </div>
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
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Facility
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mock Data */}
                  <div className="border rounded-lg p-4 flex items-center justify-between">
                     <div>
                       <h4 className="font-bold">Extra Bed</h4>
                       <p className="text-sm text-muted-foreground">$30.00 / night</p>
                     </div>
                     <Switch checked={true} />
                  </div>
                  <div className="border rounded-lg p-4 flex items-center justify-between">
                     <div>
                       <h4 className="font-bold">Honeymoon Decoration</h4>
                       <p className="text-sm text-muted-foreground">$100.00 / stay</p>
                     </div>
                     <Switch checked={true} />
                  </div>
                   <div className="border rounded-lg p-4 flex items-center justify-between">
                     <div>
                       <h4 className="font-bold">Birthday Cake</h4>
                       <p className="text-sm text-muted-foreground">$25.00 / item</p>
                     </div>
                     <Switch checked={true} />
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