import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import PricingCalendar from "@/components/PricingCalendar";

export default function AdminInventoryPricing({ role = "owner" }: { role?: "owner" | "manager" }) {
  const { data: roomTypes = [] } = useQuery<any[]>({ queryKey: ['/api/room-types'] });

  return (
    <AdminLayout role={role}>
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-serif text-primary" data-testid="text-inventory-pricing-title">Inventory & Pricing</h2>
          <p className="text-muted-foreground">Manage daily rates, availability, and room blocking for all room types.</p>
        </div>
        <PricingCalendar roomTypes={roomTypes} />
      </div>
    </AdminLayout>
  );
}
