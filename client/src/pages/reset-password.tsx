import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hotel, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";

type Status = "verifying" | "invalid" | "form" | "success";

function getToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token") || "";
}

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<Status>("verifying");
  const [invalidMsg, setInvalidMsg] = useState("");
  const [token] = useState(getToken);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalidMsg("No reset token found. Please request a new password reset.");
      setStatus("invalid");
      return;
    }
    fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setStatus("form");
        } else {
          setInvalidMsg(data.message || "Invalid or expired reset link.");
          setStatus("invalid");
        }
      })
      .catch(() => {
        setInvalidMsg("Could not verify the reset link. Please try again.");
        setStatus("invalid");
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setFormError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Failed to reset password.");
        return;
      }
      setStatus("success");
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4" data-testid="reset-password-page">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
            <Hotel className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-serif font-bold text-primary">YellowBerry PMS</CardTitle>
            <CardDescription>
              {status === "success" ? "Password updated" : "Choose a new password"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {status === "verifying" && (
            <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Verifying reset link…</p>
            </div>
          )}

          {status === "invalid" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-destructive/10 text-destructive rounded-md">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-sm">{invalidMsg}</p>
              </div>
              <Button className="w-full" variant="outline" onClick={() => setLocation("/")}>
                Back to Sign In
              </Button>
            </div>
          )}

          {status === "form" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter a new password for your account. Make sure it's at least 6 characters.
              </p>
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive text-sm rounded-md" data-testid="text-reset-error">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPass ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-new-password"
                    autoFocus
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    data-testid="button-toggle-password"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat the new password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    data-testid="input-confirm-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    data-testid="button-toggle-confirm"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button className="w-full" type="submit" disabled={submitting} data-testid="button-reset-submit">
                {submitting ? "Updating Password…" : "Set New Password"}
              </Button>
            </form>
          )}

          {status === "success" && (
            <div className="space-y-4 text-center py-4">
              <div className="mx-auto bg-green-100 w-12 h-12 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">Password updated successfully!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You can now sign in with your new password.
                </p>
              </div>
              <Button className="w-full" onClick={() => setLocation("/")} data-testid="button-go-to-login">
                Go to Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
