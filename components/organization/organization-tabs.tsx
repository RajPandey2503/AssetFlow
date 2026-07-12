import Link from "next/link";
import { Building2, FolderTree, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { value: "departments", label: "Departments", icon: Building2 },
  { value: "categories", label: "Asset Categories", icon: FolderTree },
  { value: "employees", label: "Employee Directory", icon: Users },
];

type OrganizationTabsProps = {
  activeTab: string;
};

export function OrganizationTabs({ activeTab }: OrganizationTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-lg border bg-white p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          href={`/organization?tab=${tab.value}`}
          className={cn(
            "flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            activeTab === tab.value && "bg-slate-900 text-white hover:bg-slate-900 hover:text-white",
          )}
        >
          <tab.icon className="size-4" />
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
