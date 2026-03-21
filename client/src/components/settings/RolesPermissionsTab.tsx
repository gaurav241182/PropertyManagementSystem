import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, ShieldCheck, Users, Loader2 } from "lucide-react";
import { MODULE_KEYS, MODULE_LABELS, type ModuleKey, type Permissions, buildFullPermissions, DEFAULT_FULL_PERMISSION, EMPTY_PERMISSION } from "@/lib/permissions";

type HotelRole = {
  id: number;
  hotelId: number;
  name: string;
  description: string;
  permissions: string;
  createdAt: string;
};

type StaffUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  hotelRoleId: number | null;
};

const ACTION_LABELS = ["view", "create", "edit", "delete"] as const;
type ActionKey = typeof ACTION_LABELS[number];

function parsePermissions(raw: string): Permissions {
  try { return JSON.parse(raw) || {}; } catch { return {}; }
}

function buildEmptyPermissions(): Permissions {
  const perms: Permissions = {};
  for (const key of MODULE_KEYS) {
    perms[key] = { view: false, create: false, edit: false, delete: false };
  }
  return perms;
}

export default function RolesPermissionsTab() {
  const { user } = useAuth();
  const { toast } = useToast();

  const hotelId = user?.hotelId;

  const { data: roles = [], isLoading: rolesLoading } = useQuery<HotelRole[]>({
    queryKey: ["/api/hotel-roles"],
    enabled: !!hotelId,
  });

  const { data: staffUsers = [] } = useQuery<StaffUser[]>({
    queryKey: ["/api/platform-users"],
    enabled: !!hotelId,
    select: (data: any[]) =>
      data.filter((u: any) =>
        (u.role === "staff" || u.role === "manager") &&
        u.hotelId === hotelId
      ),
  });

  const [editingRole, setEditingRole] = useState<HotelRole | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [rolePermissions, setRolePermissions] = useState<Permissions>(buildEmptyPermissions());

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignRoleId, setAssignRoleId] = useState<number | null>(null);
  const [assignUserId, setAssignUserId] = useState<string>("");

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string; permissions: Permissions }) =>
      apiRequest("POST", "/api/hotel-roles", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotel-roles"] });
      toast({ title: "Role created successfully" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; description: string; permissions: Permissions } }) =>
      apiRequest("PUT", `/api/hotel-roles/${id}`, data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotel-roles"] });
      toast({ title: "Role updated successfully" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/hotel-roles/${id}`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotel-roles"] });
      toast({ title: "Role deleted" });
      setDeletingId(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, hotelRoleId }: { userId: number; hotelRoleId: number | null }) =>
      apiRequest("PATCH", `/api/platform-users/${userId}/hotel-role`, { hotelRoleId }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-users"] });
      toast({ title: "Role assigned successfully" });
      setAssignDialogOpen(false);
      setAssignUserId("");
      setAssignRoleId(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function openCreate() {
    setEditingRole(null);
    setRoleName("");
    setRoleDescription("");
    setRolePermissions(buildEmptyPermissions());
    setIsDialogOpen(true);
  }

  function openEdit(role: HotelRole) {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description);
    setRolePermissions({ ...buildEmptyPermissions(), ...parsePermissions(role.permissions) });
    setIsDialogOpen(true);
  }

  function closeDialog() {
    setIsDialogOpen(false);
    setEditingRole(null);
  }

  function togglePermission(module: ModuleKey, action: ActionKey) {
    setRolePermissions(prev => {
      const current = prev[module] ?? { view: false, create: false, edit: false, delete: false };
      const updated = { ...current, [action]: !current[action] };
      if (action !== "view" && updated[action]) {
        updated.view = true;
      }
      if (action === "view" && !updated.view) {
        updated.create = false;
        updated.edit = false;
        updated.delete = false;
      }
      return { ...prev, [module]: updated };
    });
  }

  function toggleAllForModule(module: ModuleKey, enable: boolean) {
    setRolePermissions(prev => ({
      ...prev,
      [module]: enable ? { ...DEFAULT_FULL_PERMISSION } : { ...EMPTY_PERMISSION },
    }));
  }

  function handleSave() {
    if (!roleName.trim()) {
      toast({ title: "Role name is required", variant: "destructive" });
      return;
    }
    const data = { name: roleName.trim(), description: roleDescription.trim(), permissions: rolePermissions };
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  function openAssignDialog(roleId: number) {
    setAssignRoleId(roleId);
    setAssignUserId("");
    setAssignDialogOpen(true);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const moduleGroups: { group: string; modules: ModuleKey[] }[] = [
    { group: "Core Operations", modules: ["dashboard", "bookings", "inventory", "orders"] },
    { group: "Restaurant", modules: ["restaurant"] },
    { group: "Finance & HR", modules: ["expenses", "salaries", "revenue"] },
    { group: "Management", modules: ["staff", "reports", "settings"] },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Roles & Permissions
            </CardTitle>
            <CardDescription>
              Create custom roles and control what each staff member can see and do.
            </CardDescription>
          </div>
          <Button onClick={openCreate} data-testid="button-create-role">
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </CardHeader>
        <CardContent>
          {rolesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No roles created yet</p>
              <p className="text-sm mt-1">Create a role to control what your staff can access.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {roles.map(role => {
                const perms = parsePermissions(role.permissions);
                const enabledModules = MODULE_KEYS.filter(m => perms[m]?.view);
                return (
                  <div key={role.id} className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-start gap-4" data-testid={`card-role-${role.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm" data-testid={`text-role-name-${role.id}`}>{role.name}</h3>
                        {role.description && (
                          <span className="text-xs text-muted-foreground">— {role.description}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {enabledModules.length === 0 ? (
                          <Badge variant="outline" className="text-xs text-muted-foreground">No access</Badge>
                        ) : enabledModules.map(m => (
                          <Badge key={m} variant="secondary" className="text-xs">{MODULE_LABELS[m]}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openAssignDialog(role.id)} data-testid={`button-assign-role-${role.id}`}>
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        Assign
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(role)} data-testid={`button-edit-role-${role.id}`}>
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeletingId(role.id)} data-testid={`button-delete-role-${role.id}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {staffUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Staff Role Assignments
            </CardTitle>
            <CardDescription>View which role is assigned to each staff member.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {staffUsers.map(u => {
                const assignedRole = roles.find(r => r.id === u.hotelRoleId);
                return (
                  <div key={u.id} className="flex items-center justify-between py-2 border-b last:border-0" data-testid={`row-staff-user-${u.id}`}>
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {assignedRole ? (
                        <Badge variant="secondary" className="text-xs">{assignedRole.name}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">No role assigned</Badge>
                      )}
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => {
                        setAssignRoleId(assignedRole?.id ?? null);
                        setAssignUserId(String(u.id));
                        setAssignDialogOpen(true);
                      }}>
                        Change
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create New Role"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="role-name">Role Name *</Label>
                <Input
                  id="role-name"
                  value={roleName}
                  onChange={e => setRoleName(e.target.value)}
                  placeholder="e.g. Receptionist, Kitchen Staff"
                  data-testid="input-role-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role-desc">Description</Label>
                <Input
                  id="role-desc"
                  value={roleDescription}
                  onChange={e => setRoleDescription(e.target.value)}
                  placeholder="Optional description"
                  data-testid="input-role-description"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Module Permissions</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setRolePermissions(buildFullPermissions())}
                    data-testid="button-grant-all"
                  >
                    Grant All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setRolePermissions(buildEmptyPermissions())}
                    data-testid="button-revoke-all"
                  >
                    Revoke All
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-[40%]">Module</th>
                      {ACTION_LABELS.map(a => (
                        <th key={a} className="text-center px-2 py-2.5 font-medium text-muted-foreground capitalize w-[15%]">{a}</th>
                      ))}
                    </tr>
                  </thead>
                  {moduleGroups.map(group => (
                      <tbody key={group.group}>
                        <tr className="bg-muted/20 border-y">
                          <td colSpan={5} className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {group.group}
                          </td>
                        </tr>
                        {group.modules.map((mod, idx) => {
                          const perm = rolePermissions[mod] ?? { view: false, create: false, edit: false, delete: false };
                          const allEnabled = ACTION_LABELS.every(a => perm[a]);
                          return (
                            <tr key={mod} className={`border-b last:border-0 ${idx % 2 === 0 ? "" : "bg-muted/10"}`}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={allEnabled}
                                    onCheckedChange={(checked) => toggleAllForModule(mod, !!checked)}
                                    data-testid={`checkbox-module-all-${mod}`}
                                  />
                                  <span className="font-medium">{MODULE_LABELS[mod]}</span>
                                </div>
                              </td>
                              {ACTION_LABELS.map(action => (
                                <td key={action} className="text-center px-2 py-3">
                                  <div className="flex justify-center">
                                    <Checkbox
                                      checked={!!perm[action]}
                                      onCheckedChange={() => togglePermission(mod, action)}
                                      disabled={action !== "view" && !perm.view}
                                      data-testid={`checkbox-${mod}-${action}`}
                                    />
                                  </div>
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    ))}
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                Note: Create, Edit, and Delete require View to be enabled first.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} data-testid="button-save-role">
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingRole ? "Update Role" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Assign Role to Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Select Staff Member</Label>
              <Select value={assignUserId} onValueChange={setAssignUserId}>
                <SelectTrigger data-testid="select-assign-user">
                  <SelectValue placeholder="Choose a staff member..." />
                </SelectTrigger>
                <SelectContent>
                  {staffUsers.map(u => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name} — {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Select Role</Label>
              <Select value={assignRoleId && assignRoleId > 0 ? String(assignRoleId) : "none"} onValueChange={v => setAssignRoleId(v === "none" ? null : Number(v))}>
                <SelectTrigger data-testid="select-assign-role">
                  <SelectValue placeholder="Choose a role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Role (Remove assignment)</SelectItem>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!assignUserId) {
                  toast({ title: "Please select a staff member", variant: "destructive" });
                  return;
                }
                assignRoleMutation.mutate({
                  userId: Number(assignUserId),
                  hotelRoleId: assignRoleId && assignRoleId > 0 ? assignRoleId : null,
                });
              }}
              disabled={assignRoleMutation.isPending}
              data-testid="button-confirm-assign"
            >
              {assignRoleMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={open => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this role? Staff members assigned to this role will lose their permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deletingId) deleteMutation.mutate(deletingId); }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
