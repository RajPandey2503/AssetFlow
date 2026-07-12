import React from "react";
import {
  ClipboardCheck,
  ShieldAlert,
  CheckCircle2,
  User,
  AlertTriangle,
  ArrowLeft,
  Activity,
  UserCheck,
  Check,
  ListTodo,
  ChevronRight,
  Search,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ToastFeedback } from "@/components/organization/toast-feedback";
import { CreateAuditCycleDialog, VerifyAuditItemDialog } from "@/components/audit/audit-dialogs";
import { ReportsCharts } from "@/components/reports/reports-charts";
import { ExportDataButton } from "@/components/reports/export-data-button";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ReportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const formatDate = (date: Date | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const actor = await requireAuth();
  const canManage = actor.role === "ADMIN" || actor.role === "ASSET_MANAGER";
  
  const params = await searchParams;
  const currentTab = typeof params.tab === "string" ? params.tab : "analytics";
  const selectedCycleId = typeof params.cycleId === "string" ? params.cycleId : null;

  // Search parameters for history tab
  const historyQuery = typeof params.historyQuery === "string" ? params.historyQuery.toLowerCase() : "";
  const historyAction = typeof params.historyAction === "string" ? params.historyAction : "";

  // Retrieve basic cycles, employees and all assets for analytics
  const [cycles, employees, allAssets, allMaintLogs, allBookingsLogs, allHistory] = await Promise.all([
    prisma.auditCycle.findMany({
      include: {
        auditor: { select: { id: true, name: true, email: true } },
        createdBy: { select: { name: true } },
        items: {
          include: {
            asset: { select: { id: true, assetTag: true, name: true, condition: true, status: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.asset.findMany({
      select: {
        id: true,
        assetTag: true,
        name: true,
        status: true,
        condition: true,
        acquisitionCost: true,
        location: true,
        createdAt: true,
        category: { select: { name: true } },
        department: { select: { name: true } },
      },
    }),
    prisma.maintenanceRecord.findMany({
      include: {
        asset: { select: { assetTag: true, name: true } },
        technician: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.findMany({
      include: {
        asset: { select: { assetTag: true, name: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { startTime: "desc" },
    }),
    prisma.assetHistory.findMany({
      include: {
        asset: { select: { assetTag: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Perform stats calculations for header KPIs
  const activeCyclesCount = cycles.filter((c) => c.status === "ACTIVE").length;
  
  let totalScoped = 0;
  let totalVerified = 0;
  let totalDiscrepancies = 0;
  
  const discrepanciesList: {
    id: string;
    cycleName: string;
    assetTag: string;
    assetName: string;
    originalCondition: string;
    reportedStatus: string;
    reportedAt: Date;
    auditorName: string;
    notes: string | null;
  }[] = [];

  cycles.forEach((c) => {
    c.items.forEach((item) => {
      totalScoped++;
      if (item.verified) {
        totalVerified++;
        if (item.status === "MISSING" || item.status === "DAMAGED") {
          totalDiscrepancies++;
          discrepanciesList.push({
            id: item.id,
            cycleName: c.name,
            assetTag: item.asset.assetTag,
            assetName: item.asset.name,
            originalCondition: item.asset.condition,
            reportedStatus: item.status,
            reportedAt: item.verifiedAt || new Date(),
            auditorName: c.auditor.name,
            notes: item.notes,
          });
        }
      }
    });
  });

  // Filter history logs based on search params
  const filteredHistory = allHistory.filter((h) => {
    const matchesAction = historyAction === "" || h.action === historyAction;
    const matchesQuery =
      historyQuery === "" ||
      h.asset.assetTag.toLowerCase().includes(historyQuery) ||
      h.asset.name.toLowerCase().includes(historyQuery) ||
      h.details.toLowerCase().includes(historyQuery) ||
      (h.changedBy && h.changedBy.toLowerCase().includes(historyQuery));
    return matchesAction && matchesQuery;
  });

  // Extract unique action types for drop-down filter
  const historyActions = Array.from(new Set(allHistory.map((h) => h.action))).sort();

  // Selected Cycle Details (if cycleId provided)
  const activeCycle = selectedCycleId ? cycles.find((c) => c.id === selectedCycleId) : null;
  const isAssignedAuditor = activeCycle ? activeCycle.auditorId === actor.id || actor.role === "ADMIN" || actor.role === "ASSET_MANAGER" : false;

  // ----------------------------------------------------
  // DATA PREPARATION FOR RECHARTS
  // ----------------------------------------------------

  // 1. Asset Utilization (Status proportional counts)
  const utilizationMap: Record<string, number> = {
    AVAILABLE: 0,
    ALLOCATED: 0,
    MAINTENANCE: 0,
    LOST: 0,
  };
  allAssets.forEach((a) => {
    const statusKey = a.status;
    if (statusKey in utilizationMap) {
      utilizationMap[statusKey]++;
    } else {
      utilizationMap[statusKey] = 1;
    }
  });
  const utilizationChartData = Object.entries(utilizationMap).map(([name, value]) => ({
    name,
    value,
  }));

  // 2. Department Summary
  const deptMap: Record<string, { count: number; cost: number }> = {};
  allAssets.forEach((a) => {
    const deptName = a.department?.name || "Unassigned";
    if (!deptMap[deptName]) {
      deptMap[deptName] = { count: 0, cost: 0 };
    }
    deptMap[deptName].count++;
    deptMap[deptName].cost += a.acquisitionCost || 0;
  });
  const departmentChartData = Object.entries(deptMap).map(([department, d]) => ({
    department,
    count: d.count,
    cost: d.cost,
  }));

  // 3. Maintenance Cost Trends (Last 6 Months)
  const maintMonthlyMap: Record<string, { cost: number; count: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    maintMonthlyMap[label] = { cost: 0, count: 0 };
  }
  allMaintLogs
    .filter((log) => log.status === "RESOLVED")
    .forEach((log) => {
      const date = log.completedAt || log.createdAt;
      const label = date.toLocaleString("en-US", { month: "short", year: "2-digit" });
      if (maintMonthlyMap[label]) {
        maintMonthlyMap[label].cost += log.cost || 0;
        maintMonthlyMap[label].count++;
      }
    });
  const maintenanceChartData = Object.entries(maintMonthlyMap).map(([month, d]) => ({
    month,
    cost: d.cost,
    count: d.count,
  }));

  // 4. Booking Heatmap (Density by Weekday)
  const weekdayMap: Record<string, number> = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  };
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  allBookingsLogs
    .filter((b) => b.status !== "CANCELLED")
    .forEach((b) => {
      const dayIdx = new Date(b.startTime).getDay();
      const dayName = weekdays[dayIdx];
      if (dayName in weekdayMap) {
        weekdayMap[dayName]++;
      }
    });
  const bookingChartData = Object.entries(weekdayMap).map(([day, count]) => ({
    day,
    count,
  }));

  // ----------------------------------------------------
  // DATA PREPARATION FOR CSV EXPORTS
  // ----------------------------------------------------
  const csvAssets = allAssets.map((a) => ({
    "Asset Tag": a.assetTag,
    Name: a.name,
    Category: a.category?.name || "N/A",
    Department: a.department?.name || "Unassigned",
    Condition: a.condition,
    Status: a.status,
    "Acquisition Cost": a.acquisitionCost ? a.acquisitionCost.toFixed(2) : "0.00",
    Location: a.location || "N/A",
    "Registered Date": a.createdAt.toLocaleDateString(),
  }));

  const csvMaintenance = allMaintLogs.map((m) => ({
    "Ticket ID": m.id,
    "Asset Tag": m.asset.assetTag,
    "Asset Name": m.asset.name,
    Description: m.description,
    Status: m.status,
    Technician: m.technician?.name || "Unassigned",
    "Repair Cost": m.cost ? m.cost.toFixed(2) : "0.00",
    Notes: m.notes || "N/A",
    "Created Date": m.createdAt.toLocaleDateString(),
    "Completed Date": m.completedAt ? m.completedAt.toLocaleDateString() : "N/A",
  }));

  const csvBookings = allBookingsLogs.map((b) => ({
    "Booking ID": b.id,
    "Asset Tag": b.asset.assetTag,
    "Asset Name": b.asset.name,
    "Reserved By": b.user.name,
    "Reserved Email": b.user.email,
    "Start Time": b.startTime.toLocaleString(),
    "End Time": b.endTime.toLocaleString(),
    Status: b.status,
    "Reminder Enabled": b.needReminder ? "Yes" : "No",
    "Reminder Sent": b.reminderSent ? "Yes" : "No",
  }));

  const csvHistory = filteredHistory.map((h) => ({
    Timestamp: h.createdAt.toLocaleString(),
    "Asset Tag": h.asset.assetTag,
    "Asset Name": h.asset.name,
    Action: h.action,
    Details: h.details,
    "Performed By": h.changedBy || "System",
  }));

  // Style helper for action badges
  const actionBadges: Record<string, string> = {
    CREATED: "bg-emerald-50 text-emerald-800 border-emerald-250",
    ALLOCATED: "bg-blue-50 text-blue-800 border-blue-250",
    RETURNED: "bg-teal-50 text-teal-800 border-teal-250",
    BOOKED: "bg-sky-50 text-sky-800 border-sky-250",
    BOOKING_CANCELLED: "bg-slate-50 text-slate-600 border-slate-250",
    MAINTENANCE_REQUESTED: "bg-amber-50 text-amber-800 border-amber-250",
    MAINTENANCE_APPROVED: "bg-amber-100 text-amber-900 border-amber-300",
    MAINTENANCE_ASSIGNED: "bg-orange-50 text-orange-850 border-orange-250",
    MAINTENANCE_STARTED: "bg-orange-100 text-orange-900 border-orange-300",
    MAINTENANCE_RESOLVED: "bg-emerald-100 text-emerald-900 border-emerald-300",
    AUDIT_SCOPED: "bg-indigo-50 text-indigo-800 border-indigo-250",
    AUDIT_VERIFIED: "bg-emerald-50 text-emerald-850 border-emerald-250",
    AUDIT_DISCREPANCY_MISSING: "bg-red-50 text-red-800 border-red-250",
    AUDIT_DISCREPANCY_DAMAGED: "bg-red-100 text-red-900 border-red-300",
  };

  return (
    <div className="space-y-8">
      {/* Toast notifications */}
      <ToastFeedback />

      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reports & Audits</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Monitor inventory completeness, inspect auditor verification records, and audit discrepancy logs.
          </p>
        </div>
        {canManage && (
          <div className="flex-shrink-0">
            <CreateAuditCycleDialog employees={employees} />
          </div>
        )}
      </div>

      {/* KPI Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {/* Active Cycles */}
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Active Cycles</p>
              <h2 className="mt-2 text-3xl font-bold">{activeCyclesCount}</h2>
            </div>
            <Activity className="h-10 w-10 text-indigo-600" />
          </CardContent>
        </Card>

        {/* Verified Items */}
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Items Verified</p>
              <h2 className="mt-2 text-3xl font-bold">
                {totalVerified} <span className="text-sm font-medium text-slate-400">/ {totalScoped}</span>
              </h2>
            </div>
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </CardContent>
        </Card>

        {/* Discrepancies Detected */}
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Discrepancies</p>
              <h2 className="mt-2 text-3xl font-bold text-rose-600">{totalDiscrepancies}</h2>
            </div>
            <ShieldAlert className="h-10 w-10 text-rose-500" />
          </CardContent>
        </Card>

        {/* Completion Progress */}
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Audit Completion</p>
              <h2 className="mt-2 text-3xl font-bold">
                {totalScoped > 0 ? Math.round((totalVerified / totalScoped) * 100) : 0}%
              </h2>
            </div>
            <ListTodo className="h-10 w-10 text-blue-600" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs list (hidden if viewing a specific cycle) */}
      {!activeCycle && (
        <div className="flex border-b border-slate-200">
          <Link
            href="/reports?tab=analytics"
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 transition-all",
              currentTab === "analytics"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            Analytics & Charts
          </Link>
          <Link
            href="/reports?tab=cycles"
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 transition-all",
              currentTab === "cycles"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            Audit Cycles ({cycles.length})
          </Link>
          <Link
            href="/reports?tab=discrepancy"
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 transition-all",
              currentTab === "discrepancy"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            Auto Discrepancy Report ({totalDiscrepancies})
          </Link>
          <Link
            href="/reports?tab=audit"
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 transition-all",
              currentTab === "audit"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            System Audit Logs
          </Link>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB: ANALYTICS & CHARTS (DEFAULT)
          ---------------------------------------------------- */}
      {!activeCycle && currentTab === "analytics" && (
        <div className="space-y-6">
          {/* Export Panel */}
          <Card className="border border-slate-200 bg-white">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Export Raw Analytics Reports</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Generate spreadsheet-compatible CSV records for local review</p>
              </div>
            </div>
            <CardContent className="p-4 flex flex-wrap gap-3">
              <ExportDataButton data={csvAssets} filename="asset_registry_report.csv" label="Export Assets CSV" />
              <ExportDataButton data={csvMaintenance} filename="maintenance_history_report.csv" label="Export Maintenance CSV" />
              <ExportDataButton data={csvBookings} filename="booking_schedules_report.csv" label="Export Bookings CSV" />
            </CardContent>
          </Card>

          {/* Recharts panels */}
          <ReportsCharts
            utilizationData={utilizationChartData}
            departmentData={departmentChartData}
            maintenanceData={maintenanceChartData}
            bookingData={bookingChartData}
          />
        </div>
      )}

      {/* ----------------------------------------------------
          TAB: AUDIT CYCLES
          ---------------------------------------------------- */}
      {!activeCycle && currentTab === "cycles" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {cycles.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <EmptyState
                icon={ClipboardCheck}
                title="No audits scheduled"
                description="Schedule an audit cycle to begin verifying company hardware assets."
              />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-55/40">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Audit Cycle</TableHead>
                  <TableHead className="font-semibold text-slate-700">Assigned Auditor</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">Progress</TableHead>
                  <TableHead className="font-semibold text-slate-700">Due Date</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycles.map((c) => {
                  const verifiedItems = c.items.filter((item) => item.verified).length;
                  const totalItems = c.items.length;
                  const progressPct = totalItems > 0 ? Math.round((verifiedItems / totalItems) * 100) : 0;

                  return (
                    <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-slate-900">
                        <div>
                          <p className="font-bold text-slate-900">{c.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Created by {c.createdBy.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                          <User className="size-3.5 text-slate-400" />
                          <div>
                            <p className="font-semibold">{c.auditor.name}</p>
                            <p className="text-[10px] text-slate-400">{c.auditor.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="flex flex-col items-center justify-center gap-1 min-w-[120px]">
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className={cn(
                                "h-2 rounded-full",
                                c.status === "COMPLETED" ? "bg-emerald-500" : "bg-indigo-500"
                              )}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600">
                            {verifiedItems} / {totalItems} verified ({progressPct}%)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 font-medium">
                        {formatDate(c.dueDate)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold py-0.5 px-2",
                            c.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          )}
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/reports?cycleId=${c.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50 flex items-center gap-1 ml-auto">
                            Inspect
                            <ChevronRight className="size-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          VIEW SPECIFIC CYCLE DETAILS & VERIFY
          ---------------------------------------------------- */}
      {activeCycle && (
        <div className="space-y-6">
          {/* Back to audit list */}
          <Link href="/reports?tab=cycles">
            <Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-slate-900 gap-1.5 pl-1.5">
              <ArrowLeft className="size-4" />
              Back to Audit Cycles
            </Button>
          </Link>

          {/* Cycle Info Panel */}
          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <h2 className="text-xl font-bold text-slate-900">{activeCycle.name}</h2>
                    <Badge
                      className={
                        activeCycle.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-blue-100 text-blue-800 border-blue-200"
                      }
                    >
                      {activeCycle.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Assigned auditor: <strong>{activeCycle.auditor.name}</strong> ({activeCycle.auditor.email}). Due on {formatDate(activeCycle.dueDate)}.
                  </p>
                </div>
                
                {isAssignedAuditor && activeCycle.status === "ACTIVE" && (
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-805 border-indigo-200 text-xs font-semibold py-1 px-3">
                    <UserCheck className="size-4 text-indigo-600 mr-1.5" />
                    You are the assigned Auditor
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items Scoped list */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50/40">
              <h3 className="text-sm font-bold text-slate-800">Scoped Asset Items</h3>
            </div>

            <Table>
              <TableHeader className="bg-slate-55/20">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Asset Tag</TableHead>
                  <TableHead className="font-semibold text-slate-700">Asset Name</TableHead>
                  <TableHead className="font-semibold text-slate-700">Original Condition</TableHead>
                  <TableHead className="font-semibold text-slate-700">System Status</TableHead>
                  <TableHead className="font-semibold text-slate-700">Verification</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCycle.items.map((item) => {
                  const isVerified = item.verified;

                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50/30 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-slate-900">
                        {item.asset.assetTag}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-800 max-w-[180px] truncate" title={item.asset.name}>
                        {item.asset.name}
                      </TableCell>
                      <TableCell className="text-xs text-slate-650 font-medium">
                        {item.asset.condition}
                      </TableCell>
                      <TableCell className="text-xs text-slate-655 font-medium">
                        {item.asset.status}
                      </TableCell>
                      <TableCell>
                        {isVerified ? (
                          <div className="space-y-1">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] font-bold py-0.5 px-2",
                                item.status === "VERIFIED"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : item.status === "MISSING"
                                  ? "bg-red-50 text-red-800 border-red-200"
                                  : "bg-amber-50 text-amber-800 border-amber-250"
                              )}
                            >
                              {item.status === "VERIFIED" ? "PRESENT & GOOD" : item.status}
                            </Badge>
                            {item.notes && (
                              <p className="text-[10px] text-slate-400 italic line-clamp-1" title={item.notes}>
                                &quot;{item.notes}&quot;
                              </p>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-slate-100 text-slate-600 text-[9px] font-bold">
                            PENDING
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!isVerified && (isAssignedAuditor || canManage) && activeCycle.status === "ACTIVE" ? (
                          <VerifyAuditItemDialog
                            itemId={item.id}
                            assetTag={item.asset.assetTag}
                            assetName={item.asset.name}
                            trigger={
                              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-[10px] px-2.5 py-0" size="sm">
                                <Check className="size-3.5" />
                                Verify
                              </Button>
                            }
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            {isVerified ? `Verified on ${formatDate(item.verifiedAt)}` : "Auditor action only"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB: AUTO DISCREPANCY REPORT
          ---------------------------------------------------- */}
      {!activeCycle && currentTab === "discrepancy" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border bg-amber-50 border-amber-100 text-amber-850 rounded-xl p-4 text-xs">
            <AlertTriangle className="size-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-slate-850">Dynamic Discrepancy Reporting</p>
              <p className="text-slate-600 mt-0.5">
                The report lists assets reported missing or damaged during audit checks. State updates (e.g. marking missing items as LOST and damaged items as BROKEN) are resolved automatically.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {discrepanciesList.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <EmptyState
                  icon={ShieldAlert}
                  title="No discrepancies detected"
                  description="All scoped auditor checks matched their system conditions successfully."
                />
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-55/40">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Audit Scope</TableHead>
                    <TableHead className="font-semibold text-slate-700">Asset Info</TableHead>
                    <TableHead className="font-semibold text-slate-700">Original Condition</TableHead>
                    <TableHead className="font-semibold text-slate-700">Reported Condition</TableHead>
                    <TableHead className="font-semibold text-slate-700">Verified By</TableHead>
                    <TableHead className="font-semibold text-slate-700">Verification Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discrepanciesList.map((disc) => (
                    <TableRow key={disc.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-slate-900 text-xs">
                        {disc.cycleName}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-1 py-0.5 rounded inline-block">
                            {disc.assetTag}
                          </p>
                          <p className="text-xs font-semibold text-slate-800 truncate max-w-[160px] mt-1" title={disc.assetName}>
                            {disc.assetName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-650 font-medium">
                        {disc.originalCondition}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold py-0.5 px-2",
                            disc.reportedStatus === "MISSING"
                              ? "bg-red-50 text-red-800 border-red-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          )}
                        >
                          {disc.reportedStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <p className="font-semibold text-slate-800">{disc.auditorName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(disc.reportedAt)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-[200px] truncate italic" title={disc.notes || ""}>
                        {disc.notes ? `"${disc.notes}"` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB: SYSTEM AUDIT LOGS
          ---------------------------------------------------- */}
      {!activeCycle && currentTab === "audit" && (
        <div className="space-y-4">
          {/* Action Filter Panel */}
          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-4">
              <form method="GET" action="/reports" className="flex flex-col md:flex-row gap-3 items-center">
                <input type="hidden" name="tab" value="audit" />
                
                {/* Text Search */}
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    name="historyQuery"
                    defaultValue={params.historyQuery || ""}
                    placeholder="Search logs by tag, asset name, or details..."
                    className="pl-9 h-9"
                  />
                </div>

                {/* Dropdown Action Select */}
                <div className="w-full md:w-56">
                  <Select name="historyAction" defaultValue={params.historyAction || ""}>
                    <option value="">All Action Types</option>
                    {historyActions.map((action) => (
                      <option key={action} value={action}>
                        {action.replace(/_/g, " ")}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <Button type="submit" size="sm" className="h-9 w-full md:w-auto">
                    Apply Filter
                  </Button>
                  <ExportDataButton data={csvHistory} filename="system_audit_trail_report.csv" label="Export Logs CSV" />
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Audit Logs Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {filteredHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <EmptyState
                  icon={ClipboardCheck}
                  title="No logs found"
                  description="Adjust your search parameters or query filters to locate logs."
                />
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-55/40">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Timestamp</TableHead>
                    <TableHead className="font-semibold text-slate-700">Asset Tag</TableHead>
                    <TableHead className="font-semibold text-slate-700">Action Tag</TableHead>
                    <TableHead className="font-semibold text-slate-700">Detail Logs</TableHead>
                    <TableHead className="font-semibold text-slate-700">Performed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="text-xs text-slate-500 font-medium">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1 py-0.5 rounded inline-block">
                            {log.asset.assetTag}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[120px] mt-0.5" title={log.asset.name}>
                            {log.asset.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-bold py-0.5 px-2 uppercase border",
                            actionBadges[log.action] || "bg-slate-100 text-slate-800 border-slate-200"
                          )}
                        >
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 font-medium max-w-sm leading-relaxed">
                        {log.details}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-semibold">
                        {log.changedBy || "System"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
