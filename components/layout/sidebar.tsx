"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
  X,
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

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 border-r bg-white p-6 transition-all duration-300 ease-in-out lg:static lg:translate-x-0",
        isOpen
          ? "translate-x-0 opacity-100 w-64"
          : "-translate-x-full lg:w-0 lg:p-0 lg:opacity-0 lg:border-r-0 overflow-hidden"
      )}
    >
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
            AF
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">AssetFlow</h1>
            <p className="text-xs text-muted-foreground">ERP Console</p>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 hover:bg-slate-100 lg:hidden text-slate-500 cursor-pointer"
          aria-label="Close menu"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="mt-8 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              )}
            >
              <item.icon className={cn("size-4", isActive ? "text-white" : "text-slate-500")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
