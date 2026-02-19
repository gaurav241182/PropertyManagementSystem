import { useState, useEffect } from "react";
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
import { Utensils, Sparkles, Plus, Search, Filter, Clock, CheckCircle, ChefHat, User, Hotel } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Types
type OrderStatus = "Pending" | "Accepted" | "Fulfilled" | "Cancelled";
type OrderType = "Food" | "Facility";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  bookingId: string;
  guestName: string;
  roomNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  type: OrderType;
  createdAt: string; // ISO string
  notes?: string;
}

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
}

interface FacilityItem {
  id: number;
  name: string;
  price: number;
  unit: string;
}

export default function AdminOrders({ role = "owner" }: { role?: "owner" | "manager" }) {
  const { toast } = useToast();
  
  // Mock Data
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "ORD-001",
      bookingId: "BK-101",
      guestName: "John Doe",
      roomNumber: "101",
      items: [
        { id: "1", name: "Club Sandwich", price: 15, quantity: 2 },
        { id: "2", name: "Cappuccino", price: 5, quantity: 2 }
      ],
      totalAmount: 40,
      status: "Pending",
      type: "Food",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
      notes: "No mayo please"
    },
    {
      id: "ORD-002",
      bookingId: "BK-105",
      guestName: "Sarah Smith",
      roomNumber: "205",
      items: [
        { id: "1", name: "Airport Pickup", price: 50, quantity: 1 }
      ],
      totalAmount: 50,
      status: "Accepted",
      type: "Facility",
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    },
    {
      id: "ORD-003",
      bookingId: "BK-102",
      guestName: "Michael Brown",
      roomNumber: "104",
      items: [
        { id: "3", name: "Caesar Salad", price: 12, quantity: 1 }
      ],
      totalAmount: 12,
      status: "Fulfilled",
      type: "Food",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    }
  ]);

  // Mock Bookings for selection
  const activeBookings = [
    { id: "BK-101", guestName: "John Doe", roomNumber: "101" },
    { id: "BK-102", guestName: "Michael Brown", roomNumber: "104" },
    { id: "BK-105", guestName: "Sarah Smith", roomNumber: "205" },
    { id: "BK-108", guestName: "Emily Davis", roomNumber: "302" },
  ];

  // Mock Menu Items
  const menuItems: MenuItem[] = [
    { id: 1, name: "Club Sandwich", category: "Food", price: 15 },
    { id: 2, name: "Cappuccino", category: "Beverage", price: 5 },
    { id: 3, name: "Caesar Salad", category: "Food", price: 12 },
    { id: 4, name: "Burger", category: "Food", price: 18 },
    { id: 5, name: "Pasta Alfredo", category: "Food", price: 20 },
  ];

  // Mock Facilities
  const facilityItems: FacilityItem[] = [
    { id: 1, name: "Extra Bed", price: 30, unit: "night" },
    { id: 2, name: "Airport Pickup", price: 50, unit: "trip" },
    { id: 3, name: "Spa Treatment", price: 80, unit: "session" },
    { id: 4, name: "Laundry Service", price: 15, unit: "load" },
  ];

  // State for filtering and creation
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newOrder, setNewOrder] = useState<{
    bookingId: string;
    type: OrderType;
    items: { itemId: string; quantity: number }[];
    notes: string;
  }>({
    bookingId: "",
    type: "Food",
    items: [],
    notes: ""
  });

  // Filter orders
  const filteredOrders = orders
    .filter(order => statusFilter === "All" || order.status === statusFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Handle Create Order
  const handleCreateOrder = () => {
    if (!newOrder.bookingId || newOrder.items.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select a guest and add at least one item.",
        variant: "destructive"
      });
      return;
    }

    const booking = activeBookings.find(b => b.id === newOrder.bookingId);
    if (!booking) return;

    const orderItems: OrderItem[] = newOrder.items.map(item => {
      let product;
      if (newOrder.type === "Food") {
        product = menuItems.find(m => m.id.toString() === item.itemId);
      } else {
        product = facilityItems.find(f => f.id.toString() === item.itemId);
      }
      return {
        id: item.itemId,
        name: product?.name || "Unknown Item",
        price: product?.price || 0,
        quantity: item.quantity
      };
    });

    const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const createdOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-3)}`,
      bookingId: booking.id,
      guestName: booking.guestName,
      roomNumber: booking.roomNumber,
      items: orderItems,
      totalAmount: total,
      status: "Pending",
      type: newOrder.type,
      createdAt: new Date().toISOString(),
      notes: newOrder.notes
    };

    setOrders([createdOrder, ...orders]);
    setIsCreateDialogOpen(false);
    setNewOrder({ bookingId: "", type: "Food", items: [], notes: "" });
    
    toast({
      title: "Order Created",
      description: `Order for Room ${booking.roomNumber} has been placed successfully.`
    });
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    
    if (newStatus === "Fulfilled") {
      toast({
        title: "Order Fulfilled",
        description: "Charges have been added to the booking ledger."
      });
    }
  };

  // Helper to add items to new order
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
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> Create Order
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>Place an order for a guest. Charges will be added to their bill.</DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                {/* Guest Selection */}
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
                      {activeBookings.map(booking => (
                        <SelectItem key={booking.id} value={booking.id}>
                          Room {booking.roomNumber} - {booking.guestName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Order Type Toggle */}
                <Tabs defaultValue="Food" onValueChange={(val) => setNewOrder({...newOrder, type: val as OrderType, items: []})}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="Food">Food & Beverage</TabsTrigger>
                    <TabsTrigger value="Facility">Facilities</TabsTrigger>
                  </TabsList>
                  
                  <div className="mt-4 border rounded-md p-4 h-60 overflow-y-auto">
                    <TabsContent value="Food" className="mt-0 space-y-2">
                      {menuItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">${item.price}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => addItemToOrder(item.id.toString())}>Add</Button>
                        </div>
                      ))}
                    </TabsContent>
                    <TabsContent value="Facility" className="mt-0 space-y-2">
                      {facilityItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">${item.price} / {item.unit}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => addItemToOrder(item.id.toString())}>Add</Button>
                        </div>
                      ))}
                    </TabsContent>
                  </div>
                </Tabs>

                {/* Selected Items */}
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
                          ? menuItems.find(m => m.id.toString() === item.itemId)
                          : facilityItems.find(f => f.id.toString() === item.itemId);
                        
                        return (
                          <div key={idx} className="flex items-center justify-between p-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="h-5 w-5 flex items-center justify-center p-0 rounded-full">
                                {item.quantity}
                              </Badge>
                              <span>{product?.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">${(product?.price || 0) * item.quantity}</span>
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
                          ${newOrder.items.reduce((sum, item) => {
                            const product = newOrder.type === "Food" 
                              ? menuItems.find(m => m.id.toString() === item.itemId)
                              : facilityItems.find(f => f.id.toString() === item.itemId);
                            return sum + ((product?.price || 0) * item.quantity);
                          }, 0)}
                        </span>
                      </div>
                    </div>
                  )}
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
                <Button onClick={handleCreateOrder}>Place Order</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
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

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.length === 0 ? (
             <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg bg-muted/10">
               <Utensils className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
               <h3 className="text-lg font-medium">No Orders Found</h3>
               <p className="text-muted-foreground">There are no orders matching your current filter.</p>
             </div>
          ) : (
            filteredOrders.map(order => (
              <Card key={order.id} className={`overflow-hidden border-t-4 ${
                order.status === 'Pending' ? 'border-t-amber-500' :
                order.status === 'Accepted' ? 'border-t-blue-500' :
                order.status === 'Fulfilled' ? 'border-t-green-500' :
                'border-t-gray-300'
              }`}>
                <CardHeader className="pb-3 bg-muted/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <span className="font-mono text-muted-foreground">{order.id}</span>
                        {order.type === 'Food' ? <Utensils className="h-4 w-4 text-orange-500" /> : <Sparkles className="h-4 w-4 text-purple-500" />}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        <span className="mx-1">•</span>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant={
                      order.status === 'Pending' ? "outline" :
                      order.status === 'Accepted' ? "secondary" :
                      order.status === 'Fulfilled' ? "default" : "destructive"
                    } className={
                      order.status === 'Pending' ? "text-amber-600 border-amber-200 bg-amber-50" :
                      order.status === 'Accepted' ? "text-blue-600 bg-blue-50" :
                      order.status === 'Fulfilled' ? "bg-green-600" : ""
                    }>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="mb-4">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {order.guestName}
                    </h4>
                    <p className="text-sm text-muted-foreground ml-6">Room {order.roomNumber}</p>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Order Items</div>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span>${order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="bg-amber-50 text-amber-800 p-2 rounded text-xs border border-amber-100">
                      <span className="font-bold">Note:</span> {order.notes}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/5 p-3 flex gap-2 justify-end">
                  {order.status === "Pending" && (
                    <>
                      <Button size="sm" variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleStatusChange(order.id, "Cancelled")}>Reject</Button>
                      <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleStatusChange(order.id, "Accepted")}>Accept Order</Button>
                    </>
                  )}
                  {order.status === "Accepted" && (
                     <Button size="sm" className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange(order.id, "Fulfilled")}>
                       <CheckCircle className="mr-2 h-4 w-4" /> Mark Fulfilled
                     </Button>
                  )}
                  {order.status === "Fulfilled" && (
                    <div className="w-full text-center text-xs text-muted-foreground italic flex items-center justify-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" /> Added to Bill
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}