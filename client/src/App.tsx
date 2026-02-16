import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminInventory from "@/pages/admin-inventory";
import AdminExpenses from "@/pages/admin-expenses";
import AdminStaff from "@/pages/admin-staff";
import AdminMenu from "@/pages/admin-menu";
import AdminReports from "@/pages/admin-reports";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/inventory" component={AdminInventory} />
      <Route path="/admin/expenses" component={AdminExpenses} />
      <Route path="/admin/staff" component={AdminStaff} />
      <Route path="/admin/menu" component={AdminMenu} />
      <Route path="/admin/reports" component={AdminReports} />
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