import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import PlatformDashboard from "@/pages/platform-dashboard";
import PlatformHotels from "@/pages/platform-hotels";
import PlatformReports from "@/pages/platform-reports";
import PlatformUsers from "@/pages/platform-users";
import AdminDashboard from "@/pages/admin-dashboard";
import ManagerDashboard from "@/pages/manager-dashboard";
import AdminBookings from "@/pages/admin-bookings";
import AdminRooms from "@/pages/admin-rooms";
import AdminExpenses from "@/pages/admin-expenses";
import AdminStaff from "@/pages/admin-staff";
import AdminSalaries from "@/pages/admin-salaries"; // New Import
import AdminMenu from "@/pages/admin-menu";
import AdminReports from "@/pages/admin-reports";
import AdminSettings from "@/pages/admin-settings";

// Wrappers to satisfy wouter's Route component type
const OwnerStaff = () => <AdminStaff role="owner" />;
const OwnerExpenses = () => <AdminExpenses role="owner" />;
const OwnerBookings = () => <AdminBookings role="owner" />;
const OwnerRooms = () => <AdminRooms role="owner" />;
const OwnerMenu = () => <AdminMenu role="owner" />;
const OwnerSalaries = () => <AdminSalaries role="owner" />; // New Wrapper

const ManagerStaff = () => <AdminStaff role="manager" />;
const ManagerExpenses = () => <AdminExpenses role="manager" />;
const ManagerBookings = () => <AdminBookings role="manager" />;
const ManagerRooms = () => <AdminRooms role="manager" />;
const ManagerMenu = () => <AdminMenu role="manager" />;

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      
      {/* Platform Admin Routes */}
      <Route path="/platform/dashboard" component={PlatformDashboard} />
      <Route path="/platform/hotels" component={PlatformHotels} />
      <Route path="/platform/users" component={PlatformUsers} />
      <Route path="/platform/reports" component={PlatformReports} />
      
      {/* Owner Routes (Default Role) */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/reports" component={AdminReports} />
      <Route path="/admin/staff" component={OwnerStaff} />
      <Route path="/admin/expenses" component={OwnerExpenses} />
      <Route path="/admin/bookings" component={OwnerBookings} />
      <Route path="/admin/rooms" component={OwnerRooms} />
      <Route path="/admin/menu" component={OwnerMenu} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/salaries" component={OwnerSalaries} /> // New Route
      
      {/* Manager Routes (Explicit Role) */}
      <Route path="/manager" component={ManagerDashboard} />
      <Route path="/manager/staff" component={ManagerStaff} />
      <Route path="/manager/expenses" component={ManagerExpenses} />
      <Route path="/manager/bookings" component={ManagerBookings} />
      <Route path="/manager/rooms" component={ManagerRooms} />
      <Route path="/manager/menu" component={ManagerMenu} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;