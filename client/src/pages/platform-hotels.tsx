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
import type { Hotel, Branch } from "@shared/schema";
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
  AlertTriangle,
  Eye,
  Pencil,
  Mail,
  Phone,
  Globe,
  Calendar,
  User
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

const INITIAL_BRANCHES: { id?: number; name: string; city: string; address: string }[] = [{ name: "", city: "", address: "" }];

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
  const [viewHotel, setViewHotel] = useState<Hotel | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editHotel, setEditHotel] = useState<Hotel | null>(null);
  const [editForm, setEditForm] = useState(INITIAL_FORM);
  const [editBranches, setEditBranches] = useState(INITIAL_BRANCHES);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const editLogoInputRef = useRef<HTMLInputElement>(null);

  const { data: hotels = [], isLoading } = useQuery<Hotel[]>({ queryKey: ["/api/hotels"] });
  const { data: allBranchesData = [], isLoading: branchesLoading } = useQuery<Branch[]>({ queryKey: ["/api/branches"] });

  const getBranchesForHotel = (hotelId: number): Branch[] => {
    return allBranchesData.filter(b => b.hotelId === hotelId);
  };

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
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
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
      branchesData: validBranches,
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

  const openEditDialog = (hotel: Hotel) => {
    setEditHotel(hotel);
    setEditForm({
      name: hotel.name,
      plan: hotel.plan,
      monthlyCharges: hotel.monthlyCharges || "",
      country: hotel.country,
      city: hotel.city,
      taxId: hotel.taxId || "",
      ownerName: hotel.ownerName,
      ownerEmail: hotel.ownerEmail,
      ownerPhone: hotel.ownerPhone || "",
      ownerDob: hotel.ownerDob || "",
      ownerIdNumber: hotel.ownerIdNumber || "",
      adminLogin: hotel.adminLogin,
      adminPassword: "",
      customDomain: hotel.customDomain || "",
      fromEmail: hotel.fromEmail || "",
    });
    const hotelBranches = getBranchesForHotel(hotel.id);
    if (hotelBranches.length > 0) {
      setEditBranches(hotelBranches.map(b => ({ id: b.id, name: b.name, city: b.city, address: b.address })));
    } else {
      const jsonBranches = parseBranches(hotel.branches);
      setEditBranches(jsonBranches.length > 0 ? jsonBranches : [{ name: "", city: "", address: "" }]);
    }
    setEditLogoPreview(hotel.logoUrl || null);
    setEditDialogOpen(true);
  };

  const handleEditLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid File", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Logo must be under 2MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setEditLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleEditSubmit = async () => {
    if (!editHotel) return;
    if (!editForm.name.trim()) {
      toast({ title: "Missing Required Field", description: "Hotel name is required.", variant: "destructive" });
      return;
    }
    const validBranches = editBranches.filter(b => b.name.trim());
    updateMutation.mutate({
      id: editHotel.id,
      data: {
        name: editForm.name,
        monthlyCharges: editForm.monthlyCharges || "0",
        country: editForm.country,
        city: editForm.city,
        taxId: editForm.taxId,
        ownerName: editForm.ownerName,
        ownerEmail: editForm.ownerEmail,
        ownerPhone: editForm.ownerPhone,
        ownerDob: editForm.ownerDob || null,
        ownerIdNumber: editForm.ownerIdNumber,
        customDomain: editForm.customDomain,
        fromEmail: editForm.fromEmail,
        logoUrl: editLogoPreview || "",
        branches: JSON.stringify(validBranches),
      }
    });
    try {
      await apiRequest("PUT", `/api/branches/sync/${editHotel.id}`, { branches: validBranches });
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
    } catch (e) {
      console.error("Failed to sync branches:", e);
    }
    toast({ title: "Hotel Updated", description: `${editForm.name} has been updated.` });
    setEditDialogOpen(false);
    setEditHotel(null);
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
                    const branchList = getBranchesForHotel(hotel.id);
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
                            {branchesLoading ? "…" : branchList.length}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {hotel.city}{hotel.country ? `, ${countryLabels[hotel.country] || hotel.country}` : ""}
                          </div>
                        </TableCell>
                        <TableCell>
                          <button
                            className="text-left text-primary hover:underline cursor-pointer font-medium"
                            onClick={() => setViewHotel(hotel)}
                            data-testid={`button-view-owner-${hotel.id}`}
                          >
                            {hotel.ownerName}
                          </button>
                        </TableCell>
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
                              <DropdownMenuItem onClick={() => setViewHotel(hotel)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(hotel)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Hotel
                              </DropdownMenuItem>
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

        <Dialog open={!!viewHotel} onOpenChange={(open) => { if (!open) setViewHotel(null); }}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {viewHotel?.logoUrl ? (
                  <img src={viewHotel.logoUrl} alt="" className="h-10 w-10 rounded object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {viewHotel?.name?.substring(0, 2).toUpperCase()}
                  </div>
                )}
                {viewHotel?.name}
              </DialogTitle>
            </DialogHeader>
            {viewHotel && (() => {
              const countryLabels: Record<string, string> = { us: "United States", uk: "United Kingdom", "in": "India", ae: "UAE" };
              const vBranches = getBranchesForHotel(viewHotel.id);
              return (
                <div className="space-y-6 py-2">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Owner Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Full Name</p>
                          <p className="text-sm font-medium">{viewHotel.ownerName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium">{viewHotel.ownerEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium">{viewHotel.ownerPhone || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Date of Birth</p>
                          <p className="text-sm font-medium">{viewHotel.ownerDob || "—"}</p>
                        </div>
                      </div>
                      {viewHotel.ownerIdNumber && (
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">ID Number</p>
                            <p className="text-sm font-medium">{viewHotel.ownerIdNumber}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Hotel Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Location</p>
                          <p className="text-sm font-medium">{viewHotel.city}{viewHotel.country ? `, ${countryLabels[viewHotel.country] || viewHotel.country}` : ""}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Monthly Charges</p>
                        <p className="text-sm font-medium">{viewHotel.monthlyCharges && viewHotel.monthlyCharges !== "0" ? viewHotel.monthlyCharges : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tax ID</p>
                        <p className="text-sm font-medium">{viewHotel.taxId || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Admin Login</p>
                        <p className="text-sm font-medium">{viewHotel.adminLogin}</p>
                      </div>
                      {viewHotel.customDomain && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Custom Domain</p>
                            <p className="text-sm font-medium">{viewHotel.customDomain}</p>
                          </div>
                        </div>
                      )}
                      {viewHotel.fromEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">From Email</p>
                            <p className="text-sm font-medium">{viewHotel.fromEmail}</p>
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <Badge variant="default" className={
                          viewHotel.status === "Active" ? "bg-green-600" :
                          viewHotel.status === "Deactivated" ? "bg-red-600" : "bg-gray-500"
                        }>
                          {viewHotel.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {vBranches.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        Branches ({vBranches.length})
                      </h4>
                      <div className="space-y-2">
                        {vBranches.map((branch: { name: string; city?: string; address?: string; id: number }, idx: number) => (
                          <div key={idx} className="p-3 bg-muted/30 rounded-lg border">
                            <p className="text-sm font-medium">{branch.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {branch.city && <span>{branch.city}</span>}
                              {branch.address && <span> — {branch.address}</span>}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewHotel(null)}>Close</Button>
              <Button onClick={() => { if (viewHotel) { openEditDialog(viewHotel); setViewHotel(null); } }}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editDialogOpen} onOpenChange={(open) => { if (!open) { setEditDialogOpen(false); setEditHotel(null); } }}>
          <DialogContent className="sm:max-w-[700px] h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle>Edit Hotel — {editHotel?.name}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 min-h-0 px-6 py-4">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <input
                    ref={editLogoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleEditLogoUpload}
                  />
                  <div
                    className="h-20 w-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden shrink-0"
                    onClick={() => editLogoInputRef.current?.click()}
                  >
                    {editLogoPreview ? (
                      <img src={editLogoPreview} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <>
                        <Upload className="h-5 w-5 mb-1" />
                        <span className="text-[9px]">Logo</span>
                      </>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Hotel Name</Label>
                    <Input value={editForm.name} onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Monthly Charges</Label>
                    <Input value={editForm.monthlyCharges} onChange={(e) => setEditForm(p => ({ ...p, monthlyCharges: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax ID</Label>
                    <Input value={editForm.taxId} onChange={(e) => setEditForm(p => ({ ...p, taxId: e.target.value }))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select value={editForm.country} onValueChange={(v) => setEditForm(p => ({ ...p, country: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="in">India</SelectItem>
                        <SelectItem value="ae">UAE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={editForm.city} onChange={(e) => setEditForm(p => ({ ...p, city: e.target.value }))} />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Owner Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Owner Name</Label>
                      <Input value={editForm.ownerName} onChange={(e) => setEditForm(p => ({ ...p, ownerName: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Owner Email</Label>
                      <Input value={editForm.ownerEmail} onChange={(e) => setEditForm(p => ({ ...p, ownerEmail: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Owner Phone</Label>
                      <Input value={editForm.ownerPhone} onChange={(e) => setEditForm(p => ({ ...p, ownerPhone: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <Input type="date" value={editForm.ownerDob} onChange={(e) => setEditForm(p => ({ ...p, ownerDob: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>ID Number</Label>
                      <Input value={editForm.ownerIdNumber} onChange={(e) => setEditForm(p => ({ ...p, ownerIdNumber: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Domain & Email</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Custom Domain</Label>
                      <Input value={editForm.customDomain} onChange={(e) => setEditForm(p => ({ ...p, customDomain: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>From Email</Label>
                      <Input value={editForm.fromEmail} onChange={(e) => setEditForm(p => ({ ...p, fromEmail: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium flex items-center gap-2">
                      <GitBranch className="h-4 w-4" />
                      Branches
                    </h3>
                    <Button size="sm" variant="outline" onClick={() => setEditBranches([...editBranches, { name: "", city: "", address: "" }])}>
                      <Plus className="h-3 w-3 mr-1" /> Add Branch
                    </Button>
                  </div>
                  {editBranches.map((branch, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-muted/10 space-y-2 mb-2 relative group">
                      {editBranches.length > 1 && (
                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => setEditBranches(editBranches.filter((_, i) => i !== index))}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Branch Name</Label>
                          <Input className="h-8" value={branch.name} onChange={(e) => {
                            const u = [...editBranches]; u[index] = { ...u[index], name: e.target.value }; setEditBranches(u);
                          }} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">City</Label>
                          <Input className="h-8" value={branch.city} onChange={(e) => {
                            const u = [...editBranches]; u[index] = { ...u[index], city: e.target.value }; setEditBranches(u);
                          }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Address</Label>
                        <Input className="h-8" value={branch.address} onChange={(e) => {
                          const u = [...editBranches]; u[index] = { ...u[index], address: e.target.value }; setEditBranches(u);
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="px-6 py-4 border-t">
              <Button variant="outline" onClick={() => { setEditDialogOpen(false); setEditHotel(null); }}>Cancel</Button>
              <Button onClick={handleEditSubmit} disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PlatformLayout>
  );
}
