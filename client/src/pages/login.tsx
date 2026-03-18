import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hotel, AlertCircle, ArrowLeft, CheckCircle2, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const IS_DEV = import.meta.env.DEV;

const DEV_ACCOUNTS = [
  { label: "Platform Admin", email: "admin@yellowberry.com", password: "Admin@2026", color: "bg-violet-50 hover:bg-violet-100 border-violet-200 text-violet-800" },
  { label: "Happy Owner", email: "happy@gmail.com", password: "123456", color: "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800" },
];

type View = "login" | "forgot";

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<View>("login");
  const [quickLoading, setQuickLoading] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState("");

  useEffect(() => {
    if (user) redirectUser(user.role);
  }, [user]);

  function redirectUser(role: string) {
    if (role === "super_admin") setLocation("/platform/dashboard");
    else if (role === "owner") setLocation("/admin");
    else if (role === "manager") setLocation("/manager");
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your email address.");
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      await res.json();
      setForgotSent(true);
    } catch {
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const quickLogin = async (acc: typeof DEV_ACCOUNTS[0]) => {
    setQuickLoading(acc.email);
    try {
      const loggedInUser = await login(acc.email, acc.password);
      toast({ title: `Signed in as ${acc.label}` });
      redirectUser(loggedInUser.role);
    } catch (err: any) {
      setError(err.message || "Quick login failed");
    } finally {
      setQuickLoading(null);
    }
  };

  const switchToForgot = () => {
    setView("forgot");
    setForgotEmail("");
    setForgotSent(false);
    setForgotError("");
  };

  const switchToLogin = () => {
    setView("login");
    setError("");
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
            <CardDescription>
              {view === "login" ? "Sign in to your account" : "Reset your password"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {view === "login" && (
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
              <div className="text-center">
                <button
                  type="button"
                  onClick={switchToForgot}
                  className="text-sm text-primary hover:underline focus:outline-none"
                  data-testid="link-forgot-password"
                >
                  Forgot Password?
                </button>
              </div>

              {IS_DEV && (
                <div className="pt-2 border-t border-dashed">
                  <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground font-medium">
                    <Zap className="h-3.5 w-3.5" />
                    Dev Quick Login
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {DEV_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => quickLogin(acc)}
                        disabled={quickLoading !== null}
                        className={`text-left px-3 py-2 rounded-md border text-xs font-medium transition-colors ${acc.color} disabled:opacity-50`}
                        data-testid={`button-quick-login-${acc.label.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <div className="font-semibold">{acc.label}</div>
                        <div className="opacity-70 truncate">{acc.email}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}

          {view === "forgot" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={switchToLogin}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-back-to-login"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </button>

              {forgotSent ? (
                <div className="text-center space-y-4 py-4">
                  <div className="mx-auto bg-green-100 w-12 h-12 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Check your inbox</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      If <strong>{forgotEmail}</strong> is registered, a password reset link has been sent. The link expires in 60 minutes.
                    </p>
                  </div>
                  <Button variant="outline" className="w-full" onClick={switchToLogin}>
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter the email address associated with your account and we'll send you a link to reset your password.
                  </p>
                  {forgotError && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {forgotError}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email Address</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="Enter your registered email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      data-testid="input-forgot-email"
                      autoFocus
                    />
                  </div>
                  <Button className="w-full" type="submit" disabled={forgotLoading} data-testid="button-send-reset">
                    {forgotLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
