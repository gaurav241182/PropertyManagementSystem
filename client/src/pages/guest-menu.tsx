import { useState } from "react";
import GuestLayout from "@/components/layout/GuestLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus, Utensils, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Types
interface MenuItem {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  image?: string;
}

interface FacilityItem {
  id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
}

export default function GuestMenu() {
  const { toast } = useToast();
  const [location] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const defaultTab = urlParams.get("tab") || "food";

  // Mock Cart State
  const [cart, setCart] = useState<{itemId: number, type: 'food' | 'facility', qty: number}[]>([]);
  const [isOrderPlacing, setIsOrderPlacing] = useState(false);

  // Mock Menu Data
  const menuItems: MenuItem[] = [
    { id: 1, name: "Club Sandwich", description: "Toasted bread with chicken, bacon, lettuce, tomato & mayo", category: "Mains", price: 15 },
    { id: 2, name: "Caesar Salad", description: "Romaine lettuce, parmesan, croutons & caesar dressing", category: "Starters", price: 12 },
    { id: 3, name: "Margherita Pizza", description: "Tomato sauce, mozzarella & basil", category: "Mains", price: 18 },
    { id: 4, name: "Pasta Alfredo", description: "Creamy parmesan sauce with fettuccine", category: "Mains", price: 20 },
    { id: 5, name: "Chocolate Brownie", description: "Served with vanilla ice cream", category: "Dessert", price: 8 },
    { id: 6, name: "Cappuccino", description: "Rich espresso with steamed milk foam", category: "Beverage", price: 5 },
    { id: 7, name: "Fresh Orange Juice", description: "Freshly squeezed", category: "Beverage", price: 6 },
  ];

  const facilityItems: FacilityItem[] = [
    { id: 101, name: "Laundry Service", description: "Wash & Fold (per bag)", price: 25, unit: "bag" },
    { id: 102, name: "Extra Towels", description: "Set of 2 bath towels", price: 0, unit: "set" },
    { id: 103, name: "Room Cleaning", description: "Full room refresh", price: 0, unit: "service" },
    { id: 104, name: "Spa Massage", description: "60 min Swedish massage", price: 80, unit: "session" },
    { id: 105, name: "Airport Transfer", description: "One-way drop to airport", price: 50, unit: "trip" },
  ];

  // Cart Logic
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
      return total + ((item?.price || 0) * cartItem.qty);
    }, 0);
  };

  const handlePlaceOrder = () => {
    setIsOrderPlacing(true);
    setTimeout(() => {
      setIsOrderPlacing(false);
      setCart([]);
      toast({
        title: "Order Placed Successfully!",
        description: "The kitchen has received your order. We'll be there shortly.",
      });
    }, 1500);
  };

  return (
    <GuestLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Service Menu</h1>
            <p className="text-muted-foreground">Order food or request amenities directly to your room.</p>
          </div>
          
          {/* Cart Summary (Mobile Sticky) */}
          {cart.length > 0 && (
            <div className="fixed bottom-16 md:bottom-auto md:relative right-4 left-4 md:left-auto md:right-auto z-40 md:z-auto">
              <Button 
                onClick={handlePlaceOrder} 
                disabled={isOrderPlacing}
                className="w-full md:w-auto shadow-xl bg-primary text-primary-foreground h-12 md:h-10 text-lg md:text-sm"
              >
                {isOrderPlacing ? "Sending..." : (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {menuItems.map(item => {
                const cartItem = cart.find(c => c.itemId === item.id && c.type === 'food');
                return (
                  <Card key={item.id} className="overflow-hidden flex flex-row h-32 md:h-auto">
                    {/* Placeholder Image */}
                    <div className="w-24 md:w-32 bg-muted shrink-0 flex items-center justify-center text-muted-foreground">
                      <Utensils className="h-8 w-8 opacity-20" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between p-3 md:p-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold line-clamp-1">{item.name}</h3>
                          <span className="font-medium text-primary">${item.price}</span>
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
          </TabsContent>

          <TabsContent value="facility" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {facilityItems.map(item => {
                const cartItem = cart.find(c => c.itemId === item.id && c.type === 'facility');
                return (
                  <Card key={item.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <Badge variant={item.price === 0 ? "secondary" : "outline"}>
                          {item.price === 0 ? "Free" : `$${item.price}`}
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
          </TabsContent>
        </Tabs>
      </div>
    </GuestLayout>
  );
}