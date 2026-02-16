import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hotel, Shield, UserCog } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);

  const handleLogin = (role: string) => {
    setLoading(true);
    // Simulate login delay
    setTimeout(() => {
      setLoading(false);
      if (role === "platform") {
        setLocation("/platform/hotels");
      } else if (role === "owner") {
        setLocation("/admin"); // Redirects to Owner Dashboard
      } else if (role === "manager") {
        setLocation("/manager"); // Redirects to Manager Dashboard
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
            <Hotel className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-serif font-bold text-primary">LuxeStay Access</CardTitle>
            <CardDescription>Select your role to sign in to the portal.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="owner" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="platform">Platform</TabsTrigger>
              <TabsTrigger value="owner">Owner</TabsTrigger>
              <TabsTrigger value="manager">Manager</TabsTrigger>
            </TabsList>
            
            <TabsContent value="platform">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Platform ID</Label>
                  <Input placeholder="admin@luxestay-saas.com" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" />
                </div>
                <Button className="w-full" onClick={() => handleLogin("platform")} disabled={loading}>
                  {loading ? "Signing in..." : "Login as Platform Admin"}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-4">
                  Access for SaaS Providers only.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="owner">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Hotel Owner ID</Label>
                  <Input placeholder="owner@hotel.com" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" />
                </div>
                <Button className="w-full" onClick={() => handleLogin("owner")} disabled={loading}>
                  {loading ? "Signing in..." : "Login as Owner"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="manager">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Staff ID</Label>
                  <Input placeholder="manager@hotel.com" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" />
                </div>
                <Button className="w-full" onClick={() => handleLogin("manager")} disabled={loading}>
                  {loading ? "Signing in..." : "Login as Manager"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}