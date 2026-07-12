import Link from "next/link";
import {
  BarChart3,
  Building2,
  CalendarDays,
  FolderTree,
  LayoutDashboard,
  Package,
  Repeat,
  Users,
  Wrench,
} from "lucide-react";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assets", label: "Assets", icon: Package },
  { href: "/departments", label: "Departments", icon: Building2 },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/categories", label: "Categories", icon: FolderTree },
  { href: "/allocation", label: "Allocation", icon: Repeat },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-64 border-r bg-white p-6 lg:block">
      <Link href="/dashboard" className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
          AF
        </div>
        <div>
          <h1 className="text-xl font-bold">AssetFlow</h1>
          <p className="text-xs text-muted-foreground">ERP Console</p>
        </div>
      </Link>

      <nav className="mt-8 space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
