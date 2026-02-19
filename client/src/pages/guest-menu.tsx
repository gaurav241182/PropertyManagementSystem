import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import GuestLayout from "@/components/layout/GuestLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus, Utensils, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string | number;
  available: boolean;
}

interface FacilityItem {
  id: number;
  name: string;
  description: string;
  price: string | number;
  unit: string;
  active: boolean;
}

export default function GuestMenu() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const defaultTab = urlParams.get("tab") || "food";

  const bookingId = sessionStorage.getItem("guestBookingId");
  const guestName = sessionStorage.getItem("guestName") || "";
  const roomNumber = sessionStorage.getItem("guestRoomNumber") || "";

  if (!bookingId) {
    setLocation("/guest/login");
    return null;
  }

  const [cart, setCart] = useState<{itemId: number, type: 'food' | 'facility', qty: number}[]>([]);

  const { data: rawMenuItems = [], isLoading: menuLoading } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu-items'],
  });

  const { data: rawFacilities = [], isLoading: facilitiesLoading } = useQuery<FacilityItem[]>({
    queryKey: ['/api/facilities'],
  });

  const menuItems = rawMenuItems.filter(item => item.available);
  const facilityItems = rawFacilities.filter(item => item.active);

  const orderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const res = await apiRequest("POST", "/api/orders", orderData);
      return res.json();
    },
    onSuccess: () => {
      setCart([]);
      toast({
        title: "Order Placed Successfully!",
        description: "The kitchen has received your order. We'll be there shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/guest', bookingId, 'orders'] });
    },
    onError: (err: any) => {
      toast({
        title: "Order Failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getItemPrice = (item: MenuItem | FacilityItem) => Number(item.price);

  const addToCart = (id: number, type: 'food' | 'facility') => {
    setCart(prev => {
      const existing = prev.find(item => item.itemId === id && item.type === type);
      if (existing) {
        return prev.map(item => item.itemId === id && item.type === type ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { itemId: id, type, qty: 1 }];
    });
    toast({ description: "Item added to cart" });
  };

  const removeFromCart = (id: number, type: 'food' | 'facility') => {
    setCart(prev => {
      const existing = prev.find(item => item.itemId === id && item.type === type);
      if (existing && existing.qty > 1) {
        return prev.map(item => item.itemId === id && item.type === type ? { ...item, qty: item.qty - 1 } : item);
      }
      return prev.filter(item => !(item.itemId === id && item.type === type));
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, cartItem) => {
      const item = cartItem.type === 'food' 
        ? menuItems.find(i => i.id === cartItem.itemId) 
        : facilityItems.find(i => i.id === cartItem.itemId);
      return total + (getItemPrice(item!) * cartItem.qty);
    }, 0);
  };

  const handlePlaceOrder = () => {
    const foodItems = cart.filter(c => c.type === 'food');
    const facilityCartItems = cart.filter(c => c.type === 'facility');

    const buildOrderItems = (cartItems: typeof cart, items: (MenuItem | FacilityItem)[]) => {
      return cartItems.map(ci => {
        const item = items.find(i => i.id === ci.itemId)!;
        return {
          itemName: item.name,
          price: String(getItemPrice(item)),
          quantity: ci.qty,
        };
      });
    };

    const timestamp = Date.now();

    if (foodItems.length > 0) {
      const items = buildOrderItems(foodItems, menuItems);
      const totalAmount = foodItems.reduce((sum, ci) => {
        const item = menuItems.find(i => i.id === ci.itemId)!;
        return sum + getItemPrice(item) * ci.qty;
      }, 0);

      orderMutation.mutate({
        orderId: `ORD-${timestamp}`,
        bookingId,
        guestName,
        roomNumber,
        type: "Food",
        status: "Pending",
        totalAmount: String(totalAmount),
        notes: "",
        items,
      });
    }

    if (facilityCartItems.length > 0) {
      const items = buildOrderItems(facilityCartItems, facilityItems);
      const totalAmount = facilityCartItems.reduce((sum, ci) => {
        const item = facilityItems.find(i => i.id === ci.itemId)!;
        return sum + getItemPrice(item) * ci.qty;
      }, 0);

      orderMutation.mutate({
        orderId: `ORD-${timestamp + 1}`,
        bookingId,
        guestName,
        roomNumber,
        type: "Facility",
        status: "Pending",
        totalAmount: String(totalAmount),
        notes: "",
        items,
      });
    }
  };

  return (
    <GuestLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Service Menu</h1>
            <p className="text-muted-foreground">Order food or request amenities directly to your room.</p>
          </div>
          
          {cart.length > 0 && (
            <div className="fixed bottom-16 md:bottom-auto md:relative right-4 left-4 md:left-auto md:right-auto z-40 md:z-auto">
              <Button 
                onClick={handlePlaceOrder} 
                disabled={orderMutation.isPending}
                className="w-full md:w-auto shadow-xl bg-primary text-primary-foreground h-12 md:h-10 text-lg md:text-sm"
              >
                {orderMutation.isPending ? "Sending..." : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5 md:h-4 md:w-4" />
                    Place Order (${getCartTotal().toFixed(2)})
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="food">
              <Utensils className="mr-2 h-4 w-4" /> Food & Drink
            </TabsTrigger>
            <TabsTrigger value="facility">
              <Sparkles className="mr-2 h-4 w-4" /> Amenities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="food" className="space-y-6">
            {menuLoading ? (
              <p className="text-muted-foreground">Loading menu...</p>
            ) : menuItems.length === 0 ? (
              <p className="text-muted-foreground">No menu items available at the moment.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {menuItems.map(item => {
                  const cartItem = cart.find(c => c.itemId === item.id && c.type === 'food');
                  const price = getItemPrice(item);
                  return (
                    <Card key={item.id} className="overflow-hidden flex flex-row h-32 md:h-auto">
                      <div className="w-24 md:w-32 bg-muted shrink-0 flex items-center justify-center text-muted-foreground">
                        <Utensils className="h-8 w-8 opacity-20" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between p-3 md:p-4">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold line-clamp-1">{item.name}</h3>
                            <span className="font-medium text-primary">${price}</span>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                        </div>
                        
                        <div className="flex justify-end pt-2">
                          {cartItem ? (
                            <div className="flex items-center gap-3 bg-muted/50 rounded-md px-2 py-1">
                              <button onClick={() => removeFromCart(item.id, 'food')} className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-background transition-colors">
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="font-medium text-sm w-4 text-center">{cartItem.qty}</span>
                              <button onClick={() => addToCart(item.id, 'food')} className="h-6 w-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => addToCart(item.id, 'food')} className="h-8 text-xs">
                              Add to Order
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="facility" className="space-y-6">
            {facilitiesLoading ? (
              <p className="text-muted-foreground">Loading amenities...</p>
            ) : facilityItems.length === 0 ? (
              <p className="text-muted-foreground">No amenities available at the moment.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {facilityItems.map(item => {
                  const cartItem = cart.find(c => c.itemId === item.id && c.type === 'facility');
                  const price = getItemPrice(item);
                  return (
                    <Card key={item.id}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          <Badge variant={price === 0 ? "secondary" : "outline"}>
                            {price === 0 ? "Free" : `$${price}`}
                          </Badge>
                        </div>
                        <CardDescription>{item.description}</CardDescription>
                      </CardHeader>
                      <CardFooter className="justify-end pt-0">
                         {cartItem ? (
                            <div className="flex items-center gap-3 bg-muted/50 rounded-md px-2 py-1">
                              <button onClick={() => removeFromCart(item.id, 'facility')} className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-background transition-colors">
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="font-medium text-sm w-4 text-center">{cartItem.qty}</span>
                              <button onClick={() => addToCart(item.id, 'facility')} className="h-6 w-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <Button size="sm" onClick={() => addToCart(item.id, 'facility')}>
                              Request
                            </Button>
                          )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </GuestLayout>
  );
}