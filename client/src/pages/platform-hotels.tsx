import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import PlatformLayout from "@/components/layout/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { Hotel } from "@shared/schema";
import { 
  Building2, 
  MapPin, 
  Plus, 
  Search, 
  MoreHorizontal, 
  ExternalLink, 
  Power,
  GitBranch,
  Upload,
  Trash2,
  Lock,
  Loader2,
  CheckCircle2,
  ImageIcon,
  KeyRound,
  Archive,
  AlertTriangle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const INITIAL_FORM = {
  name: "",
  plan: "",
  monthlyCharges: "",
  country: "",
  city: "",
  taxId: "",
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  ownerDob: "",
  ownerIdNumber: "",
  adminLogin: "",
  adminPassword: "",
  customDomain: "",
  fromEmail: "",
};

const INITIAL_BRANCHES = [{ name: "", city: "", address: "" }];

export default function PlatformHotels() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [branches, setBranches] = useState(INITIAL_BRANCHES);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [resetPasswordDialog, setResetPasswordDialog] = useState<Hotel | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<Hotel | null>(null);
  const [deleteAdminPassword, setDeleteAdminPassword] = useState("");

  const { data: hotels = [], isLoading } = useQuery<Hotel[]>({ queryKey: ["/api/hotels"] });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await apiRequest("PATCH", `/api/hotels/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-users"] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: number; newPassword: string }) => {
      const res = await apiRequest("POST", `/api/hotels/${id}/reset-owner-password`, { newPassword });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password Reset", description: "Hotel owner password has been reset successfully." });
      setResetPasswordDialog(null);
      setResetPasswordValue("");
    },
    onError: (error: Error) => {
      toast({ title: "Reset Failed", description: error.message, variant: "destructive" });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/hotels/${id}/archive`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotels"] });
      toast({ title: "Hotel Archived", description: "The hotel has been archived and hidden from active listings." });
    },
    onError: (error: Error) => {
      toast({ title: "Archive Failed", description: error.message, variant: "destructive" });
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async ({ id, adminPassword }: { id: number; adminPassword: string }) => {
      const res = await apiRequest("POST", `/api/hotels/${id}/delete-permanent`, { adminPassword });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-users"] });
      toast({ title: "Hotel Deleted", description: "The hotel and all associated data have been permanently deleted." });
      setDeleteDialog(null);
      setDeleteAdminPassword("");
    },
    onError: (error: Error) => {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/hotels", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-users"] });
      toast({ title: "Hotel Created", description: `"${form.name}" has been successfully onboarded. Owner login created in User Management.` });
      resetAndClose();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Create Hotel", description: error.message || "Something went wrong. Please check required fields and try again.", variant: "destructive" });
    },
  });

  const resetAndClose = () => {
    setForm(INITIAL_FORM);
    setBranches([{ name: "", city: "", address: "" }]);
    setLogoPreview(null);
    setLogoFileName("");
    setDialogOpen(false);
  };

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addBranch = () => {
    setBranches([...branches, { name: "", city: "", address: "" }]);
  };

  const removeBranch = (index: number) => {
    setBranches(branches.filter((_, i) => i !== index));
  };

  const updateBranch = (index: number, field: string, value: string) => {
    const updated = [...branches];
    updated[index] = { ...updated[index], [field]: value };
    setBranches(updated);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid File", description: "Please upload an image file (JPG, PNG, etc.).", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Logo must be under 2MB.", variant: "destructive" });
      return;
    }
    setLogoFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast({ title: "Missing Required Field", description: "Hotel Brand Name is required.", variant: "destructive" });
      return;
    }
    if (!form.ownerName.trim()) {
      toast({ title: "Missing Required Field", description: "Owner Full Name is required.", variant: "destructive" });
      return;
    }
    if (!form.ownerEmail.trim()) {
      toast({ title: "Missing Required Field", description: "Owner Email Address is required.", variant: "destructive" });
      return;
    }
    if (!form.adminLogin.trim()) {
      toast({ title: "Missing Required Field", description: "Admin Login ID is required.", variant: "destructive" });
      return;
    }

    const validBranches = branches.filter(b => b.name.trim());
    if (validBranches.length === 0) {
      toast({ title: "Missing Required Field", description: "At least one branch with a name is required.", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      name: form.name,
      plan: form.plan || "custom",
      monthlyCharges: form.monthlyCharges || "0",
      country: form.country,
      city: form.city,
      taxId: form.taxId,
      ownerName: form.ownerName,
      ownerEmail: form.ownerEmail,
      ownerPhone: form.ownerPhone,
      ownerDob: form.ownerDob || null,
      ownerIdNumber: form.ownerIdNumber,
      adminLogin: form.adminLogin,
      adminPassword: form.adminPassword,
      logoUrl: logoPreview || "",
      branches: JSON.stringify(validBranches),
      customDomain: form.customDomain,
      fromEmail: form.fromEmail,
    });
  };

  const filteredHotels = hotels.filter(h =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = { starter: "Starter", pro: "Professional", enterprise: "Enterprise", custom: "Custom" };
    return labels[plan] || plan;
  };

  const parseBranches = (b: string) => {
    try { return JSON.parse(b); } catch { return []; }
  };

  return (
    <PlatformLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary" data-testid="text-page-title">Hotels & Branches</h2>
            <p className="text-muted-foreground">Manage hotel accounts, subscriptions, and branch configurations.</p>
          </div>
          
          <Button onClick={() => setDialogOpen(true)} data-testid="button-onboard-hotel">
            <Plus className="mr-2 h-4 w-4" />
            Onboard New Hotel
          </Button>

          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetAndClose(); else setDialogOpen(true); }}>
            <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col p-0">
              <DialogHeader className="px-6 py-4 border-b">
                <DialogTitle>Onboard New Hotel Partner</DialogTitle>
                <CardDescription>Complete registration for a new tenant account. Fields marked with <span className="text-red-500 font-bold">*</span> are required.</CardDescription>
              </DialogHeader>
              
              <ScrollArea className="flex-1 px-6 py-4">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="details" data-testid="tab-hotel-details">Hotel Details</TabsTrigger>
                    <TabsTrigger value="owner" data-testid="tab-owner-profile">Owner Profile</TabsTrigger>
                    <TabsTrigger value="branches" data-testid="tab-branches-setup">Branches & Setup</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                          data-testid="input-logo-upload"
                        />
                        <div 
                          className="h-24 w-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden"
                          onClick={() => logoInputRef.current?.click()}
                          data-testid="button-upload-logo"
                        >
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                          ) : (
                            <>
                              <Upload className="h-6 w-6 mb-1" />
                              <span className="text-[10px]">Upload Logo</span>
                            </>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>Hotel Brand Name <span className="text-red-500">*</span></Label>
                          <Input 
                            placeholder="e.g. Grand Plaza Hotels" 
                            value={form.name}
                            onChange={(e) => updateField("name", e.target.value)}
                            data-testid="input-hotel-name"
                          />
                          {logoFileName && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <ImageIcon className="h-3 w-3" /> {logoFileName}
                            </p>
                          )}
                          <Label>Monthly SaaS Charges</Label>
                          <Input 
                            type="text" 
                            placeholder="e.g. 4999" 
                            value={form.monthlyCharges}
                            onChange={(e) => updateField("monthlyCharges", e.target.value)}
                            data-testid="input-monthly-charges"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Headquarters Country</Label>
                          <Select value={form.country} onValueChange={(v) => updateField("country", v)}>
                            <SelectTrigger data-testid="select-country">
                              <SelectValue placeholder="Select Country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="us">United States</SelectItem>
                              <SelectItem value="uk">United Kingdom</SelectItem>
                              <SelectItem value="in">India</SelectItem>
                              <SelectItem value="ae">UAE</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Headquarters City</Label>
                          <Input 
                            placeholder="e.g. New York" 
                            value={form.city}
                            onChange={(e) => updateField("city", e.target.value)}
                            data-testid="input-city"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Registration / Tax ID</Label>
                        <Input 
                          placeholder="Business Registration Number" 
                          value={form.taxId}
                          onChange={(e) => updateField("taxId", e.target.value)}
                          data-testid="input-tax-id"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Custom Domain (White Labelling)</Label>
                        <Input 
                          placeholder="e.g. hotelname.com or stay.hotelname.com" 
                          value={form.customDomain}
                          onChange={(e) => updateField("customDomain", e.target.value)}
                          data-testid="input-custom-domain"
                        />
                        <p className="text-xs text-muted-foreground">Used for white-label deployments so the PMS can run under the hotel's own domain.</p>
                      </div>

                      <div className="space-y-2">
                        <Label>From Email Address</Label>
                        <Input 
                          type="email" 
                          placeholder="e.g. reservations@hotelname.com" 
                          value={form.fromEmail}
                          onChange={(e) => updateField("fromEmail", e.target.value)}
                          data-testid="input-from-email"
                        />
                        <p className="text-xs text-muted-foreground">This email address will be used as the sender address when sending invoices and notifications through the email service (Resend). Domain verification may be required in the future.</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="owner" className="space-y-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Owner Full Name <span className="text-red-500">*</span></Label>
                          <Input 
                            placeholder="John Doe" 
                            value={form.ownerName}
                            onChange={(e) => updateField("ownerName", e.target.value)}
                            data-testid="input-owner-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Date of Birth</Label>
                          <Input 
                            type="date" 
                            value={form.ownerDob}
                            onChange={(e) => updateField("ownerDob", e.target.value)}
                            data-testid="input-owner-dob"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Email Address <span className="text-red-500">*</span></Label>
                          <Input 
                            type="email" 
                            placeholder="owner@example.com" 
                            value={form.ownerEmail}
                            onChange={(e) => updateField("ownerEmail", e.target.value)}
                            data-testid="input-owner-email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone Number</Label>
                          <Input 
                            type="tel" 
                            placeholder="+1 (555) 000-0000" 
                            value={form.ownerPhone}
                            onChange={(e) => updateField("ownerPhone", e.target.value)}
                            data-testid="input-owner-phone"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>National ID / Passport Number</Label>
                        <Input 
                          placeholder="ID Number" 
                          value={form.ownerIdNumber}
                          onChange={(e) => updateField("ownerIdNumber", e.target.value)}
                          data-testid="input-owner-id"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="branches" className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium flex items-center gap-2">
                          <GitBranch className="h-4 w-4" />
                          Hotel Branches <span className="text-red-500">*</span>
                        </h3>
                        <Button size="sm" variant="outline" onClick={addBranch} data-testid="button-add-branch">
                          <Plus className="h-3 w-3 mr-1" /> Add Branch
                        </Button>
                      </div>

                      {branches.map((branch, index) => (
                        <div key={index} className="p-4 border rounded-lg bg-muted/10 space-y-3 relative group">
                          {branches.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => removeBranch(index)}
                              data-testid={`button-remove-branch-${index}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Branch Name <span className="text-red-500">*</span></Label>
                              <Input 
                                placeholder="e.g. Downtown Branch" 
                                className="h-8" 
                                value={branch.name}
                                onChange={(e) => updateBranch(index, "name", e.target.value)}
                                data-testid={`input-branch-name-${index}`}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">City</Label>
                              <Input 
                                placeholder="City" 
                                className="h-8" 
                                value={branch.city}
                                onChange={(e) => updateBranch(index, "city", e.target.value)}
                                data-testid={`input-branch-city-${index}`}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Full Address</Label>
                            <Input 
                              placeholder="Address line..." 
                              className="h-8" 
                              value={branch.address}
                              onChange={(e) => updateBranch(index, "address", e.target.value)}
                              data-testid={`input-branch-address-${index}`}
                            />
                          </div>
                        </div>
                      ))}

                      <div className="border-t pt-4 mt-4">
                        <h3 className="font-medium flex items-center gap-2 mb-3">
                          <Lock className="h-4 w-4" />
                          Account Access
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Admin Login ID <span className="text-red-500">*</span></Label>
                            <Input 
                              placeholder="admin_username" 
                              value={form.adminLogin}
                              onChange={(e) => updateField("adminLogin", e.target.value)}
                              data-testid="input-admin-login"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Initial Password</Label>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              value={form.adminPassword}
                              onChange={(e) => updateField("adminPassword", e.target.value)}
                              data-testid="input-admin-password"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </ScrollArea>
              
              <DialogFooter className="px-6 py-4 border-t bg-muted/10">
                <Button variant="outline" onClick={resetAndClose} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-create-hotel">
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {createMutation.isPending ? "Creating..." : "Create Hotel Account"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Hotels</CardTitle>
                <CardDescription>List of all registered hotel groups.</CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search hotels, owners, or locations..." 
                  className="pl-8" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-hotels"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredHotels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground" data-testid="text-empty-state">
                  {searchQuery ? "No hotels match your search." : "No hotels registered yet. Click 'Onboard New Hotel' to add your first hotel."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hotel Name</TableHead>
                    <TableHead>Branches</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Monthly Charges</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHotels.map((hotel) => {
                    const branchList = parseBranches(hotel.branches);
                    const countryLabels: Record<string, string> = { us: "US", uk: "UK", "in": "India", ae: "UAE" };
                    return (
                      <TableRow key={hotel.id} data-testid={`row-hotel-${hotel.id}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {hotel.logoUrl ? (
                              <img src={hotel.logoUrl} alt="" className="h-8 w-8 rounded object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                {hotel.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            {hotel.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <GitBranch className="h-3 w-3" />
                            {branchList.length}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {hotel.city}{hotel.country ? `, ${countryLabels[hotel.country] || hotel.country}` : ""}
                          </div>
                        </TableCell>
                        <TableCell>{hotel.ownerName}</TableCell>
                        <TableCell>
                          {hotel.monthlyCharges && hotel.monthlyCharges !== "0" 
                            ? hotel.monthlyCharges 
                            : "—"
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className={
                            hotel.status === "Active" ? "bg-green-600 hover:bg-green-700" : 
                            hotel.status === "Deactivated" ? "bg-red-600 hover:bg-red-700" : 
                            hotel.status === "Archived" ? "bg-gray-500 hover:bg-gray-600" : ""
                          }>
                            {hotel.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-actions-${hotel.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              {hotel.status !== "Archived" && (
                                <DropdownMenuItem onClick={() => {
                                  localStorage.setItem("selectedHotelId", String(hotel.id));
                                  window.location.href = "/admin";
                                }}>
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Login as Owner
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => {
                                toast({ title: "Branches", description: `${hotel.name} has ${branchList.length} branch(es): ${branchList.map((b: any) => b.name).join(", ") || "None"}` });
                              }}>
                                <GitBranch className="mr-2 h-4 w-4" />
                                View Branches
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setResetPasswordDialog(hotel);
                                setResetPasswordValue("");
                              }}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Reset Owner Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {hotel.status !== "Archived" && (
                                <DropdownMenuItem 
                                  className={hotel.status === "Active" ? "text-red-600" : "text-green-600"}
                                  onClick={() => {
                                    const newStatus = hotel.status === "Active" ? "Deactivated" : "Active";
                                    updateMutation.mutate({ id: hotel.id, data: { status: newStatus } });
                                    toast({ 
                                      title: newStatus === "Deactivated" ? "Hotel Deactivated" : "Hotel Activated",
                                      description: `${hotel.name} has been ${newStatus === "Deactivated" ? "deactivated" : "activated"}.`
                                    });
                                  }}
                                >
                                  <Power className="mr-2 h-4 w-4" />
                                  {hotel.status === "Active" ? "Deactivate" : "Activate"}
                                </DropdownMenuItem>
                              )}
                              {hotel.status === "Deactivated" && (
                                <DropdownMenuItem onClick={() => archiveMutation.mutate(hotel.id)}>
                                  <Archive className="mr-2 h-4 w-4" />
                                  Archive Hotel
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => {
                                  setDeleteDialog(hotel);
                                  setDeleteAdminPassword("");
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Permanently Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!resetPasswordDialog} onOpenChange={(open) => { if (!open) { setResetPasswordDialog(null); setResetPasswordValue(""); } }}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Reset Owner Password</DialogTitle>
              <CardDescription>Reset the password for {resetPasswordDialog?.ownerName} ({resetPasswordDialog?.name})</CardDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input 
                  type="password" 
                  placeholder="Enter new password (min 6 characters)" 
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  data-testid="input-reset-password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setResetPasswordDialog(null); setResetPasswordValue(""); }} data-testid="button-cancel-reset">
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (resetPasswordDialog) {
                    resetPasswordMutation.mutate({ id: resetPasswordDialog.id, newPassword: resetPasswordValue });
                  }
                }}
                disabled={resetPasswordMutation.isPending || resetPasswordValue.length < 6}
                data-testid="button-confirm-reset"
              >
                {resetPasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteDialog} onOpenChange={(open) => { if (!open) { setDeleteDialog(null); setDeleteAdminPassword(""); } }}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Permanently Delete Hotel
              </DialogTitle>
              <CardDescription>
                This action is irreversible. All data associated with <strong>{deleteDialog?.name}</strong> will be permanently deleted, including rooms, bookings, staff records, invoices, and all other data.
              </CardDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <strong>Warning:</strong> This will permanently delete all hotel data including rooms, bookings, staff, expenses, orders, and settings. This cannot be undone.
              </div>
              <div className="space-y-2">
                <Label>Enter your admin password to confirm</Label>
                <Input 
                  type="password" 
                  placeholder="Admin password" 
                  value={deleteAdminPassword}
                  onChange={(e) => setDeleteAdminPassword(e.target.value)}
                  data-testid="input-delete-admin-password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDeleteDialog(null); setDeleteAdminPassword(""); }} data-testid="button-cancel-delete">
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  if (deleteDialog) {
                    permanentDeleteMutation.mutate({ id: deleteDialog.id, adminPassword: deleteAdminPassword });
                  }
                }}
                disabled={permanentDeleteMutation.isPending || !deleteAdminPassword}
                data-testid="button-confirm-delete"
              >
                {permanentDeleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PlatformLayout>
  );
}
