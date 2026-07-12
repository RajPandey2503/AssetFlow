import React from "react";
import {
  Wrench,
  Clock,
  CheckCircle2,
  DollarSign,
  UserCheck,
  Play,
  Check,
  Calendar,
  ClipboardList,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ToastFeedback } from "@/components/organization/toast-feedback";
import {
  RequestMaintenanceDialog,
  AssignTechnicianDialog,
  ResolveMaintenanceDialog,
} from "@/components/maintenance/maintenance-dialogs";
import { approveMaintenanceAction, startMaintenanceAction } from "@/lib/maintenance/actions";
import Link from "next/link";
import { cn } from "@/lib/utils";

type MaintenancePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const formatCurrency = (val: number | null) => {
  if (val === null || val === undefined) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(val);
};

const formatDate = (date: Date | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default async function MaintenancePage({ searchParams }: MaintenancePageProps) {
  const actor = await requireAuth();
  const canManage = actor.role === "ADMIN" || actor.role === "ASSET_MANAGER";
  
  const params = await searchParams;
  const currentTab = typeof params.tab === "string" ? params.tab : "pending";

  // Fetch all maintenance records, assets, and technicians
  const [tickets, assets, technicians] = await Promise.all([
    prisma.maintenanceRecord.findMany({
      include: {
        asset: { select: { assetTag: true, name: true, status: true } },
        technician: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.asset.findMany({
      orderBy: { assetTag: "asc" },
      select: { id: true, assetTag: true, name: true },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // KPI Calculations
  const pendingCount = tickets.filter((t) => t.status === "PENDING").length;
  const progressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;
  const totalCost = tickets
    .filter((t) => t.status === "RESOLVED" && t.cost !== null)
    .reduce((sum, t) => sum + (t.cost || 0), 0);

  // Group tickets by current status tab
  // Allowed tab keys: pending, approved, assigned, progress, resolved
  const tabTickets = tickets.filter((t) => {
    if (currentTab === "pending") return t.status === "PENDING";
    if (currentTab === "approved") return t.status === "APPROVED";
    if (currentTab === "assigned") return t.status === "TECHNICIAN_ASSIGNED";
    if (currentTab === "progress") return t.status === "IN_PROGRESS";
    if (currentTab === "resolved") return t.status === "RESOLVED";
    return false;
  });

  const tabCounts = {
    pending: pendingCount,
    approved: tickets.filter((t) => t.status === "APPROVED").length,
    assigned: tickets.filter((t) => t.status === "TECHNICIAN_ASSIGNED").length,
    progress: progressCount,
    resolved: resolvedCount,
  };

  const tabs = [
    { value: "pending", label: "Pending Approval" },
    { value: "approved", label: "Approved" },
    { value: "assigned", label: "Tech Assigned" },
    { value: "progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
  ];

  return (
    <div className="space-y-8">
      {/* Toast notifications */}
      <ToastFeedback />

      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Maintenance Workflow</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Request repairs, assign engineers, progress work tickets, and review total service costs.
          </p>
        </div>
        <div className="flex-shrink-0">
          <RequestMaintenanceDialog assets={assets} defaultOpen={params.new === "true"} />
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {/* Pending Requests */}
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Pending Approval</p>
              <h2 className="mt-2 text-3xl font-bold">{pendingCount}</h2>
            </div>
            <Clock className="h-10 w-10 text-amber-600" />
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Repairs In Progress</p>
              <h2 className="mt-2 text-3xl font-bold">{progressCount}</h2>
            </div>
            <Wrench className="h-10 w-10 text-blue-600" />
          </CardContent>
        </Card>

        {/* Resolved */}
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Resolved Tickets</p>
              <h2 className="mt-2 text-3xl font-bold">{resolvedCount}</h2>
            </div>
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Service Costs</p>
              <h2 className="mt-2 text-2xl font-bold">{formatCurrency(totalCost)}</h2>
            </div>
            <DollarSign className="h-10 w-10 text-indigo-600" />
          </CardContent>
        </Card>
      </div>

      {/* Workflow Tabs */}
      <div className="flex flex-wrap gap-2 rounded-lg border bg-white p-1">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={`/maintenance?tab=${t.value}`}
            className={cn(
              "flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              currentTab === t.value && "bg-slate-900 text-white hover:bg-slate-900 hover:text-white"
            )}
          >
            {t.label}
            <span className={cn(
              "ml-1 text-xs rounded-full px-1.5 py-0.25 font-bold",
              currentTab === t.value ? "bg-white text-slate-900" : "bg-slate-100 text-slate-650"
            )}>
              {tabCounts[t.value as keyof typeof tabCounts]}
            </span>
          </Link>
        ))}
      </div>

      {/* Workflow Column Cards Display */}
      {tabTickets.length === 0 ? (
        <div className="border border-dashed border-slate-200 bg-slate-50/50 rounded-xl p-12 text-center">
          <EmptyState
            icon={ClipboardList}
            title="No tickets in this stage"
            description="All maintenance tasks in this stage are up to date."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tabTickets.map((ticket) => (
            <Card key={ticket.id} className="border border-slate-200 hover:shadow-md transition-shadow bg-white flex flex-col justify-between p-5 space-y-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <Badge className="bg-slate-950 font-mono text-white text-[10px] tracking-wider py-0.5 px-2">
                    {ticket.asset.assetTag}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Calendar className="size-3" />
                    {formatDate(ticket.createdAt)}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 truncate leading-snug">
                    {ticket.asset.name}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {ticket.description}
                  </p>
                </div>

                {/* Technician assignment preview if exists */}
                {ticket.technician && (
                  <div className="flex items-center gap-2 rounded bg-slate-50 p-2 text-xs border border-slate-100">
                    <UserCheck className="size-3.5 text-slate-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 leading-none">Assigned Technician</p>
                      <p className="font-semibold text-slate-800 mt-0.5 truncate">{ticket.technician.name}</p>
                    </div>
                  </div>
                )}

                {/* Cost & Notes for Resolved Tickets */}
                {ticket.status === "RESOLVED" && (
                  <div className="bg-emerald-50/50 rounded-lg p-3 text-xs border border-emerald-100 space-y-2">
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-medium text-slate-500">Repair Cost:</span>
                      <span className="font-bold text-emerald-700 text-sm">{formatCurrency(ticket.cost)}</span>
                    </div>
                    {ticket.notes && (
                      <div className="space-y-0.5">
                        <span className="font-medium text-slate-500">Resolution Notes:</span>
                        <p className="text-slate-600 leading-normal italic">&quot;{ticket.notes}&quot;</p>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 text-right">
                      Closed on {formatDate(ticket.completedAt)}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons based on status */}
              {canManage && ticket.status !== "RESOLVED" && (
                <div className="border-t border-slate-50 pt-3 flex items-center justify-end gap-2">
                  {/* Transition actions */}
                  {ticket.status === "PENDING" && (
                    <>
                      {/* Approve */}
                      <form action={approveMaintenanceAction}>
                        <input type="hidden" name="id" value={ticket.id} />
                        <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-8">
                          <Check className="size-3.5" />
                          Approve
                        </Button>
                      </form>

                      {/* Assign */}
                      <AssignTechnicianDialog
                        ticketId={ticket.id}
                        technicians={technicians}
                        trigger={
                          <Button variant="outline" size="sm" className="h-8">
                            Assign Tech
                          </Button>
                        }
                      />
                    </>
                  )}

                  {ticket.status === "APPROVED" && (
                    <AssignTechnicianDialog
                      ticketId={ticket.id}
                      technicians={technicians}
                      trigger={
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white h-8" size="sm">
                          Assign Technician
                        </Button>
                      }
                    />
                  )}

                  {ticket.status === "TECHNICIAN_ASSIGNED" && (
                    <form action={startMaintenanceAction}>
                      <input type="hidden" name="id" value={ticket.id} />
                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 w-full" size="sm">
                        <Play className="size-3.5" />
                        Start Repair Work
                      </Button>
                    </form>
                  )}

                  {ticket.status === "IN_PROGRESS" && (
                    <ResolveMaintenanceDialog
                      ticketId={ticket.id}
                      trigger={
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 w-full" size="sm">
                          <CheckCircle2 className="size-3.5" />
                          Resolve Ticket
                        </Button>
                      }
                    />
                  )}
                </div>
              )}

              {/* Read-only indicators for employee view */}
              {!canManage && ticket.status !== "RESOLVED" && (
                <div className="text-[10px] uppercase font-bold text-slate-400 border-t border-slate-50 pt-3 text-right italic">
                  Pending admin review
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
