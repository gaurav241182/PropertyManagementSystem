import { useState } from "react";
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
import { Plus, Trash2, Edit, Save } from "lucide-react";

export default function AdminSettings() {
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Configuration & Settings</h2>
          <p className="text-muted-foreground">Manage global settings, pricing rules, and categories for this branch.</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General & Currency</TabsTrigger>
            <TabsTrigger value="taxes">Taxes</TabsTrigger>
            <TabsTrigger value="pricing">Pricing Rules</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="facilities">Facilities</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="mt-6">
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
          </TabsContent>

          {/* Tax Configuration */}
          <TabsContent value="taxes" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tax Rules</CardTitle>
                  <CardDescription>Configure taxes applied to bookings and services.</CardDescription>
                </div>
                <Button size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Tax Rule
                </Button>
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
                          <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
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
                           <SelectItem value="deluxe">Deluxe Ocean View</SelectItem>
                           <SelectItem value="standard">Standard King</SelectItem>
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