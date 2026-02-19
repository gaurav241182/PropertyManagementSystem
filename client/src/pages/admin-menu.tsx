import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MenuItem, Facility } from "@shared/schema";

export default function AdminMenu({ role = "owner" }: { role?: "owner" | "manager" }) {
  const { toast } = useToast();

  const { data: menuItems = [], isLoading: menuLoading } = useQuery<MenuItem[]>({ queryKey: ['/api/menu-items'] });
  const { data: facilities = [], isLoading: facilitiesLoading } = useQuery<Facility[]>({ queryKey: ['/api/facilities'] });

  const isLoading = menuLoading || facilitiesLoading;

  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState({ name: "", category: "Food", price: "", description: "" });

  const [facilityDialogOpen, setFacilityDialogOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [facilityForm, setFacilityForm] = useState({ name: "", price: "", unit: "item", description: "" });

  const addMenuMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/menu-items", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
      setMenuDialogOpen(false);
      toast({ title: "Item Added", description: "Menu item has been added." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMenuMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PATCH", `/api/menu-items/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
      setMenuDialogOpen(false);
      toast({ title: "Item Updated", description: "Menu item has been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMenuMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/menu-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
      toast({ title: "Item Deleted", description: "Menu item has been removed." });
    },
  });

  const toggleMenuAvailability = useMutation({
    mutationFn: async ({ id, available }: { id: number; available: boolean }) => {
      const res = await apiRequest("PATCH", `/api/menu-items/${id}`, { available });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
    },
  });

  const addFacilityMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/facilities", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/facilities'] });
      setFacilityDialogOpen(false);
      toast({ title: "Service Added", description: "Facility service has been added." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateFacilityMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PATCH", `/api/facilities/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/facilities'] });
      setFacilityDialogOpen(false);
      toast({ title: "Service Updated", description: "Facility has been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteFacilityMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/facilities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/facilities'] });
      toast({ title: "Service Deleted", description: "Facility has been removed." });
    },
  });

  const openAddMenu = () => {
    setEditingMenuItem(null);
    setMenuForm({ name: "", category: "Food", price: "", description: "" });
    setMenuDialogOpen(true);
  };

  const openEditMenu = (item: MenuItem) => {
    setEditingMenuItem(item);
    setMenuForm({ name: item.name, category: item.category, price: String(item.price), description: item.description || "" });
    setMenuDialogOpen(true);
  };

  const handleSaveMenu = () => {
    const payload = {
      name: menuForm.name,
      category: menuForm.category,
      price: menuForm.price,
      description: menuForm.description,
      available: editingMenuItem ? editingMenuItem.available : true,
    };
    if (editingMenuItem) {
      updateMenuMutation.mutate({ id: editingMenuItem.id, ...payload });
    } else {
      addMenuMutation.mutate(payload);
    }
  };

  const openAddFacility = () => {
    setEditingFacility(null);
    setFacilityForm({ name: "", price: "", unit: "item", description: "" });
    setFacilityDialogOpen(true);
  };

  const openEditFacility = (item: Facility) => {
    setEditingFacility(item);
    setFacilityForm({ name: item.name, price: String(item.price), unit: item.unit, description: item.description || "" });
    setFacilityDialogOpen(true);
  };

  const handleSaveFacility = () => {
    const payload = {
      name: facilityForm.name,
      price: facilityForm.price,
      unit: facilityForm.unit,
      description: facilityForm.description,
      active: editingFacility ? editingFacility.active : true,
    };
    if (editingFacility) {
      updateFacilityMutation.mutate({ id: editingFacility.id, ...payload });
    } else {
      addFacilityMutation.mutate(payload);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout role={role}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout role={role}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary" data-testid="text-page-title">Menu & Services</h2>
            <p className="text-muted-foreground">Manage dining menu and extra hotel services.</p>
          </div>
        </div>

        <Tabs defaultValue="dining">
          <TabsList>
            <TabsTrigger value="dining" data-testid="tab-dining">Dining Menu</TabsTrigger>
            <TabsTrigger value="services" data-testid="tab-services">Hotel Services</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dining" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Food & Beverage</CardTitle>
                  <CardDescription>Manage your restaurant menu items.</CardDescription>
                </div>
                <Button size="sm" onClick={openAddMenu} data-testid="button-add-menu-item">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Availability</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {menuItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No menu items yet. Add your first item above.
                        </TableCell>
                      </TableRow>
                    )}
                    {menuItems.map((item) => (
                      <TableRow key={item.id} data-testid={`row-menu-item-${item.id}`}>
                        <TableCell className="font-medium" data-testid={`text-menu-name-${item.id}`}>{item.name}</TableCell>
                        <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                        <TableCell>${Number(item.price).toFixed(2)}</TableCell>
                        <TableCell>
                          <Switch 
                            checked={item.available} 
                            onCheckedChange={(checked) => toggleMenuAvailability.mutate({ id: item.id, available: checked })}
                            data-testid={`switch-availability-${item.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditMenu(item)} data-testid={`button-edit-menu-${item.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteMenuMutation.mutate(item.id)} data-testid={`button-delete-menu-${item.id}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="services" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Extra Services</CardTitle>
                  <CardDescription>Manage chargeable services and facilities.</CardDescription>
                </div>
                <Button size="sm" onClick={openAddFacility} data-testid="button-add-facility">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Service
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Name</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facilities.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No services yet. Add your first service above.
                        </TableCell>
                      </TableRow>
                    )}
                    {facilities.map((service) => (
                      <TableRow key={service.id} data-testid={`row-facility-${service.id}`}>
                        <TableCell className="font-medium" data-testid={`text-facility-name-${service.id}`}>{service.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{service.unit}</Badge>
                        </TableCell>
                        <TableCell>${Number(service.price).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditFacility(service)} data-testid={`button-edit-facility-${service.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteFacilityMutation.mutate(service.id)} data-testid={`button-delete-facility-${service.id}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={menuDialogOpen} onOpenChange={setMenuDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMenuItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
              <DialogDescription>{editingMenuItem ? "Update the menu item details." : "Add a new item to your restaurant menu."}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="menuName">Item Name</Label>
                <Input id="menuName" placeholder="e.g. Pasta Alfredo" value={menuForm.name} onChange={(e) => setMenuForm({...menuForm, name: e.target.value})} data-testid="input-menu-name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="menuPrice">Price ($)</Label>
                  <Input id="menuPrice" type="number" placeholder="0.00" value={menuForm.price} onChange={(e) => setMenuForm({...menuForm, price: e.target.value})} data-testid="input-menu-price" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="menuCategory">Category</Label>
                  <Select value={menuForm.category} onValueChange={(val) => setMenuForm({...menuForm, category: val})}>
                    <SelectTrigger id="menuCategory" data-testid="select-menu-category">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Food">Food</SelectItem>
                      <SelectItem value="Beverage">Beverage</SelectItem>
                      <SelectItem value="Dessert">Dessert</SelectItem>
                      <SelectItem value="Breakfast">Breakfast</SelectItem>
                      <SelectItem value="Lunch">Lunch</SelectItem>
                      <SelectItem value="Dinner">Dinner</SelectItem>
                      <SelectItem value="Starters">Starters</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="menuDesc">Description</Label>
                <Input id="menuDesc" placeholder="Brief description..." value={menuForm.description} onChange={(e) => setMenuForm({...menuForm, description: e.target.value})} data-testid="input-menu-description" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMenuDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveMenu} disabled={addMenuMutation.isPending || updateMenuMutation.isPending} data-testid="button-save-menu">
                {(addMenuMutation.isPending || updateMenuMutation.isPending) ? "Saving..." : "Save Item"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={facilityDialogOpen} onOpenChange={setFacilityDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFacility ? "Edit Service" : "Add Service"}</DialogTitle>
              <DialogDescription>{editingFacility ? "Update the service details." : "Add a new chargeable service."}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="facilityName">Service Name</Label>
                <Input id="facilityName" placeholder="e.g. Airport Pickup" value={facilityForm.name} onChange={(e) => setFacilityForm({...facilityForm, name: e.target.value})} data-testid="input-facility-name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facilityPrice">Price ($)</Label>
                  <Input id="facilityPrice" type="number" placeholder="0.00" value={facilityForm.price} onChange={(e) => setFacilityForm({...facilityForm, price: e.target.value})} data-testid="input-facility-price" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facilityUnit">Unit</Label>
                  <Select value={facilityForm.unit} onValueChange={(val) => setFacilityForm({...facilityForm, unit: val})}>
                    <SelectTrigger id="facilityUnit" data-testid="select-facility-unit">
                      <SelectValue placeholder="Select Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="item">Per Item</SelectItem>
                      <SelectItem value="person">Per Person</SelectItem>
                      <SelectItem value="night">Per Night</SelectItem>
                      <SelectItem value="stay">Per Stay</SelectItem>
                      <SelectItem value="trip">Per Trip</SelectItem>
                      <SelectItem value="session">Per Session</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="facilityDesc">Description</Label>
                <Input id="facilityDesc" placeholder="Brief description..." value={facilityForm.description} onChange={(e) => setFacilityForm({...facilityForm, description: e.target.value})} data-testid="input-facility-description" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFacilityDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveFacility} disabled={addFacilityMutation.isPending || updateFacilityMutation.isPending} data-testid="button-save-facility">
                {(addFacilityMutation.isPending || updateFacilityMutation.isPending) ? "Saving..." : "Save Service"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}