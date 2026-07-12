import KpiCard from "@/components/dashboard/kpi-card";
import RecentAssets from "@/components/dashboard/recent-assets";
import ActivityFeed from "@/components/dashboard/activity-feed";
import QuickActions from "@/components/dashboard/quick-actions";
import {
  Package,
  UserCheck,
  Wrench,
  CalendarDays,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <p className="text-muted-foreground">
          Welcome back to AssetFlow ERP
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Assets Available"
          value="125"
          icon={Package}
        />

        <KpiCard
          title="Assets Allocated"
          value="83"
          icon={UserCheck}
        />

        <KpiCard
          title="Maintenance"
          value="9"
          icon={Wrench}
        />

        <KpiCard
          title="Bookings"
          value="17"
          icon={CalendarDays}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentAssets />
        </div>

        <QuickActions />
      </div>

      <div className="mt-6">
        <ActivityFeed />
      </div>
    </div>
  );
}