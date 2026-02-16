import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Save, Calendar, UtensilsCrossed, ChefHat, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminRestaurantMenu({ role = "owner" }: { role?: "owner" | "manager" }) {
  const { toast } = useToast();
  
  // Available Items (Simulated from Settings)
  const [availableItems, setAvailableItems] = useState([
    { id: 1, name: "Club Sandwich", category: "Food", price: 15 },
    { id: 2, name: "Cappuccino", category: "Beverage", price: 5 },
    { id: 3, name: "Caesar Salad", category: "Food", price: 12 },
    { id: 4, name: "Fresh Juice", category: "Beverage", price: 6 },
    { id: 5, name: "Steak Dinner", category: "Food", price: 25 },
  ]);

  // Load items from Settings
  useEffect(() => {
    const savedItems = localStorage.getItem("restaurantItems");
    if (savedItems) {
      setAvailableItems(JSON.parse(savedItems));
    }
  }, []);

  // Menus State
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

  const handleAddMenu = () => {
    setMenus([...menus, { id: Date.now(), ...newMenu, active: true }]);
    setIsMenuDialogOpen(false);
    setNewMenu({ name: "", type: "Daily", schedule: "", items: [] });
    toast({
      title: "Menu Created",
      description: `${newMenu.name} has been created successfully.`,
    });
  };

  const handleDeleteMenu = (id: number) => {
    setMenus(menus.filter(m => m.id !== id));
    toast({
      title: "Menu Deleted",
      description: "Menu has been removed.",
    });
  };

  const toggleMenuItem = (itemId: number) => {
    if (newMenu.items.includes(itemId)) {
      setNewMenu({ ...newMenu, items: newMenu.items.filter(id => id !== itemId) });
    } else {
      setNewMenu({ ...newMenu, items: [...newMenu.items, itemId] });
    }
  };

  return (
    <AdminLayout role={role}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Restaurant Menu Management</h2>
            <p className="text-muted-foreground">Create and manage daily menus, special event menus, and seasonal offerings.</p>
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
                <DialogTitle>Create New Menu</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Menu Name</Label>
                  <Input 
                    placeholder="e.g. Summer Brunch" 
                    value={newMenu.name}
                    onChange={(e) => setNewMenu({...newMenu, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Menu Type</Label>
                    <Select 
                      value={newMenu.type}
                      onValueChange={(val) => setNewMenu({...newMenu, type: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Daily">Daily / Regular</SelectItem>
                        <SelectItem value="Event">Special Event</SelectItem>
                        <SelectItem value="Seasonal">Seasonal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Schedule / Date</Label>
                    <Input 
                      placeholder="e.g. Mon-Fri, 6am-11am" 
                      value={newMenu.schedule}
                      onChange={(e) => setNewMenu({...newMenu, schedule: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Select Items</Label>
                  <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto space-y-2">
                    {availableItems.map(item => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`item-${item.id}`} 
                          checked={newMenu.items.includes(item.id)}
                          onCheckedChange={() => toggleMenuItem(item.id)}
                        />
                        <label htmlFor={`item-${item.id}`} className="flex-1 flex justify-between text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          <span>{item.name}</span>
                          <span className="text-muted-foreground">${item.price}</span>
                        </label>
                      </div>
                    ))}
                    {availableItems.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No items available. Add items in Settings first.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsMenuDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddMenu}>Create Menu</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menus.map((menu) => (
            <Card key={menu.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <ChefHat className="h-5 w-5 text-primary" />
                      {menu.name}
                    </CardTitle>
                    <CardDescription className="mt-1">{menu.schedule}</CardDescription>
                  </div>
                  <Badge variant={menu.active ? "default" : "secondary"} className={menu.active ? "bg-green-600" : ""}>
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
                  
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium mb-2">Featured Items:</p>
                    <div className="space-y-1">
                      {menu.items.slice(0, 3).map(itemId => {
                        const item = availableItems.find(i => i.id === itemId);
                        return item ? (
                          <div key={itemId} className="text-xs text-muted-foreground flex justify-between">
                            <span>{item.name}</span>
                            <span>${item.price}</span>
                          </div>
                        ) : null;
                      })}
                      {menu.items.length > 3 && (
                        <div className="text-xs text-muted-foreground italic">+ {menu.items.length - 3} more items</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-4 pt-2 border-t">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteMenu(menu.id)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}