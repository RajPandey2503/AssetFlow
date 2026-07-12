import React from "react";
import {
  Activity,
  ArrowRightLeft,
  History,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
  X,
  Search,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { requireAuth } from "@/lib/auth/session";
import { pageCount, pageSize, parsePage, parseSearch } from "@/lib/organization/pagination";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { AllocateDialog } from "@/components/allocation/allocate-dialog";
import { TransferDialog } from "@/components/allocation/transfer-dialog";
import { ReceiptButton } from "@/components/allocation/receipt-button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  returnAssetAction,
  processTransferRequestAction,
} from "@/lib/allocation/actions";
import Link from "next/link";
import { cn } from "@/lib/utils";

type AllocationPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pageHref(tab: string, query: string, pageNumber: number) {
  const params = new URLSearchParams({ tab, page: String(pageNumber) });
  if (query) {
    params.set("q", query);
  }
  return `/allocation?${params.toString()}`;
}

export default async function AllocationPage({ searchParams }: AllocationPageProps) {
  const actor = await requireAuth();
  const canManage = actor.role === "ADMIN" || actor.role === "ASSET_MANAGER";
  
  const params = await searchParams;
  const tab = typeof params.tab === "string" ? params.tab : "active";
  const q = parseSearch(params.q);
  const page = parsePage(params.page);

  // Fetch available assets and employees for dropdown selectors
  const [availableAssets, activeEmployees] = await Promise.all([
    prisma.asset.findMany({
      where: { status: "AVAILABLE" },
      select: { id: true, assetTag: true, name: true },
      orderBy: { assetTag: "asc" },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Tab definitions
  const tabs = [
    { value: "active", label: "Active Allocations", icon: Activity },
    { value: "transfers", label: "Transfer Requests", icon: ArrowRightLeft },
    { value: "history", label: "Allocation History", icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <ToastFeedback />

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Asset Allocation</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Track active allocations, process returns, reassign hardware, and view request pipelines.
          </p>
        </div>
        {canManage && (
          <div className="flex-shrink-0">
            <AllocateDialog assets={availableAssets} employees={activeEmployees} />
          </div>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-2 rounded-lg border bg-white p-1">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={`/allocation?tab=${t.value}`}
            className={cn(
              "flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              tab === t.value && "bg-slate-900 text-white hover:bg-slate-900 hover:text-white"
            )}
          >
            <t.icon className="size-4" />
            {t.label}
          </Link>
        ))}
      </div>

      {/* Tab Content Panels */}
      {tab === "active" && (
        <ActiveAllocationsTab
          canManage={canManage}
          employees={activeEmployees}
        />
      )}

      {tab === "transfers" && (
        <TransferRequestsTab
          canManage={canManage}
        />
      )}

      {tab === "history" && (
        <AllocationHistoryTab
          q={q}
          page={page}
        />
      )}
    </div>
  );
}

/* ==========================================
   TAB: Active Allocations
   ========================================== */
async function ActiveAllocationsTab({
  canManage,
  employees,
}: {
  canManage: boolean;
  employees: { id: string; name: string; email: string }[];
}) {
  const items = await prisma.assetAllocation.findMany({
    where: { returned: false },
    include: {
      asset: { select: { id: true, name: true, assetTag: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { allocatedAt: "desc" },
  });

  return (
    <Card className="overflow-hidden border border-slate-200">
      {items.length === 0 ? (
        <div className="p-12 text-center">
          <EmptyState
            icon={Activity}
            title="No active allocations"
            description="All registered assets are currently available in storage."
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/75 hover:bg-slate-50/75">
              <TableHead className="font-semibold text-slate-800">Tag</TableHead>
              <TableHead className="font-semibold text-slate-800">Asset Name</TableHead>
              <TableHead className="font-semibold text-slate-800">Assigned To</TableHead>
              <TableHead className="font-semibold text-slate-800">Allocated At</TableHead>
              <TableHead className="font-semibold text-slate-800">Expected Return</TableHead>
              <TableHead className="font-semibold text-slate-800">Status</TableHead>
              <TableHead className="text-right font-semibold text-slate-800">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((alloc) => {
              const allocatedDateStr = new Date(alloc.allocatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const returnDateStr = alloc.returnDate
                ? new Date(alloc.returnDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Indefinite";

              const isOverdue = alloc.returnDate && new Date(alloc.returnDate) < new Date();

              return (
                <TableRow key={alloc.id} className="hover:bg-slate-50/40">
                  <TableCell className="font-mono font-bold text-slate-900 text-xs">
                    {alloc.asset.assetTag}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">{alloc.asset.name}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-medium text-slate-900 text-sm leading-none">{alloc.user.name}</p>
                      <p className="text-[10px] text-slate-400">{alloc.user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 text-xs">{allocatedDateStr}</TableCell>
                  <TableCell className="text-slate-600 text-xs">{returnDateStr}</TableCell>
                  <TableCell>
                    {isOverdue ? (
                      <Badge className="bg-red-50 border-red-200 text-red-700 text-[10px] py-0.5 px-2 hover:bg-red-50 gap-1">
                        <AlertCircle className="size-3" />
                        Overdue
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-100 border-slate-200 text-slate-700 text-[10px] py-0.5 px-2 hover:bg-slate-100 gap-1">
                        <Clock className="size-3" />
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {/* Transfer trigger */}
                      <TransferDialog
                        asset={{
                          id: alloc.asset.id,
                          assetTag: alloc.asset.assetTag,
                          name: alloc.asset.name,
                          currentUser: alloc.user.name,
                        }}
                        employees={employees}
                        trigger={
                          <Button variant="outline" size="sm">
                            <ArrowRightLeft className="size-3.5" />
                            Transfer
                          </Button>
                        }
                      />
                      
                      {/* Return confirmation */}
                      {canManage && (
                        <ConfirmationDialog
                          title="Process asset return?"
                          description="This confirms that the employee has returned the hardware asset. It will update its status to Available."
                          action={returnAssetAction}
                          hiddenFields={{ id: alloc.id }}
                          submitLabel="Process Return"
                          trigger={
                            <Button variant="outline" size="sm" className="border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
                              <Check className="size-3.5" />
                              Return
                            </Button>
                          }
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

/* ==========================================
   TAB: Transfer Requests
   ========================================== */
async function TransferRequestsTab({ canManage }: { canManage: boolean }) {
  const items = await prisma.transferRequest.findMany({
    where: { status: "PENDING" },
    include: {
      asset: { select: { assetTag: true, name: true } },
      fromUser: { select: { name: true } },
      toUser: { select: { name: true } },
      requestedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Card className="overflow-hidden border border-slate-200">
      {items.length === 0 ? (
        <div className="p-12 text-center">
          <EmptyState
            icon={ArrowRightLeft}
            title="No pending transfer requests"
            description="Reassignment pipelines are currently clear."
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/75 hover:bg-slate-50/75">
              <TableHead className="font-semibold text-slate-800">Tag</TableHead>
              <TableHead className="font-semibold text-slate-800">Asset Name</TableHead>
              <TableHead className="font-semibold text-slate-800">From Employee</TableHead>
              <TableHead className="font-semibold text-slate-800">To Employee</TableHead>
              <TableHead className="font-semibold text-slate-800">Requested By</TableHead>
              <TableHead className="font-semibold text-slate-800">Requested Date</TableHead>
              <TableHead className="text-right font-semibold text-slate-800">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((req) => {
              const reqDateStr = new Date(req.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <TableRow key={req.id} className="hover:bg-slate-50/40">
                  <TableCell className="font-mono font-bold text-slate-900 text-xs">
                    {req.asset.assetTag}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">{req.asset.name}</TableCell>
                  <TableCell className="text-slate-600 text-xs font-semibold">{req.fromUser.name}</TableCell>
                  <TableCell className="text-indigo-600 text-xs font-semibold">{req.toUser.name}</TableCell>
                  <TableCell className="text-slate-600 text-xs">{req.requestedBy.name}</TableCell>
                  <TableCell className="text-slate-600 text-xs">{reqDateStr}</TableCell>
                  <TableCell>
                    {canManage ? (
                      <div className="flex items-center justify-end gap-2">
                        {/* Approve Request */}
                        <form action={processTransferRequestAction}>
                          <input type="hidden" name="id" value={req.id} />
                          <input type="hidden" name="approve" value="true" />
                          <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-7">
                            <Check className="size-3.5" />
                            Approve
                          </Button>
                        </form>
                        
                        {/* Reject Request */}
                        <form action={processTransferRequestAction}>
                          <input type="hidden" name="id" value={req.id} />
                          <input type="hidden" name="approve" value="false" />
                          <Button type="submit" size="sm" variant="destructive" className="h-7">
                            <X className="size-3.5" />
                            Reject
                          </Button>
                        </form>
                      </div>
                    ) : (
                      <span className="text-[10px] uppercase font-bold text-slate-400 italic">Pending manager review</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

/* ==========================================
   TAB: Allocation History
   ========================================== */
async function AllocationHistoryTab({ q, page }: { q: string; page: number }) {
  const where: Prisma.AssetAllocationWhereInput = {};

  if (q) {
    where.OR = [
      { asset: { name: { contains: q } } },
      { asset: { assetTag: { contains: q } } },
      { user: { name: { contains: q } } },
      { user: { email: { contains: q } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.assetAllocation.findMany({
      where,
      include: {
        asset: {
          select: {
            assetTag: true,
            name: true,
            serialNumber: true,
            condition: true,
            location: true,
            category: { select: { name: true } },
          },
        },
        user: { select: { name: true, email: true } },
      },
      orderBy: { allocatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.assetAllocation.count({ where }),
  ]);

  const totalPages = pageCount(total);
  const currentPage = Math.min(page, totalPages || 1);

  return (
    <section className="space-y-4">
      {/* Search Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form className="flex w-full gap-2 sm:max-w-md">
          <input type="hidden" name="tab" value="history" />
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search history by asset, tag, email..."
              className="pl-8 h-8 text-xs"
            />
          </div>
          <Button type="submit" variant="outline" size="sm" className="h-8">
            Search
          </Button>
          {q && (
            <Link
              href="/allocation?tab=history"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      <Card className="overflow-hidden border border-slate-200">
        {items.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              icon={History}
              title="No history found"
              description="Historical allocations matching the query will display here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/75 hover:bg-slate-50/75">
                  <TableHead className="font-semibold text-slate-800">Tag</TableHead>
                  <TableHead className="font-semibold text-slate-800">Asset Name</TableHead>
                  <TableHead className="font-semibold text-slate-800">Assigned To</TableHead>
                  <TableHead className="font-semibold text-slate-800">Allocated At</TableHead>
                  <TableHead className="font-semibold text-slate-800">Returned At</TableHead>
                  <TableHead className="font-semibold text-slate-800">Allocation Status</TableHead>
                  <TableHead className="font-semibold text-slate-800 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((alloc) => {
                  const allocatedDateStr = new Date(alloc.allocatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const returnedDateStr = alloc.returnedAt
                    ? new Date(alloc.returnedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—";

                  return (
                    <TableRow key={alloc.id} className="hover:bg-slate-50/40">
                      <TableCell className="font-mono font-bold text-slate-900 text-xs">
                        {alloc.asset.assetTag}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">{alloc.asset.name}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-medium text-slate-900 text-sm leading-none">{alloc.user.name}</p>
                          <p className="text-[10px] text-slate-400">{alloc.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs">{allocatedDateStr}</TableCell>
                      <TableCell className="text-slate-600 text-xs">{returnedDateStr}</TableCell>
                      <TableCell>
                        {alloc.returned ? (
                          <Badge className="bg-slate-100 border-slate-200 text-slate-600 text-[10px] py-0.5 px-2 hover:bg-slate-100 gap-1 font-medium">
                            <CheckCircle2 className="size-3 text-emerald-500" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-50 border-blue-200 text-blue-700 text-[10px] py-0.5 px-2 hover:bg-blue-50 gap-1 font-medium">
                            <Activity className="size-3" />
                            Active Assignment
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <ReceiptButton
                          allocation={{
                            id: alloc.id,
                            assetTag: alloc.asset.assetTag,
                            assetName: alloc.asset.name,
                            serialNumber: alloc.asset.serialNumber,
                            categoryName: alloc.asset.category?.name || "Equipment",
                            assignedTo: alloc.user.name,
                            assignedToEmail: alloc.user.email,
                            allocatedAt: allocatedDateStr,
                            returnDate: alloc.returnDate ? new Date(alloc.returnDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null,
                            condition: alloc.asset.condition,
                            location: alloc.asset.location,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 bg-white px-5 py-3">
                <p className="text-xs text-slate-500">
                  Page <span className="font-semibold text-slate-900">{currentPage}</span> of{" "}
                  <span className="font-semibold text-slate-900">{totalPages}</span>
                </p>
                <div className="flex items-center gap-1">
                  <Link
                    href={pageHref("history", q, currentPage - 1)}
                    className={`inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 ${
                      currentPage <= 1 ? "pointer-events-none opacity-40" : ""
                    }`}
                  >
                    Previous
                  </Link>
                  <Link
                    href={pageHref("history", q, currentPage + 1)}
                    className={`inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 ${
                      currentPage >= totalPages ? "pointer-events-none opacity-40" : ""
                    }`}
                  >
                    Next
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </section>
  );
}
