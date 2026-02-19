import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hotel, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (user) {
      redirectUser(user.role);
    }
  }, [user]);

  function redirectUser(role: string) {
    if (role === "super_admin") {
      setLocation("/platform/dashboard");
    } else if (role === "owner") {
      setLocation("/admin");
    } else if (role === "manager") {
      setLocation("/manager");
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      toast({ title: "Welcome back!", description: `Logged in as ${loggedInUser.name}` });
      redirectUser(loggedInUser.role);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedUsers = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/auth/seed", { method: "POST" });
      const data = await res.json();
      toast({ title: "Done", description: data.message });
    } catch {
      toast({ title: "Error", description: "Failed to create sample users", variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4" data-testid="login-page">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
            <Hotel className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-serif font-bold text-primary" data-testid="text-app-title">YellowBerry PMS</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive text-sm rounded-md" data-testid="text-login-error">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-password"
              />
            </div>
            <Button className="w-full" type="submit" disabled={loading} data-testid="button-login">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-muted-foreground text-center mb-3">Demo Credentials</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between bg-muted/50 rounded px-3 py-2 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => { setEmail("admin@yellowberry.com"); setPassword("admin123"); }}
                data-testid="button-fill-admin">
                <span className="font-medium">Platform Admin</span>
                <span>admin@yellowberry.com</span>
              </div>
              <div className="flex justify-between bg-muted/50 rounded px-3 py-2 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => { setEmail("owner@demo.com"); setPassword("owner123"); }}
                data-testid="button-fill-owner">
                <span className="font-medium">Hotel Owner</span>
                <span>owner@demo.com</span>
              </div>
              <div className="flex justify-between bg-muted/50 rounded px-3 py-2 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => { setEmail("manager@demo.com"); setPassword("manager123"); }}
                data-testid="button-fill-manager">
                <span className="font-medium">Hotel Manager</span>
                <span>manager@demo.com</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3"
              onClick={handleSeedUsers}
              disabled={seeding}
              data-testid="button-seed-users"
            >
              {seeding ? "Creating..." : "Create Sample Users"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
