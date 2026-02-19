import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Hotel, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function GuestLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [bookingId, setBookingId] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock Login Logic
    // In a real app, this would validate against the backend
    setTimeout(() => {
      setIsLoading(false);
      
      // Simple validation for prototype
      if (bookingId && lastName) {
        // Store guest session (mock)
        localStorage.setItem("guestSession", JSON.stringify({
          bookingId,
          lastName,
          roomNumber: "101", // Mock room
          checkIn: new Date().toISOString(),
          checkOut: new Date(Date.now() + 86400000 * 2).toISOString()
        }));
        
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in to your booking.",
        });
        
        setLocation("/guest/dashboard");
      } else {
        toast({
          title: "Login Failed",
          description: "Please check your Booking ID and Last Name.",
          variant: "destructive"
        });
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center space-y-2">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4">
          <Hotel className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-primary">Grand Luxe Hotel</h1>
        <p className="text-muted-foreground">Guest Services Portal</p>
      </div>

      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Guest Login</CardTitle>
          <CardDescription>
            Enter your booking details to access hotel services
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="booking-id">Booking ID</Label>
              <Input 
                id="booking-id" 
                placeholder="e.g. BK-12345" 
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastname">Last Name</Label>
              <Input 
                id="lastname" 
                placeholder="e.g. Smith" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Access My Booking"}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Having trouble? Please contact the front desk for assistance.
      </p>
    </div>
  );
}