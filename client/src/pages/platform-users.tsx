import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import type { PlatformUser, Hotel } from "@shared/schema";
import { 
  Users, 
  Search, 
  MoreHorizontal, 
  Lock, 
  UserPlus, 
  ShieldAlert,
  Mail,
  Building,
  Loader2
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
  email: "",
  role: "",
  hotelId: "",
  password: "",
};

export default function PlatformUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: users = [], isLoading } = useQuery<PlatformUser[]>({ queryKey: ["/api/platform-users"] });
  const { data: hotels = [] } = useQuery<Hotel[]>({ queryKey: ["/api/hotels"] });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/platform-users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-users"] });
      toast({ title: "User Created", description: `"${form.name}" has been added successfully.` });
      resetAndClose();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Create User", description: error.message || "Please check required fields and try again.", variant: "destructive" });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/platform-users/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-users"] });
      toast({ title: "User Updated", description: "User status has been updated." });
    },
  });

  const resetAndClose = () => {
    setForm(INITIAL_FORM);
    setDialogOpen(false);
  };

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast({ title: "Missing Required Field", description: "Full Name is required.", variant: "destructive" });
      return;
    }
    if (!form.email.trim()) {
      toast({ title: "Missing Required Field", description: "Email Address is required.", variant: "destructive" });
      return;
    }
    if (!form.role) {
      toast({ title: "Missing Required Field", description: "Role is required.", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      name: form.name,
      email: form.email,
      role: form.role,
      hotelId: form.hotelId ? Number(form.hotelId) : null,
    });
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = { super_admin: "Super Admin", owner: "Hotel Owner", manager: "Manager", staff: "Staff" };
    return labels[role] || role;
  };

  const getHotelName = (hotelId: number | null) => {
    if (!hotelId) return "Platform";
    const hotel = hotels.find(h => h.id === hotelId);
    return hotel ? hotel.name : "Unknown";
  };

  return (
    <PlatformLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary" data-testid="text-page-title">User Management</h2>
            <p className="text-muted-foreground">Manage system access, reset passwords, and control user accounts.</p>
          </div>
          
          <Button onClick={() => setDialogOpen(true)} data-testid="button-create-user">
            <UserPlus className="mr-2 h-4 w-4" />
            Create New User
          </Button>

          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetAndClose(); else setDialogOpen(true); }}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New User Account</DialogTitle>
                <CardDescription>Add a new administrator or hotel staff member. Fields marked with <span className="text-red-500 font-bold">*</span> are required.</CardDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Full Name <span className="text-red-500">*</span></Label>
                  <Input 
                    placeholder="e.g. Jane Doe" 
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    data-testid="input-user-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address <span className="text-red-500">*</span></Label>
                  <Input 
                    type="email" 
                    placeholder="user@example.com" 
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    data-testid="input-user-email"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role <span className="text-red-500">*</span></Label>
                    <Select value={form.role} onValueChange={(v) => updateField("role", v)}>
                      <SelectTrigger data-testid="select-user-role">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="owner">Hotel Owner</SelectItem>
                        <SelectItem value="manager">Hotel Manager</SelectItem>
                        <SelectItem value="staff">Staff Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assign Hotel</Label>
                    <Select value={form.hotelId} onValueChange={(v) => updateField("hotelId", v)}>
                      <SelectTrigger data-testid="select-user-hotel">
                        <SelectValue placeholder="Select Hotel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">All / Platform</SelectItem>
                        {hotels.map(h => (
                          <SelectItem key={h.id} value={String(h.id)}>{h.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={resetAndClose} data-testid="button-cancel-user">Cancel</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-submit-user">
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {createMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Directory of all registered system users.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search users or emails..." 
                    className="pl-8" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-users"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-role-filter">
                    <SelectValue placeholder="Filter Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="owner">Owners</SelectItem>
                    <SelectItem value="manager">Managers</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground" data-testid="text-empty-state">
                  {searchQuery || roleFilter !== "all" ? "No users match your filters." : "No users registered yet. Click 'Create New User' to add the first user."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Hotel / Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {user.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <Building className="h-3 w-3" />
                          {getHotelName(user.hotelId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === "Active" ? "default" : "secondary"} className={user.status === "Active" ? "bg-green-600 hover:bg-green-700" : ""}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-user-actions-${user.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Account Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => {
                              toast({ title: "Password Reset", description: `Password reset link sent to ${user.email}.` });
                            }}>
                              <Lock className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => deactivateMutation.mutate({ 
                                id: user.id, 
                                status: user.status === "Active" ? "Inactive" : "Active" 
                              })}
                            >
                              <ShieldAlert className="mr-2 h-4 w-4" />
                              {user.status === "Active" ? "Deactivate User" : "Activate User"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PlatformLayout>
  );
}
