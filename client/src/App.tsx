import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import PlatformDashboard from "@/pages/platform-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import ManagerDashboard from "@/pages/manager-dashboard";
import AdminInventory from "@/pages/admin-inventory";
import AdminExpenses from "@/pages/admin-expenses";
import AdminStaff from "@/pages/admin-staff";
import AdminMenu from "@/pages/admin-menu";
import AdminReports from "@/pages/admin-reports";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      
      {/* Platform Admin Routes */}
      <Route path="/platform/hotels" component={PlatformDashboard} />
      
      {/* Owner Routes (Default Role) */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/reports" component={AdminReports} />
      <Route path="/admin/staff" component={() => <AdminStaff role="owner" />} />
      <Route path="/admin/expenses" component={() => <AdminExpenses role="owner" />} />
      <Route path="/admin/inventory" component={() => <AdminInventory role="owner" />} />
      <Route path="/admin/menu" component={AdminMenu} />
      
      {/* Manager Routes (Explicit Role) */}
      <Route path="/manager" component={ManagerDashboard} />
      <Route path="/manager/staff" component={() => <AdminStaff role="manager" />} />
      <Route path="/manager/expenses" component={() => <AdminExpenses role="manager" />} />
      <Route path="/manager/inventory" component={() => <AdminInventory role="manager" />} />
      <Route path="/manager/menu" component={() => <AdminMenu role="manager" />} />
      
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