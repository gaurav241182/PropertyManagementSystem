import { useAuth } from "@/lib/auth";
import { getModulePermission, type ModuleKey, type ModulePermission } from "@/lib/permissions";

export function usePermissions() {
  const { user } = useAuth();

  function getPermission(module: ModuleKey): ModulePermission {
    if (!user) {
      return { view: false, create: false, edit: false, delete: false };
    }
    return getModulePermission(user.permissions, module, user.role);
  }

  function canView(module: ModuleKey): boolean {
    return getPermission(module).view;
  }

  function canCreate(module: ModuleKey): boolean {
    return getPermission(module).create;
  }

  function canEdit(module: ModuleKey): boolean {
    return getPermission(module).edit;
  }

  function canDelete(module: ModuleKey): boolean {
    return getPermission(module).delete;
  }

  function hasAnyAccess(module: ModuleKey): boolean {
    const p = getPermission(module);
    return p.view || p.create || p.edit || p.delete;
  }

  const isOwnerOrAdmin = user?.role === "owner" || user?.role === "super_admin";

  return { canView, canCreate, canEdit, canDelete, hasAnyAccess, getPermission, isOwnerOrAdmin };
}
