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
import { Plus, Trash2, Edit, ChefHat, UtensilsCrossed, Utensils, CalendarDays } from "lucide-react";
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

interface ApiMenu {
  id: number;
  name: string;
  type: string;
  startDate: string | null;
  endDate: string | null;
  price: string;
  active: boolean;
  itemIds: string;
  createdAt: string;
}

export default function AdminRestaurantMenu({ role = "owner" }: { role?: "owner" | "manager" }) {
  const { toast } = useToast();

  const { data: availableItems = [] } = useQuery<ApiMenuItem[]>({ queryKey: ['/api/menu-items'] });
  const { data: menusData = [] } = useQuery<ApiMenu[]>({ queryKey: ['/api/menus'] });
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

  const createMenuMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/menus", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menus'] });
    },
  });

  const updateMenuMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PATCH", `/api/menus/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menus'] });
    },
  });

  const deleteMenuMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/menus/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menus'] });
    },
  });

  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ApiMenuItem | null>(null);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    category: "Food",
    price: "",
    available: true
  });

  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<ApiMenu | null>(null);
  const [newMenu, setNewMenu] = useState({
    name: "",
    type: "Daily",
    startDate: "",
    endDate: "",
    price: "",
    items: [] as number[]
  });

  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      toast({ title: "Error", description: "Item name is required", variant: "destructive" });
      return;
    }
    const itemPayload = { ...newItem, price: parseFloat(newItem.price) || 0 };
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, ...itemPayload }, {
        onSuccess: () => {
          toast({ title: "Success", description: `${newItem.name} has been updated.` });
          setIsItemDialogOpen(false);
          setEditingItem(null);
          setNewItem({ name: "", description: "", category: "Food", price: "", available: true });
        },
      });
    } else {
      addItemMutation.mutate(itemPayload, {
        onSuccess: () => {
          toast({ title: "Success", description: `${newItem.name} has been added to the menu.` });
          setIsItemDialogOpen(false);
          setNewItem({ name: "", description: "", category: "Food", price: "", available: true });
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
      price: String(item.price),
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

  const handleAddMenu = () => {
    if (!newMenu.name.trim()) {
      toast({ title: "Error", description: "Menu name is required", variant: "destructive" });
      return;
    }

    const payload: any = {
      name: newMenu.name,
      type: newMenu.type,
      startDate: newMenu.startDate || null,
      endDate: newMenu.endDate || null,
      price: parseFloat(newMenu.price) || 0,
      itemIds: JSON.stringify(newMenu.items),
      active: true
    };

    if (editingMenu) {
      updateMenuMutation.mutate({ id: editingMenu.id, ...payload }, {
        onSuccess: () => {
          toast({ title: "Success", description: `${newMenu.name} has been updated.` });
          setIsMenuDialogOpen(false);
          setEditingMenu(null);
          setNewMenu({ name: "", type: "Daily", startDate: "", endDate: "", price: "", items: [] });
        },
      });
    } else {
      createMenuMutation.mutate(payload, {
        onSuccess: () => {
          toast({ title: "Success", description: `${newMenu.name} has been created.` });
          setIsMenuDialogOpen(false);
          setNewMenu({ name: "", type: "Daily", startDate: "", endDate: "", price: "", items: [] });
        },
      });
    }
  };

  const handleEditMenu = (menu: ApiMenu) => {
    setEditingMenu(menu);
    setNewMenu({
      name: menu.name,
      type: menu.type,
      startDate: menu.startDate || "",
      endDate: menu.endDate || "",
      price: String(menu.price),
      items: JSON.parse(menu.itemIds || "[]")
    });
    setIsMenuDialogOpen(true);
  };

  const handleDeleteMenu = (id: number) => {
    deleteMenuMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: "Deleted", description: "Menu has been removed." });
      },
    });
  };

  const handleToggleMenu = (menu: ApiMenu) => {
    updateMenuMutation.mutate({ 
      id: menu.id, 
      active: !menu.active 
    }, {
      onSuccess: () => {
        toast({ 
          title: "Updated", 
          description: `${menu.name} is now ${!menu.active ? 'Active' : 'Inactive'}.` 
        });
      },
    });
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
    setNewItem({ name: "", description: "", category: "Food", price: "", available: true });
    setIsItemDialogOpen(true);
  };

  const openAddMenuDialog = () => {
    setEditingMenu(null);
    setNewMenu({ name: "", type: "Daily", startDate: "", endDate: "", price: "", items: [] });
    setIsMenuDialogOpen(true);
  };

  const isMenuExpired = (menu: ApiMenu) => {
    if (!menu.endDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return menu.endDate < today;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <AdminLayout role={role}>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Restaurant Menu Management</h2>
          <p className="text-muted-foreground">Manage menu items and create daily menus, buffets, and special meal collections with pricing.</p>
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
                  <Button onClick={openAddItemDialog} data-testid="button-add-item">
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
                        placeholder="Optional description" 
                        value={newItem.description}
                        onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                        data-testid="textarea-item-description"
                        rows={2}
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
                          onChange={(e) => setNewItem({...newItem, price: e.target.value})}
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
                              <div className="flex items-center gap-2">
                                <Switch 
                                  checked={item.available}
                                  onCheckedChange={() => handleToggleItemAvailable(item)}
                                  data-testid={`switch-status-${item.id}`}
                                />
                                <span className={`text-xs ${item.available ? 'text-green-600' : 'text-muted-foreground'}`}>
                                  {item.available ? "Active" : "Inactive"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
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
                <p className="text-sm text-muted-foreground">Organize items into themed collections with pricing. Menus with end dates auto-deactivate after expiry.</p>
              </div>
              <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openAddMenuDialog} data-testid="button-add-menu">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Menu
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>{editingMenu ? "Edit Menu or Buffet" : "Create New Menu or Buffet"}</DialogTitle>
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
                        <Label>Menu Price ({currency})</Label>
                        <Input 
                          type="number"
                          placeholder="e.g. 25.00"
                          step="0.01"
                          value={newMenu.price}
                          onChange={(e) => setNewMenu({...newMenu, price: e.target.value})}
                          data-testid="input-menu-price"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                        <Input 
                          type="date"
                          value={newMenu.startDate}
                          onChange={(e) => setNewMenu({...newMenu, startDate: e.target.value})}
                          data-testid="input-menu-start-date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                        <Input 
                          type="date"
                          value={newMenu.endDate}
                          onChange={(e) => setNewMenu({...newMenu, endDate: e.target.value})}
                          data-testid="input-menu-end-date"
                        />
                        <p className="text-xs text-muted-foreground">Menu auto-deactivates after this date.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Add Items to This Menu</Label>
                      <p className="text-xs text-muted-foreground">Select items from your inventory to include in this menu.</p>
                      <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto space-y-2">
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
                              <label htmlFor={`menu-item-${item.id}`} className="flex-1 flex justify-between text-sm font-medium leading-none cursor-pointer">
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
                    <Button onClick={handleAddMenu} data-testid="button-create-menu">
                      {editingMenu ? "Update Menu" : "Create Menu"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {menusData.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ChefHat className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-muted-foreground">No menus created yet. Create your first menu or buffet!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menusData.map((menu) => {
                  const itemIds = JSON.parse(menu.itemIds || "[]");
                  const menuItemsList = itemIds.map((itemId: number) => availableItems.find((i: ApiMenuItem) => i.id === itemId)).filter(Boolean);
                  const expired = isMenuExpired(menu);
                  return (
                    <Card key={menu.id} className={`relative ${expired ? 'opacity-60' : ''}`} data-testid={`card-menu-${menu.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                              <ChefHat className="h-5 w-5 text-primary" />
                              {menu.name}
                            </CardTitle>
                            {(menu.startDate || menu.endDate) && (
                              <CardDescription className="mt-1 flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {menu.startDate && menu.endDate
                                  ? `${formatDate(menu.startDate)} - ${formatDate(menu.endDate)}`
                                  : menu.startDate
                                    ? `From ${formatDate(menu.startDate)}`
                                    : `Until ${formatDate(menu.endDate)}`
                                }
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {expired && (
                              <Badge variant="destructive" className="text-xs">
                                Expired
                              </Badge>
                            )}
                            <Badge 
                              variant={menu.active ? "default" : "secondary"} 
                              className={menu.active ? "bg-green-600" : ""}
                              data-testid={`badge-menu-status-${menu.id}`}
                            >
                              {menu.active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mt-2 space-y-3">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <UtensilsCrossed className="h-3 w-3" />
                              {menu.type}
                            </span>
                            <span>{itemIds.length} Items</span>
                          </div>

                          <div className="bg-primary/5 border border-primary/20 rounded p-3">
                            <p className="text-sm text-muted-foreground">Menu Price:</p>
                            <p className="text-2xl font-bold text-primary">{currency} {Number(menu.price).toFixed(2)}</p>
                          </div>
                          
                          {menuItemsList.length > 0 && (
                            <div className="border-t pt-3">
                              <p className="text-sm font-medium mb-2">Includes {menuItemsList.length} items:</p>
                              <div className="space-y-1">
                                {menuItemsList.slice(0, 3).map((item: any) => (
                                  <div key={item.id} className="text-xs text-muted-foreground flex justify-between">
                                    <span>{item.name}</span>
                                    <span>{currency} {Number(item.price).toFixed(2)}</span>
                                  </div>
                                ))}
                                {menuItemsList.length > 3 && (
                                  <div className="text-xs text-muted-foreground italic">+ {menuItemsList.length - 3} more items</div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between pt-3 border-t">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={menu.active}
                                onCheckedChange={() => handleToggleMenu(menu)}
                                data-testid={`switch-menu-${menu.id}`}
                              />
                              <span className={`text-xs ${menu.active ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {menu.active ? "Active" : "Inactive"}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditMenu(menu)}
                                data-testid={`button-edit-menu-${menu.id}`}
                              >
                                <Edit className="h-4 w-4" />
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
