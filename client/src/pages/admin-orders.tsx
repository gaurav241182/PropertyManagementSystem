import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Utensils, Plus, Filter, Clock, CheckCircle, ChefHat, Pencil, Trash2, Archive } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useHotelSettings } from "@/hooks/use-hotel-settings";
import { usePermissions } from "@/hooks/use-permissions";

type OrderStatus = "Pending" | "Accepted" | "Fulfilled" | "Cancelled";
type OrderType = "Food" | "Facility";

interface ApiOrderItem {
  id: number;
  orderId: string;
  itemName: string;
  price: string;
  quantity: number;
}

interface ApiOrder {
  id: number;
  orderId: string;
  bookingId: string;
  guestName: string;
  roomNumber: string;
  type: string;
  status: string;
  totalAmount: string;
  notes: string | null;
  servingTime: string | null;
  createdAt: string;
  items: ApiOrderItem[];
}

interface ApiMenuItem {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string;
  available: boolean;
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

interface ApiFacility {
  id: number;
  name: string;
  description: string;
  price: string;
  unit: string;
  active: boolean;
}

interface ApiBooking {
  id: number;
  bookingId: string;
  guestName: string;
  guestLastName: string;
  roomId: number;
  roomNumber?: string;
  status: string;
  [key: string]: any;
}

export default function AdminOrders({ role = "owner" }: { role?: "owner" | "manager" }) {
  const { toast } = useToast();
  const { currencySymbol, formatDateTime } = useHotelSettings();
  const { canCreate, canDelete } = usePermissions();

  const { data: orders = [] } = useQuery<ApiOrder[]>({ queryKey: ['/api/orders'] });
  const { data: menuItems = [] } = useQuery<ApiMenuItem[]>({ queryKey: ['/api/menu-items'] });
  const { data: menus = [] } = useQuery<ApiMenu[]>({ queryKey: ['/api/menus'] });
  const { data: facilityItems = [] } = useQuery<ApiFacility[]>({ queryKey: ['/api/facilities'] });
  const { data: bookings = [] } = useQuery<ApiBooking[]>({ queryKey: ['/api/bookings'] });

  const activeMenus = menus.filter((m: ApiMenu) => m.active);

  const findFoodProduct = (itemId: string): { name: string; price: string } | undefined => {
    if (itemId.startsWith("menu-")) {
      const menuId = parseInt(itemId.replace("menu-", ""));
      const menu = menus.find((m: ApiMenu) => m.id === menuId);
      if (menu) return { name: menu.name, price: menu.price };
    } else {
      return menuItems.find((m: ApiMenuItem) => m.id.toString() === itemId);
    }
    return undefined;
  };

  const activeBookings = bookings.filter((b: ApiBooking) => b.status === "confirmed" || b.status === "checked_in");

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/orders", data);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create order");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
    onError: (error: Error) => {
      toast({ title: "Order Failed", description: error.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/booking-charges'] });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/orders/${id}`, data);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update order");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({ title: "Order Updated", description: "Order has been updated successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/orders/${id}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete order");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({ title: "Order Deleted", description: "The order has been permanently deleted." });
    },
    onError: (error: Error) => {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    },
  });

  const archiveOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/orders/${id}/archive`, {});
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to archive order");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({ title: "Order Archived", description: "Order moved to the archive in Settings." });
    },
    onError: (error: Error) => {
      toast({ title: "Archive Failed", description: error.message, variant: "destructive" });
    },
  });

  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newOrder, setNewOrder] = useState<{
    bookingId: string;
    type: OrderType;
    items: { itemId: string; quantity: number }[];
    notes: string;
    servingTimeOption: string;
    servingTimeCustom: string;
  }>({
    bookingId: "",
    type: "Food",
    items: [],
    notes: "",
    servingTimeOption: "now",
    servingTimeCustom: ""
  });

  const [editingOrder, setEditingOrder] = useState<ApiOrder | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editServingTimeOption, setEditServingTimeOption] = useState("now");
  const [editServingTimeCustom, setEditServingTimeCustom] = useState("");
  const [editItems, setEditItems] = useState<{ itemName: string; price: string; quantity: number }[]>([]);

  const [deletingOrder, setDeletingOrder] = useState<ApiOrder | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const openEditDialog = (order: ApiOrder) => {
    setEditingOrder(order);
    setEditNotes(order.notes || "");
    setEditItems(order.items.map(i => ({ itemName: i.itemName, price: i.price, quantity: i.quantity })));
    if (order.servingTime) {
      const dt = new Date(order.servingTime);
      const localDT = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setEditServingTimeOption("custom");
      setEditServingTimeCustom(localDT);
    } else {
      setEditServingTimeOption("now");
      setEditServingTimeCustom("");
    }
    setIsEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (!editingOrder) return;
    const servingTime = getServingDateTime(editServingTimeOption, editServingTimeCustom);
    const total = editItems.reduce((sum, i) => sum + parseFloat(i.price || "0") * i.quantity, 0);
    updateOrderMutation.mutate({
      id: editingOrder.id,
      data: {
        notes: editNotes || null,
        servingTime,
        totalAmount: total.toFixed(2),
        items: editItems,
      }
    }, {
      onSuccess: () => { setIsEditDialogOpen(false); setEditingOrder(null); }
    });
  };

  const addItemToEditOrder = (itemName: string, price: string) => {
    const existing = editItems.find(i => i.itemName === itemName);
    if (existing) {
      setEditItems(editItems.map(i => i.itemName === itemName ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setEditItems([...editItems, { itemName, price, quantity: 1 }]);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingOrder || !deletePassword) return;
    const verifyRes = await apiRequest("POST", "/api/auth/verify-password", { password: deletePassword });
    if (!verifyRes.ok) {
      toast({ title: "Incorrect Password", description: "Please enter the correct admin password.", variant: "destructive" });
      return;
    }
    deleteOrderMutation.mutate(deletingOrder.id, {
      onSuccess: () => { setIsDeleteDialogOpen(false); setDeletingOrder(null); setDeletePassword(""); }
    });
  };

  const getServingDateTime = (option: string, custom: string): string | null => {
    const now = new Date();
    switch (option) {
      case "now": return now.toISOString();
      case "1hour": return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      case "2hours": return new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
      case "3hours": return new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();
      case "breakfast": {
        const d = new Date(now); d.setHours(8, 0, 0, 0);
        if (d <= now) d.setDate(d.getDate() + 1);
        return d.toISOString();
      }
      case "lunch": {
        const d = new Date(now); d.setHours(13, 0, 0, 0);
        if (d <= now) d.setDate(d.getDate() + 1);
        return d.toISOString();
      }
      case "dinner": {
        const d = new Date(now); d.setHours(20, 0, 0, 0);
        if (d <= now) d.setDate(d.getDate() + 1);
        return d.toISOString();
      }
      case "custom": return custom ? new Date(custom).toISOString() : now.toISOString();
      default: return now.toISOString();
    }
  };

  const formatServingTime = (servingTime: string | null) => {
    if (!servingTime) return null;
    const st = new Date(servingTime);
    const now = new Date();
    const diffMs = st.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins <= 5 && diffMins >= -5) return "Serve Now";
    if (diffMins > 0 && diffMins <= 60) return `In ${diffMins} min`;
    if (diffMins > 60 && diffMins <= 180) return `In ${Math.round(diffMins / 60)}h ${diffMins % 60}m`;
    return formatDateTime(st);
  };

  const filteredOrders = orders
    .filter((order: ApiOrder) => statusFilter === "All" || order.status === statusFilter)
    .sort((a: ApiOrder, b: ApiOrder) => {
      const aTime = a.servingTime ? new Date(a.servingTime).getTime() : new Date(a.createdAt).getTime();
      const bTime = b.servingTime ? new Date(b.servingTime).getTime() : new Date(b.createdAt).getTime();
      if (a.status === "Fulfilled" || a.status === "Cancelled") {
        if (b.status !== "Fulfilled" && b.status !== "Cancelled") return 1;
      }
      if (b.status === "Fulfilled" || b.status === "Cancelled") {
        if (a.status !== "Fulfilled" && a.status !== "Cancelled") return -1;
      }
      return aTime - bTime;
    });

  const handleCreateOrder = () => {
    if (!newOrder.bookingId || newOrder.items.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select a guest and add at least one item.",
        variant: "destructive"
      });
      return;
    }

    const booking = activeBookings.find((b: ApiBooking) => b.bookingId === newOrder.bookingId);
    if (!booking) return;

    const orderItems = newOrder.items.map(item => {
      let product: { name: string; price: string } | undefined;
      if (newOrder.type === "Food") {
        product = findFoodProduct(item.itemId);
      } else {
        product = facilityItems.find((f: ApiFacility) => f.id.toString() === item.itemId);
      }
      return {
        itemName: product?.name || "Unknown Item",
        price: product?.price || "0",
        quantity: item.quantity
      };
    });

    const total = orderItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

    const roomNumber = (booking as any).roomNumber || (booking as any).roomId?.toString() || "";

    const servingTime = getServingDateTime(newOrder.servingTimeOption, newOrder.servingTimeCustom);

    createOrderMutation.mutate({
      orderId: `ORD-${Date.now().toString().slice(-6)}`,
      bookingId: booking.bookingId,
      guestName: booking.guestName,
      roomNumber: roomNumber,
      type: newOrder.type,
      status: "Pending",
      totalAmount: total.toFixed(2),
      notes: newOrder.notes || null,
      servingTime,
      items: orderItems,
    }, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setNewOrder({ bookingId: "", type: "Food", items: [], notes: "", servingTimeOption: "now", servingTimeCustom: "" });
        toast({
          title: "Order Created",
          description: `Order for Room ${roomNumber} has been placed successfully.`
        });
      }
    });
  };

  const handleStatusChange = (order: ApiOrder, newStatus: OrderStatus) => {
    updateStatusMutation.mutate({ id: order.id, status: newStatus }, {
      onSuccess: () => {
        if (newStatus === "Fulfilled") {
          toast({
            title: "Order Fulfilled",
            description: "Charges have been added to the booking ledger."
          });
        }
      }
    });
  };

  const addItemToOrder = (itemId: string) => {
    const existing = newOrder.items.find(i => i.itemId === itemId);
    if (existing) {
      setNewOrder({
        ...newOrder,
        items: newOrder.items.map(i => i.itemId === itemId ? { ...i, quantity: i.quantity + 1 } : i)
      });
    } else {
      setNewOrder({
        ...newOrder,
        items: [...newOrder.items, { itemId, quantity: 1 }]
      });
    }
  };

  const removeItemFromOrder = (itemId: string) => {
    setNewOrder({
      ...newOrder,
      items: newOrder.items.filter(i => i.itemId !== itemId)
    });
  };

  return (
    <AdminLayout role={role}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Orders & Room Service</h2>
            <p className="text-muted-foreground">Manage food and facility orders for active guests.</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            {canCreate("orders") && (
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground">
                  <Plus className="mr-2 h-4 w-4" /> Create Order
                </Button>
              </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>Place an order for a guest. Charges will be added to their bill.</DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                <div className="space-y-2">
                  <Label>Select Guest / Room</Label>
                  <Select 
                    value={newOrder.bookingId} 
                    onValueChange={(val) => setNewOrder({...newOrder, bookingId: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select active booking..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeBookings.map((booking: ApiBooking) => (
                        <SelectItem key={booking.bookingId} value={booking.bookingId}>
                          {booking.guestName} · Room {booking.roomNumber || booking.roomId} ({booking.bookingId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Tabs defaultValue="Food" onValueChange={(val) => setNewOrder({...newOrder, type: val as OrderType, items: []})}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="Food">Food & Beverage</TabsTrigger>
                    <TabsTrigger value="Facility">Facilities</TabsTrigger>
                  </TabsList>
                  
                  <div className="mt-4 border rounded-md p-4 h-60 overflow-y-auto">
                    <TabsContent value="Food" className="mt-0 space-y-2">
                      {activeMenus.length > 0 && (
                        <>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b flex items-center gap-1">
                            <ChefHat className="h-3 w-3" /> Menus & Buffets
                          </p>
                          {activeMenus.map((menu: ApiMenu) => (
                            <div key={`menu-${menu.id}`} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg bg-primary/5">
                              <div>
                                <p className="font-medium flex items-center gap-1">
                                  <ChefHat className="h-3.5 w-3.5 text-primary" />
                                  {menu.name}
                                </p>
                                <p className="text-xs text-muted-foreground">{currencySymbol}{menu.price} &middot; {menu.type}</p>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => addItemToOrder(`menu-${menu.id}`)} data-testid={`button-add-menu-order-${menu.id}`}>Add</Button>
                            </div>
                          ))}
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1 pt-2 border-b flex items-center gap-1">
                            <Utensils className="h-3 w-3" /> Individual Items
                          </p>
                        </>
                      )}
                      {menuItems.filter((item: ApiMenuItem) => item.available).map((item: ApiMenuItem) => (
                        <div key={item.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{currencySymbol}{item.price}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => addItemToOrder(item.id.toString())}>Add</Button>
                        </div>
                      ))}
                    </TabsContent>
                    <TabsContent value="Facility" className="mt-0 space-y-2">
                      {facilityItems.filter((item: ApiFacility) => item.active).map((item: ApiFacility) => (
                        <div key={item.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{currencySymbol}{item.price} / {item.unit}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => addItemToOrder(item.id.toString())}>Add</Button>
                        </div>
                      ))}
                    </TabsContent>
                  </div>
                </Tabs>

                <div className="space-y-2">
                  <Label>Order Summary</Label>
                  {newOrder.items.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic border border-dashed p-4 rounded text-center">
                      No items selected
                    </div>
                  ) : (
                    <div className="border rounded-md divide-y">
                      {newOrder.items.map((item, idx) => {
                        const product = newOrder.type === "Food" 
                          ? findFoodProduct(item.itemId)
                          : facilityItems.find((f: ApiFacility) => f.id.toString() === item.itemId);
                        
                        return (
                          <div key={idx} className="flex items-center justify-between p-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="h-5 w-5 flex items-center justify-center p-0 rounded-full">
                                {item.quantity}
                              </Badge>
                              <span>{item.itemId.startsWith("menu-") && <ChefHat className="inline h-3 w-3 mr-1 text-primary" />}{product?.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{currencySymbol}{(parseFloat(product?.price || "0") * item.quantity).toFixed(2)}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => removeItemFromOrder(item.itemId)}>
                                <span className="sr-only">Remove</span>
                                &times;
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      <div className="p-2 bg-muted/20 flex justify-between font-bold">
                        <span>Total</span>
                        <span>
                          {currencySymbol}{newOrder.items.reduce((sum, item) => {
                            const product = newOrder.type === "Food" 
                              ? findFoodProduct(item.itemId)
                              : facilityItems.find((f: ApiFacility) => f.id.toString() === item.itemId);
                            return sum + (parseFloat(product?.price || "0") * item.quantity);
                          }, 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Serving Time</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "now", label: "Serve Now", icon: "⚡" },
                      { value: "breakfast", label: "Breakfast", icon: "🌅" },
                      { value: "lunch", label: "Lunch", icon: "☀️" },
                      { value: "dinner", label: "Dinner", icon: "🌙" },
                      { value: "1hour", label: "1 Hour", icon: "🕐" },
                      { value: "2hours", label: "2 Hours", icon: "🕑" },
                      { value: "3hours", label: "3 Hours", icon: "🕒" },
                      { value: "custom", label: "Custom", icon: "📅" },
                    ].map(opt => (
                      <Button
                        key={opt.value}
                        type="button"
                        size="sm"
                        variant={newOrder.servingTimeOption === opt.value ? "default" : "outline"}
                        className={`text-xs ${newOrder.servingTimeOption === opt.value ? "" : "hover:bg-muted/50"}`}
                        onClick={() => setNewOrder({...newOrder, servingTimeOption: opt.value})}
                        data-testid={`button-serving-${opt.value}`}
                      >
                        <span className="mr-1">{opt.icon}</span> {opt.label}
                      </Button>
                    ))}
                  </div>
                  {newOrder.servingTimeOption === "custom" && (
                    <Input
                      type="datetime-local"
                      value={newOrder.servingTimeCustom}
                      onChange={(e) => setNewOrder({...newOrder, servingTimeCustom: e.target.value})}
                      data-testid="input-serving-custom"
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    {newOrder.servingTimeOption === "now" && "Order will be prepared immediately."}
                    {newOrder.servingTimeOption === "breakfast" && "Scheduled for breakfast service (8:00 AM)."}
                    {newOrder.servingTimeOption === "lunch" && "Scheduled for lunch service (1:00 PM)."}
                    {newOrder.servingTimeOption === "dinner" && "Scheduled for dinner service (8:00 PM)."}
                    {newOrder.servingTimeOption === "1hour" && "To be prepared in 1 hour."}
                    {newOrder.servingTimeOption === "2hours" && "To be prepared in 2 hours."}
                    {newOrder.servingTimeOption === "3hours" && "To be prepared in 3 hours."}
                    {newOrder.servingTimeOption === "custom" && "Select a custom date and time."}
                  </p>
                </div>

                <div className="space-y-2">
                   <Label>Special Instructions (Optional)</Label>
                   <Input 
                     placeholder="e.g. No allergies, extra towels..." 
                     value={newOrder.notes}
                     onChange={(e) => setNewOrder({...newOrder, notes: e.target.value})}
                   />
                </div>

              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateOrder} disabled={createOrderMutation.isPending}>
                  {createOrderMutation.isPending ? "Placing..." : "Place Order"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-muted/30 border-none shadow-none">
          <CardContent className="p-4 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter Status:</span>
            </div>
            <div className="flex gap-2">
              {["All", "Pending", "Accepted", "Fulfilled", "Cancelled"].map(status => (
                <Badge 
                  key={status} 
                  variant={statusFilter === status ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredOrders.length === 0 ? (
             <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg bg-muted/10">
               <h3 className="text-lg font-medium">No Orders Found</h3>
               <p className="text-muted-foreground text-sm">No orders match your current filter.</p>
             </div>
          ) : (
            filteredOrders.map((order: ApiOrder) => (
              <div key={order.id} className={`rounded-lg border bg-card overflow-hidden flex flex-col ${
                order.status === 'Pending' ? 'border-l-4 border-l-amber-500' :
                order.status === 'Accepted' ? 'border-l-4 border-l-blue-500' :
                order.status === 'Fulfilled' ? 'border-l-4 border-l-green-500 opacity-70' :
                'border-l-4 border-l-gray-300 opacity-60'
              }`}>

                {/* Compact header row */}
                <div className={`flex items-center justify-between px-3 py-2 ${
                  order.status === 'Pending' ? 'bg-amber-50' :
                  order.status === 'Accepted' ? 'bg-blue-50' :
                  order.status === 'Fulfilled' ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[11px] font-semibold text-muted-foreground shrink-0">{order.orderId}</span>
                    <span className="text-[11px] text-muted-foreground">·</span>
                    <span className="text-[11px] font-semibold truncate">
                      {order.guestName} <span className="font-normal text-muted-foreground">R{order.roomNumber}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <Badge className={`text-[10px] px-1.5 py-0 h-5 ${
                      order.status === 'Pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      order.status === 'Accepted' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      order.status === 'Fulfilled' ? 'bg-green-100 text-green-700 border-green-200' :
                      'bg-gray-100 text-gray-500 border-gray-200'
                    }`} variant="outline">
                      {order.status}
                    </Badge>
                  </div>
                </div>

                {/* Serving time pill */}
                {order.servingTime && (
                  <div className="px-3 pt-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
                      🍽️ {formatServingTime(order.servingTime)}
                    </span>
                  </div>
                )}

                {/* Items — primary content */}
                <div className="px-3 py-2 flex-1 space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded font-bold text-sm shrink-0 ${
                        order.status === 'Accepted' ? 'bg-blue-600 text-white' :
                        order.status === 'Pending' ? 'bg-amber-500 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>{item.quantity}</span>
                      <span className="font-semibold text-sm leading-tight">{item.itemName}</span>
                    </div>
                  ))}
                  {order.notes && (
                    <div className="mt-1.5 bg-amber-50 text-amber-800 px-2 py-1 rounded text-[11px] border border-amber-100">
                      ⚠ {order.notes}
                    </div>
                  )}
                </div>

                {/* Action row */}
                <div className={`px-2 py-1.5 border-t flex items-center gap-1 ${
                  order.status === 'Pending' ? 'bg-amber-50/50' :
                  order.status === 'Accepted' ? 'bg-blue-50/50' : 'bg-muted/20'
                }`}>
                  {order.status === "Pending" && (
                    <>
                      <Button size="sm" variant="outline" className="flex-1 h-7 text-xs border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleStatusChange(order, "Cancelled")} data-testid={`button-reject-${order.id}`}>Reject</Button>
                      <Button size="sm" className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => handleStatusChange(order, "Accepted")} data-testid={`button-accept-${order.id}`}>Accept</Button>
                    </>
                  )}
                  {order.status === "Accepted" && (
                    <Button size="sm" className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange(order, "Fulfilled")} data-testid={`button-fulfill-${order.id}`}>
                      <CheckCircle className="mr-1 h-3 w-3" /> Fulfilled
                    </Button>
                  )}
                  {order.status === "Fulfilled" && (
                    <span className="flex-1 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" /> Billed
                    </span>
                  )}
                  {order.status === "Cancelled" && (
                    <span className="flex-1 text-center text-[11px] text-muted-foreground">Cancelled</span>
                  )}
                  <div className="flex gap-0.5 shrink-0">
                    {(order.status === "Pending" || order.status === "Accepted") && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-500 hover:bg-blue-50" onClick={() => openEditDialog(order)} data-testid={`button-edit-order-${order.id}`}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                    {(order.status === "Fulfilled" || order.status === "Cancelled") && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:bg-gray-100" onClick={() => archiveOrderMutation.mutate(order.id)} disabled={archiveOrderMutation.isPending} data-testid={`button-archive-order-${order.id}`}>
                        <Archive className="h-3 w-3" />
                      </Button>
                    )}
                    {canDelete("orders") && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:bg-red-50 hover:text-red-600" onClick={() => { setDeletingOrder(order); setDeletePassword(""); setIsDeleteDialogOpen(true); }} data-testid={`button-delete-order-${order.id}`}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setEditingOrder(null); }}>
        <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>
              {editingOrder?.orderId} — {editingOrder?.guestName} · Room {editingOrder?.roomNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            {/* Add items from catalogue */}
            {editingOrder?.type === "Food" && (
              <div className="space-y-2">
                <Label>Add Items</Label>
                <div className="border rounded-md h-44 overflow-y-auto divide-y">
                  {activeMenus.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 bg-muted/30 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 sticky top-0">
                        <ChefHat className="h-3 w-3" /> Menus & Buffets
                      </div>
                      {activeMenus.map((menu: ApiMenu) => (
                        <div key={`menu-${menu.id}`} className="flex items-center justify-between px-3 py-2 hover:bg-muted/30">
                          <div>
                            <p className="text-sm font-medium flex items-center gap-1">
                              <ChefHat className="h-3 w-3 text-primary" /> {menu.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{currencySymbol}{menu.price} · {menu.type}</p>
                          </div>
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => addItemToEditOrder(menu.name, menu.price)} data-testid={`button-edit-add-menu-${menu.id}`}>Add</Button>
                        </div>
                      ))}
                    </>
                  )}
                  <div className="px-3 py-1.5 bg-muted/30 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 sticky top-0">
                    <Utensils className="h-3 w-3" /> Individual Items
                  </div>
                  {menuItems.filter((item: ApiMenuItem) => item.available).map((item: ApiMenuItem) => (
                    <div key={item.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{currencySymbol}{item.price}</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => addItemToEditOrder(item.name, item.price)} data-testid={`button-edit-add-item-${item.id}`}>Add</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {editingOrder?.type === "Facility" && (
              <div className="space-y-2">
                <Label>Add Facilities</Label>
                <div className="border rounded-md h-44 overflow-y-auto divide-y">
                  {facilityItems.filter((item: ApiFacility) => item.active).map((item: ApiFacility) => (
                    <div key={item.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{currencySymbol}{item.price} / {item.unit}</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => addItemToEditOrder(item.name, item.price)} data-testid={`button-edit-add-facility-${item.id}`}>Add</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Order Items</Label>
              <div className="border rounded-md divide-y">
                {editItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 text-sm">
                    <span className="flex-1">{item.itemName}</span>
                    <span className="text-muted-foreground text-xs">{currencySymbol}{parseFloat(item.price).toFixed(2)} each</span>
                    <div className="flex items-center gap-1">
                      <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditItems(editItems.map((i, j) => j === idx ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))}>−</Button>
                      <span className="w-5 text-center font-medium">{item.quantity}</span>
                      <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditItems(editItems.map((i, j) => j === idx ? { ...i, quantity: i.quantity + 1 } : i))}>+</Button>
                    </div>
                    <span className="w-16 text-right font-medium">{currencySymbol}{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                    <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setEditItems(editItems.filter((_, j) => j !== idx))}>
                      ×
                    </Button>
                  </div>
                ))}
                {editItems.length > 0 && (
                  <div className="p-2 bg-muted/20 flex justify-between font-bold text-sm">
                    <span>Total</span>
                    <span>{currencySymbol}{editItems.reduce((sum, i) => sum + parseFloat(i.price || "0") * i.quantity, 0).toFixed(2)}</span>
                  </div>
                )}
                {editItems.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground italic">No items — order will be empty</div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Serving Time</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "now", label: "Now", icon: "⚡" },
                  { value: "breakfast", label: "Breakfast", icon: "🌅" },
                  { value: "lunch", label: "Lunch", icon: "☀️" },
                  { value: "dinner", label: "Dinner", icon: "🌙" },
                  { value: "1hour", label: "1h", icon: "🕐" },
                  { value: "2hours", label: "2h", icon: "🕑" },
                  { value: "3hours", label: "3h", icon: "🕒" },
                  { value: "custom", label: "Custom", icon: "📅" },
                ].map(opt => (
                  <Button key={opt.value} type="button" size="sm" variant={editServingTimeOption === opt.value ? "default" : "outline"}
                    className="text-xs" onClick={() => setEditServingTimeOption(opt.value)}>
                    <span className="mr-1">{opt.icon}</span> {opt.label}
                  </Button>
                ))}
              </div>
              {editServingTimeOption === "custom" && (
                <Input type="datetime-local" value={editServingTimeCustom} onChange={(e) => setEditServingTimeCustom(e.target.value)} />
              )}
            </div>

            <div className="space-y-2">
              <Label>Special Instructions</Label>
              <Input placeholder="Notes for kitchen..." value={editNotes} onChange={(e) => setEditNotes(e.target.value)} data-testid="input-edit-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingOrder(null); }}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={updateOrderMutation.isPending}>
              {updateOrderMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Order Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { setIsDeleteDialogOpen(open); if (!open) { setDeletingOrder(null); setDeletePassword(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" /> Delete Order
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>You are about to permanently delete order <strong>{deletingOrder?.orderId}</strong> for <strong>{deletingOrder?.guestName}</strong> (Room {deletingOrder?.roomNumber}). This cannot be undone.</p>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Enter your admin password to confirm</Label>
                  <Input
                    type="password"
                    placeholder="Admin password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleDeleteConfirm()}
                    data-testid="input-delete-order-password"
                    autoComplete="current-password"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={(e) => { e.preventDefault(); handleDeleteConfirm(); }}
              disabled={!deletePassword || deleteOrderMutation.isPending}
              data-testid="button-confirm-delete-order"
            >
              {deleteOrderMutation.isPending ? "Deleting..." : "Delete Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AdminLayout>
  );
}