import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/hooks/use-permissions";
import type { ModuleKey } from "@/lib/permissions";

type Action = "view" | "create" | "edit" | "delete";

interface PermissionGateProps {
  module: ModuleKey;
  action: Action;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ module, action, children, fallback = null }: PermissionGateProps) {
  const { user } = useAuth();
  const { canView, canCreate, canEdit, canDelete } = usePermissions();

  if (!user) return <>{fallback}</>;

  if (user.role === "owner" || user.role === "super_admin") {
    return <>{children}</>;
  }

  if (!user.permissions) {
    return <>{children}</>;
  }

  const allowed =
    action === "view" ? canView(module) :
    action === "create" ? canCreate(module) :
    action === "edit" ? canEdit(module) :
    action === "delete" ? canDelete(module) :
    false;

  return allowed ? <>{children}</> : <>{fallback}</>;
}
