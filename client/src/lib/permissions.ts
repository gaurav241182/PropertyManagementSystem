export const MODULE_KEYS = [
  "dashboard",
  "bookings",
  "inventory",
  "orders",
  "staff",
  "expenses",
  "salaries",
  "revenue",
  "restaurant",
  "reports",
  "settings",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: "Dashboard",
  bookings: "Bookings",
  inventory: "Inventory & Pricing",
  orders: "Orders (Kitchen)",
  staff: "Staff Management",
  expenses: "Expenses & Purchases",
  salaries: "Salaries",
  revenue: "Revenue",
  restaurant: "Restaurant Menu",
  reports: "Reports",
  settings: "Settings",
};

export type ModulePermission = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
};

export type Permissions = Partial<Record<ModuleKey, ModulePermission>>;

export const DEFAULT_FULL_PERMISSION: ModulePermission = {
  view: true,
  create: true,
  edit: true,
  delete: true,
};

export const DEFAULT_VIEW_ONLY: ModulePermission = {
  view: true,
  create: false,
  edit: false,
  delete: false,
};

export const EMPTY_PERMISSION: ModulePermission = {
  view: false,
  create: false,
  edit: false,
  delete: false,
};

export function buildFullPermissions(): Permissions {
  const perms: Permissions = {};
  for (const key of MODULE_KEYS) {
    perms[key] = { ...DEFAULT_FULL_PERMISSION };
  }
  return perms;
}

export function getModulePermission(
  permissions: Permissions | null | undefined,
  module: ModuleKey,
  userRole: string
): ModulePermission {
  if (userRole === "super_admin" || userRole === "owner") {
    return DEFAULT_FULL_PERMISSION;
  }
  if (!permissions) {
    return DEFAULT_FULL_PERMISSION;
  }
  return permissions[module] ?? EMPTY_PERMISSION;
}
