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
import { Plus, Trash2, Edit, ChefHat, UtensilsCrossed, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";

interface ApiMenuItem {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string;
  available: boolean;
  createdAt: string;
}

export default function AdminRestaurantMenu({ role = "owner" }: { role?: "owner" | "manager" }) {
  const { toast } = useToast();

  const { data: availableItems = [] } = useQuery<ApiMenuItem[]>({ queryKey: ['/api/menu-items'] });
  const { data: settingsData } = useQuery<Record<string, string>>({ queryKey: ['/api/settings'] });
  const currency = settingsData?.currency || "USD";

  const addItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/menu-items", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PATCH", `/api/menu-items/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/menu-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
    },
  });

  // Menu Items Management
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ApiMenuItem | null>(null);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    category: "Food",
    price: 0,
    available: true
  });

  // Menus & Buffets Management
  const [menus, setMenus] = useState([
    { 
      id: 1, 
      name: "Breakfast Menu", 
      type: "Daily", 
      active: true, 
      items: [1, 2, 4],
      schedule: "Everyday 6am - 11am"
    },
    { 
      id: 2, 
      name: "Valentine's Special", 
      type: "Event", 
      active: false, 
      items: [3, 5, 2],
      schedule: "Feb 14, 2024"
    }
  ]);

  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [newMenu, setNewMenu] = useState({
    name: "",
    type: "Daily",
    schedule: "",
    items: [] as number[]
  });

  // Item Handlers
  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      toast({ title: "Error", description: "Item name is required", variant: "destructive" });
      return;
    }

    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, ...newItem }, {
        onSuccess: () => {
          toast({ title: "Success", description: `${newItem.name} has been updated.` });
          setIsItemDialogOpen(false);
          setEditingItem(null);
          setNewItem({ name: "", description: "", category: "Food", price: 0, available: true });
        },
      });
    } else {
      addItemMutation.mutate(newItem, {
        onSuccess: () => {
          toast({ title: "Success", description: `${newItem.name} has been added to the menu.` });
          setIsItemDialogOpen(false);
          setNewItem({ name: "", description: "", category: "Food", price: 0, available: true });
        },
      });
    }
  };

  const handleEditItem = (item: ApiMenuItem) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      description: item.description,
      category: item.category,
      price: parseFloat(item.price),
      available: item.available
    });
    setIsItemDialogOpen(true);
  };

  const handleDeleteItem = (id: number) => {
    deleteItemMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: "Deleted", description: "Menu item has been removed." });
      },
    });
  };

  const handleToggleItemAvailable = (item: ApiMenuItem) => {
    updateItemMutation.mutate({ 
      id: item.id, 
      available: !item.available 
    }, {
      onSuccess: () => {
        toast({ 
          title: "Updated", 
          description: `${item.name} is now ${!item.available ? 'Active' : 'Inactive'}.` 
        });
      },
    });
  };

  // Menu Handlers
  const handleAddMenu = () => {
    if (!newMenu.name.trim()) {
      toast({ title: "Error", description: "Menu name is required", variant: "destructive" });
      return;
    }

    setMenus([...menus, { id: Date.now(), ...newMenu, active: true }]);
    setIsMenuDialogOpen(false);
    setNewMenu({ name: "", type: "Daily", schedule: "", items: [] });
    toast({ title: "Success", description: `${newMenu.name} has been created.` });
  };

  const handleDeleteMenu = (id: number) => {
    setMenus(menus.filter(m => m.id !== id));
    toast({ title: "Deleted", description: "Menu has been removed." });
  };

  const handleToggleMenu = (id: number) => {
    setMenus(menus.map(m => m.id === id ? { ...m, active: !m.active } : m));
  };

  const toggleMenuItem = (itemId: number) => {
    if (newMenu.items.includes(itemId)) {
      setNewMenu({ ...newMenu, items: newMenu.items.filter(id => id !== itemId) });
    } else {
      setNewMenu({ ...newMenu, items: [...newMenu.items, itemId] });
    }
  };

  const openAddItemDialog = () => {
    setEditingItem(null);
    setNewItem({ name: "", description: "", category: "Food", price: 0, available: true });
    setIsItemDialogOpen(true);
  };

  return (
    <AdminLayout role={role}>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Restaurant Menu Management</h2>
          <p className="text-muted-foreground">Manage menu items and create daily menus, buffets, and special meal collections.</p>
        </div>

        <Tabs defaultValue="items" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="items">Menu Items</TabsTrigger>
            <TabsTrigger value="menus">Menus & Buffets</TabsTrigger>
          </TabsList>

          {/* ========== MENU ITEMS TAB ========== */}
          <TabsContent value="items" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold">Manage Menu Items</h3>
                <p className="text-sm text-muted-foreground">Create and manage individual food and beverage items.</p>
              </div>
              <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openAddItemDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Item Name</Label>
                      <Input 
                        placeholder="e.g. Club Sandwich" 
                        value={newItem.name}
                        onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                        data-testid="input-item-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea 
                        placeholder="Optional description, e.g. Grilled bread with fresh vegetables" 
                        value={newItem.description}
                        onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                        data-testid="textarea-item-description"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select 
                          value={newItem.category}
                          onValueChange={(val) => setNewItem({...newItem, category: val})}
                        >
                          <SelectTrigger data-testid="select-category">
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
                          step="0.01"
                          value={newItem.price}
                          onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})}
                          data-testid="input-item-price"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <Label className="font-medium">Active / Available</Label>
                      <Switch 
                        checked={newItem.available}
                        onCheckedChange={(checked) => setNewItem({...newItem, available: checked})}
                        data-testid="switch-item-available"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddItem} data-testid="button-save-item">
                      {editingItem ? "Update Item" : "Add Item"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="pt-6">
                {availableItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Utensils className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                    <p className="text-muted-foreground">No menu items yet. Create your first item to get started!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availableItems.map((item: ApiMenuItem) => (
                          <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Utensils className="h-4 w-4 text-muted-foreground" />
                                {item.name}
                              </div>
                            </TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell>{currency} {Number(item.price).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={item.available ? "default" : "secondary"}
                                className={item.available ? "bg-green-600" : ""}
                                data-testid={`badge-status-${item.id}`}
                              >
                                {item.available ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditItem(item)}
                                data-testid={`button-edit-${item.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleToggleItemAvailable(item)}
                                data-testid={`button-toggle-${item.id}`}
                              >
                                {item.available ? "Deactivate" : "Activate"}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => handleDeleteItem(item.id)}
                                data-testid={`button-delete-${item.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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

          {/* ========== MENUS & BUFFETS TAB ========== */}
          <TabsContent value="menus" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold">Create Menus & Buffets</h3>
                <p className="text-sm text-muted-foreground">Organize items into themed collections like breakfast buffets, special occasion meals, etc.</p>
              </div>
              <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Menu
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Create New Menu or Buffet</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Menu Name</Label>
                      <Input 
                        placeholder="e.g. Breakfast Buffet, Valentine's Special, Birthday Package" 
                        value={newMenu.name}
                        onChange={(e) => setNewMenu({...newMenu, name: e.target.value})}
                        data-testid="input-menu-name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select 
                          value={newMenu.type}
                          onValueChange={(val) => setNewMenu({...newMenu, type: val})}
                        >
                          <SelectTrigger data-testid="select-menu-type">
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Daily">Daily Menu</SelectItem>
                            <SelectItem value="Buffet">Buffet</SelectItem>
                            <SelectItem value="Event">Special Occasion</SelectItem>
                            <SelectItem value="Seasonal">Seasonal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Schedule / Date</Label>
                        <Input 
                          placeholder="e.g. Mon-Fri 6am-11am or Feb 14" 
                          value={newMenu.schedule}
                          onChange={(e) => setNewMenu({...newMenu, schedule: e.target.value})}
                          data-testid="input-menu-schedule"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Add Items to This Menu</Label>
                      <p className="text-xs text-muted-foreground">Select items from your inventory to include in this menu.</p>
                      <div className="border rounded-md p-4 max-h-[250px] overflow-y-auto space-y-2">
                        {availableItems.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No items available. Create menu items first.
                          </p>
                        ) : (
                          availableItems.map((item: ApiMenuItem) => (
                            <div key={item.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`menu-item-${item.id}`} 
                                checked={newMenu.items.includes(item.id)}
                                onCheckedChange={() => toggleMenuItem(item.id)}
                                data-testid={`checkbox-item-${item.id}`}
                              />
                              <label htmlFor={`menu-item-${item.id}`} className="flex-1 flex justify-between text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                <span>{item.name}</span>
                                <span className="text-muted-foreground">{currency} {Number(item.price).toFixed(2)}</span>
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsMenuDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddMenu} data-testid="button-create-menu">Create Menu</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {menus.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ChefHat className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-muted-foreground">No menus created yet. Create your first menu or buffet!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menus.map((menu) => {
                  const menuItemsList = menu.items.map(itemId => availableItems.find((i: ApiMenuItem) => i.id === itemId)).filter(Boolean);
                  return (
                    <Card key={menu.id} className="relative" data-testid={`card-menu-${menu.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                              <ChefHat className="h-5 w-5 text-primary" />
                              {menu.name}
                            </CardTitle>
                            <CardDescription className="mt-1">{menu.schedule}</CardDescription>
                          </div>
                          <Badge 
                            variant={menu.active ? "default" : "secondary"} 
                            className={menu.active ? "bg-green-600" : ""}
                            data-testid={`badge-menu-status-${menu.id}`}
                          >
                            {menu.active ? "Active" : "Draft"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mt-2 space-y-3">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <UtensilsCrossed className="h-3 w-3" />
                              {menu.type}
                            </span>
                            <span>{menu.items.length} Items</span>
                          </div>
                          
                          {menuItemsList.length > 0 && (
                            <div className="border-t pt-3">
                              <p className="text-sm font-medium mb-2">Items:</p>
                              <div className="space-y-1">
                                {menuItemsList.slice(0, 4).map((item: any) => (
                                  <div key={item.id} className="text-xs text-muted-foreground flex justify-between">
                                    <span>{item.name}</span>
                                    <span>{currency} {Number(item.price).toFixed(2)}</span>
                                  </div>
                                ))}
                                {menuItemsList.length > 4 && (
                                  <div className="text-xs text-muted-foreground italic">+ {menuItemsList.length - 4} more items</div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex justify-end gap-2 mt-4 pt-2 border-t flex-wrap">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleToggleMenu(menu.id)}
                              data-testid={`button-toggle-menu-${menu.id}`}
                            >
                              {menu.active ? "Deactivate" : "Activate"}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-600"
                              onClick={() => handleDeleteMenu(menu.id)}
                              data-testid={`button-delete-menu-${menu.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
