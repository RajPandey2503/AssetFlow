import React from "react";
import {
  Package,
  CheckCircle2,
  UserCheck,
  Wrench,
  Search,
  Filter,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  Eye,
  Trash2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { AssetStatus, AssetCondition } from "@/app/generated/prisma/enums";
import { requireAuth } from "@/lib/auth/session";
import { pageCount, pageSize, parsePage, parseSearch } from "@/lib/organization/pagination";
import KpiCard from "@/components/dashboard/kpi-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ToastFeedback } from "@/components/organization/toast-feedback";
import { AssetFormDialog } from "@/components/assets/asset-form-dialog";
import { AssetDetailsSheet } from "@/components/assets/asset-details-sheet";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { deleteAssetAction } from "@/lib/assets/actions";
import Link from "next/link";

type AssetsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pageHref(params: Record<string, string>, pageNumber: number) {
  const urlParams = new URLSearchParams(params);
  urlParams.set("page", String(pageNumber));
  return `/assets?${urlParams.toString()}`;
}

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  const actor = await requireAuth();
  const canManage = actor.role === "ADMIN" || actor.role === "ASSET_MANAGER";
  
  const params = await searchParams;
  
  // Parse inputs
  const q = parseSearch(params.q);
  const categoryId = typeof params.category === "string" ? params.category : "";
  const status = typeof params.status === "string" ? params.status : "";
  const condition = typeof params.condition === "string" ? params.condition : "";
  const shared = typeof params.shared === "string" ? params.shared : "";
  const page = parsePage(params.page);

  // Active filter params dictionary for preserving pagination links
  const activeParams: Record<string, string> = {};
  if (q) activeParams.q = q;
  if (categoryId) activeParams.category = categoryId;
  if (status) activeParams.status = status;
  if (condition) activeParams.condition = condition;
  if (shared) activeParams.shared = shared;

  // Build Prisma filter query
  const where: Prisma.AssetWhereInput = {};

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { assetTag: { contains: q } },
      { serialNumber: { contains: q } },
      { location: { contains: q } },
    ];
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }
  if (status) {
    where.status = status as AssetStatus;
  }
  if (condition) {
    where.condition = condition as AssetCondition;
  }
  if (shared === "true") {
    where.sharedResource = true;
  } else if (shared === "false") {
    where.sharedResource = false;
  }

  // Database operations
  const [
    items,
    total,
    categories,
    kpiTotal,
    kpiAvailable,
    kpiAllocated,
    kpiMaintenance,
  ] = await Promise.all([
    prisma.asset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: { name: true } },
        history: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.asset.count({ where }),
    prisma.assetCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.asset.count(),
    prisma.asset.count({ where: { status: "AVAILABLE" } }),
    prisma.asset.count({ where: { status: "ALLOCATED" } }),
    prisma.asset.count({ where: { status: "MAINTENANCE" } }),
  ]);

  const totalPages = pageCount(total);
  const currentPage = Math.min(page, totalPages || 1);

  // Color mappings
  const statusColors: Record<string, string> = {
    AVAILABLE: "bg-emerald-100 text-emerald-800 border-emerald-200",
    ALLOCATED: "bg-blue-100 text-blue-800 border-blue-200",
    RESERVED: "bg-purple-100 text-purple-800 border-purple-200",
    MAINTENANCE: "bg-amber-100 text-amber-800 border-amber-200",
    LOST: "bg-red-100 text-red-800 border-red-200",
    RETIRED: "bg-slate-100 text-slate-800 border-slate-200",
  };

  const conditionColors: Record<string, string> = {
    NEW: "bg-teal-100 text-teal-800 border-teal-200",
    GOOD: "bg-green-100 text-green-800 border-green-200",
    FAIR: "bg-yellow-100 text-yellow-800 border-yellow-200",
    POOR: "bg-orange-100 text-orange-800 border-orange-200",
    BROKEN: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <div className="space-y-8">
      {/* Toast popup */}
      <ToastFeedback />

      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Asset Registry</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Register, track and search enterprise hardware, software licenses and shared team assets.
          </p>
        </div>
        {canManage && (
          <div className="flex-shrink-0">
            <AssetFormDialog mode="create" categories={categories} />
          </div>
        )}
      </div>

      {/* KPI Overview Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total Assets" value={kpiTotal} icon={Package} />
        <KpiCard title="Available" value={kpiAvailable} icon={CheckCircle2} />
        <KpiCard title="Allocated" value={kpiAllocated} icon={UserCheck} />
        <KpiCard title="Under Maintenance" value={kpiMaintenance} icon={Wrench} />
      </div>

      {/* Filters & Search section */}
      <Card className="p-5 border border-slate-200">
        <form method="GET" action="/assets" className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">Search & Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={q}
                placeholder="Search by tag, name, serial..."
                className="pl-8"
              />
            </div>

            {/* Category */}
            <Select name="category" defaultValue={categoryId}>
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>

            {/* Status */}
            <Select name="status" defaultValue={status}>
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ALLOCATED">Allocated</option>
              <option value="RESERVED">Reserved</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="LOST">Lost</option>
              <option value="RETIRED">Retired</option>
            </Select>

            {/* Condition */}
            <Select name="condition" defaultValue={condition}>
              <option value="">All Conditions</option>
              <option value="NEW">New</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
              <option value="BROKEN">Broken</option>
            </Select>

            {/* Shared */}
            <Select name="shared" defaultValue={shared}>
              <option value="">All Resources</option>
              <option value="true">Shared Only</option>
              <option value="false">Regular Only</option>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Link
              href="/assets"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <RefreshCw className="size-3" />
              Reset Filters
            </Link>
            <Button type="submit" size="sm" className="h-8">
              Apply Filters
            </Button>
          </div>
        </form>
      </Card>

      {/* Directory Table */}
      <Card className="overflow-hidden border border-slate-200">
        {items.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              icon={FolderOpen}
              title="No assets found"
              description="Register new assets or adjust filters to view items in the registry."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/75 hover:bg-slate-50/75">
                  <TableHead className="font-semibold text-slate-800">Tag</TableHead>
                  <TableHead className="font-semibold text-slate-800">Asset Name</TableHead>
                  <TableHead className="font-semibold text-slate-800">Category</TableHead>
                  <TableHead className="font-semibold text-slate-800">Condition</TableHead>
                  <TableHead className="font-semibold text-slate-800">Location</TableHead>
                  <TableHead className="font-semibold text-slate-800">Shared</TableHead>
                  <TableHead className="font-semibold text-slate-800">Status</TableHead>
                  <TableHead className="text-right font-semibold text-slate-800">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((asset) => (
                  <TableRow key={asset.id} className="hover:bg-slate-50/40">
                    <TableCell className="font-mono font-bold text-slate-900 text-xs">
                      {asset.assetTag}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium text-slate-900 leading-snug">{asset.name}</p>
                        {asset.serialNumber && (
                          <p className="text-[10px] text-slate-400">SN: {asset.serialNumber}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs">
                      {asset.category.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${conditionColors[asset.condition]} text-[10px] py-0.5 px-2`}>
                        {asset.condition}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs">
                      {asset.location || "—"}
                    </TableCell>
                    <TableCell>
                      {asset.sharedResource ? (
                        <Badge className="bg-indigo-50 border-indigo-200 text-indigo-700 text-[10px] py-0.5 px-2 hover:bg-indigo-50">
                          Shared
                        </Badge>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${statusColors[asset.status]} text-[10px] py-0.5 px-2`}>
                        {asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {/* Details Drawer */}
                        <AssetDetailsSheet
                          asset={asset}
                          trigger={
                            <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                              <Eye className="size-4" />
                            </Button>
                          }
                        />

                        {/* Edit Dialog */}
                        {canManage && (
                          <AssetFormDialog
                            mode="edit"
                            asset={asset}
                            categories={categories}
                          />
                        )}

                        {/* Delete Confirmation */}
                        {canManage && (
                          <ConfirmationDialog
                            title="Delete asset record?"
                            description="This permanently removes the asset and all its audit trail/allocation history. This action is irreversible."
                            action={deleteAssetAction}
                            hiddenFields={{ id: asset.id }}
                            submitLabel="Delete Permanently"
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            }
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination block */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 bg-white px-5 py-3">
                <p className="text-xs text-slate-500">
                  Page <span className="font-semibold text-slate-900">{currentPage}</span> of{" "}
                  <span className="font-semibold text-slate-900">{totalPages}</span> ({total} total assets)
                </p>
                <div className="flex items-center gap-1">
                  <Link
                    href={pageHref(activeParams, currentPage - 1)}
                    className={`inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 ${
                      currentPage <= 1 ? "pointer-events-none opacity-40" : ""
                    }`}
                  >
                    Previous
                  </Link>
                  <Link
                    href={pageHref(activeParams, currentPage + 1)}
                    className={`inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 ${
                      currentPage >= totalPages ? "pointer-events-none opacity-40" : ""
                    }`}
                  >
                    Next
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
