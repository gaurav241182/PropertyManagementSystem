import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, RequireAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import PlatformDashboard from "@/pages/platform-dashboard";
import PlatformHotels from "@/pages/platform-hotels";
import PlatformReports from "@/pages/platform-reports";
import PlatformUsers from "@/pages/platform-users";
import PlatformSettings from "@/pages/platform-settings";
import AdminDashboard from "@/pages/admin-dashboard";
import ManagerDashboard from "@/pages/manager-dashboard";
import AdminBookings from "@/pages/admin-bookings";
import AdminRooms from "@/pages/admin-rooms";
import AdminInventoryPricing from "@/pages/admin-inventory-pricing";
import AdminExpenses from "@/pages/admin-expenses";
import AdminStaff from "@/pages/admin-staff";
import AdminSalaries from "@/pages/admin-salaries";
import AdminMenu from "@/pages/admin-menu";
import AdminRestaurantMenu from "@/pages/admin-restaurant-menu"; // New Import
import AdminSales from "@/pages/admin-sales";
import AdminReports from "@/pages/admin-reports";
import AdminSettings from "@/pages/admin-settings";
import AdminOrders from "@/pages/admin-orders";
import GuestLogin from "@/pages/guest-login";
import GuestDashboard from "@/pages/guest-dashboard";
import GuestMenu from "@/pages/guest-menu";

// Wrappers to satisfy wouter's Route component type
const OwnerStaff = () => <AdminStaff role="owner" />;
const OwnerExpenses = () => <AdminExpenses role="owner" />;
const OwnerBookings = () => <AdminBookings role="owner" />;
const OwnerRooms = () => <AdminRooms role="owner" />;
const OwnerInventoryPricing = () => <AdminInventoryPricing role="owner" />;
const OwnerMenu = () => <AdminMenu role="owner" />;
const OwnerRestaurantMenu = () => <AdminRestaurantMenu role="owner" />;
const OwnerSalaries = () => <AdminSalaries role="owner" />;
const OwnerSales = () => <AdminSales role="owner" />;
const OwnerOrders = () => <AdminOrders role="owner" />;

const ManagerStaff = () => <AdminStaff role="manager" />;
const ManagerExpenses = () => <AdminExpenses role="manager" />;
const ManagerBookings = () => <AdminBookings role="manager" />;
const ManagerRooms = () => <AdminRooms role="manager" />;
const ManagerInventoryPricing = () => <AdminInventoryPricing role="manager" />;
const ManagerMenu = () => <AdminMenu role="manager" />;
const ManagerRestaurantMenu = () => <AdminRestaurantMenu role="manager" />;
const ManagerSales = () => <AdminSales role="manager" />;
const ManagerOrders = () => <AdminOrders role="manager" />;

function PlatformRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <RequireAuth allowedRoles={["super_admin"]}>
      <Component />
    </RequireAuth>
  );
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <RequireAuth allowedRoles={["super_admin", "owner"]}>
      <Component />
    </RequireAuth>
  );
}

function ManagerRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <RequireAuth allowedRoles={["super_admin", "owner", "manager"]}>
      <Component />
    </RequireAuth>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      
      {/* Guest Portal Routes */}
      <Route path="/guest/login" component={GuestLogin} />
      <Route path="/guest/dashboard" component={GuestDashboard} />
      <Route path="/guest/menu" component={GuestMenu} />

      {/* Platform Admin Routes */}
      <Route path="/platform/dashboard">{() => <PlatformRoute component={PlatformDashboard} />}</Route>
      <Route path="/platform/hotels">{() => <PlatformRoute component={PlatformHotels} />}</Route>
      <Route path="/platform/users">{() => <PlatformRoute component={PlatformUsers} />}</Route>
      <Route path="/platform/reports">{() => <PlatformRoute component={PlatformReports} />}</Route>
      <Route path="/platform/settings">{() => <PlatformRoute component={PlatformSettings} />}</Route>
      
      {/* Owner Routes (Default Role) */}
      <Route path="/admin">{() => <AdminRoute component={AdminDashboard} />}</Route>
      <Route path="/admin/reports">{() => <AdminRoute component={AdminReports} />}</Route>
      <Route path="/admin/staff">{() => <AdminRoute component={OwnerStaff} />}</Route>
      <Route path="/admin/expenses">{() => <AdminRoute component={OwnerExpenses} />}</Route>
      <Route path="/admin/bookings">{() => <AdminRoute component={OwnerBookings} />}</Route>
      <Route path="/admin/rooms">{() => <AdminRoute component={OwnerRooms} />}</Route>
      <Route path="/admin/inventory-pricing">{() => <AdminRoute component={OwnerInventoryPricing} />}</Route>
      <Route path="/admin/menu">{() => <AdminRoute component={OwnerMenu} />}</Route>
      <Route path="/admin/restaurant-menu">{() => <AdminRoute component={OwnerRestaurantMenu} />}</Route>
      <Route path="/admin/orders">{() => <AdminRoute component={OwnerOrders} />}</Route>
      <Route path="/admin/settings">{() => <AdminRoute component={AdminSettings} />}</Route>
      <Route path="/admin/salaries">{() => <AdminRoute component={OwnerSalaries} />}</Route>
      <Route path="/admin/sales">{() => <AdminRoute component={OwnerSales} />}</Route>
      
      {/* Manager Routes (Explicit Role) */}
      <Route path="/manager">{() => <ManagerRoute component={ManagerDashboard} />}</Route>
      <Route path="/manager/staff">{() => <ManagerRoute component={ManagerStaff} />}</Route>
      <Route path="/manager/expenses">{() => <ManagerRoute component={ManagerExpenses} />}</Route>
      <Route path="/manager/bookings">{() => <ManagerRoute component={ManagerBookings} />}</Route>
      <Route path="/manager/orders">{() => <ManagerRoute component={ManagerOrders} />}</Route>
      <Route path="/manager/rooms">{() => <ManagerRoute component={ManagerRooms} />}</Route>
      <Route path="/manager/inventory-pricing">{() => <ManagerRoute component={ManagerInventoryPricing} />}</Route>
      <Route path="/manager/menu">{() => <ManagerRoute component={ManagerMenu} />}</Route>
      <Route path="/manager/restaurant-menu">{() => <ManagerRoute component={ManagerRestaurantMenu} />}</Route>
      <Route path="/manager/sales">{() => <ManagerRoute component={ManagerSales} />}</Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;