import React from "react";
import Link from "next/link";
import {
  CalendarRange,
  Clock,
  Mail,
  XSquare,
  Calendar,
  XCircle,
  CheckCircle,
  User,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToastFeedback } from "@/components/organization/toast-feedback";
import { BookingDialog } from "@/components/bookings/booking-dialog";
import { CalendarView } from "@/components/bookings/calendar-view";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { cancelBookingAction, triggerRemindersAction } from "@/lib/bookings/actions";

type BookingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  await requireAuth();
  
  const params = await searchParams;
  const listTab = typeof params.list === "string" ? params.list : "active";

  // Dynamic Status Auto-Updates
  const now = new Date();
  await prisma.$transaction([
    prisma.booking.updateMany({
      where: {
        status: "UPCOMING",
        startTime: { lte: now },
      },
      data: { status: "ONGOING" },
    }),
    prisma.booking.updateMany({
      where: {
        status: "ONGOING",
        endTime: { lt: now },
      },
      data: { status: "COMPLETED" },
    }),
  ]);

  // Retrieve shared assets and employees
  const [sharedAssets, employees, bookings] = await Promise.all([
    prisma.asset.findMany({
      where: { sharedResource: true },
      select: { id: true, assetTag: true, name: true },
      orderBy: { assetTag: "asc" },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.booking.findMany({
      include: {
        asset: { select: { assetTag: true, name: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { startTime: "asc" },
    }),
  ]);

  // KPI calculations
  const totalActive = bookings.filter((b) => b.status === "UPCOMING" || b.status === "ONGOING").length;
  const ongoingCount = bookings.filter((b) => b.status === "ONGOING").length;
  const pendingReminders = bookings.filter((b) => b.needReminder && !b.reminderSent && (b.status === "UPCOMING" || b.status === "ONGOING")).length;
  const cancelledCount = bookings.filter((b) => b.status === "CANCELLED").length;

  // Filter list bookings based on selected listTab
  const filteredBookings = bookings.filter((b) => {
    if (listTab === "active") return b.status === "UPCOMING" || b.status === "ONGOING";
    if (listTab === "completed") return b.status === "COMPLETED";
    if (listTab === "cancelled") return b.status === "CANCELLED";
    return true;
  });

  const statusColors: Record<string, string> = {
    UPCOMING: "bg-emerald-100 text-emerald-800 border-emerald-200",
    ONGOING: "bg-blue-100 text-blue-800 border-blue-200",
    COMPLETED: "bg-slate-100 text-slate-800 border-slate-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <div className="space-y-8">
      {/* Toast feedback component */}
      <ToastFeedback />

      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Resource Bookings</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Schedule rooms, test devices, and shared workspaces. Overlaps are verified dynamically.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {pendingReminders > 0 && (
            <form action={triggerRemindersAction}>
              <Button variant="outline" className="border-amber-200 hover:bg-amber-50 text-amber-700 h-9 text-xs">
                <Mail className="size-4" />
                Dispatch Reminders ({pendingReminders})
              </Button>
            </form>
          )}
          <BookingDialog assets={sharedAssets} employees={employees} />
        </div>
      </div>

      {/* Booking Dashboard stats */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {/* Total Bookings */}
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Active Bookings</p>
              <h2 className="mt-2 text-3xl font-bold">{totalActive}</h2>
            </div>
            <CalendarRange className="h-10 w-10 text-blue-600" />
          </CardContent>
        </Card>

        {/* Ongoing */}
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Ongoing Now</p>
              <h2 className="mt-2 text-3xl font-bold">{ongoingCount}</h2>
            </div>
            <Clock className="h-10 w-10 text-emerald-600" />
          </CardContent>
        </Card>

        {/* Pending Reminders */}
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Pending Reminders</p>
              <h2 className="mt-2 text-3xl font-bold">{pendingReminders}</h2>
            </div>
            <Mail className="h-10 w-10 text-amber-600" />
          </CardContent>
        </Card>

        {/* Cancelled */}
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Cancelled Bookings</p>
              <h2 className="mt-2 text-3xl font-bold">{cancelledCount}</h2>
            </div>
            <XSquare className="h-10 w-10 text-red-600" />
          </CardContent>
        </Card>
      </div>

      {/* Main Section: Calendar & List Directory */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side: Calendar View */}
        <div className="lg:col-span-2">
          <CalendarView bookings={bookings} />
        </div>

        {/* Right Side: Schedules Directory */}
        <div className="space-y-4">
          <Card className="border border-slate-200 bg-white p-5 flex flex-col h-full">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-1.5">
              <Calendar className="size-4 text-slate-700" />
              Schedules Registry
            </h2>
            
            {/* List subtabs */}
            <div className="grid grid-cols-3 gap-1 border-b border-slate-100 pb-2 mb-4">
              <Link
                href="/bookings?list=active"
                className={`text-center py-1.5 rounded-lg text-xs font-semibold ${
                  listTab === "active" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                Active ({totalActive})
              </Link>
              <Link
                href="/bookings?list=completed"
                className={`text-center py-1.5 rounded-lg text-xs font-semibold ${
                  listTab === "completed" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                Done
              </Link>
              <Link
                href="/bookings?list=cancelled"
                className={`text-center py-1.5 rounded-lg text-xs font-semibold ${
                  listTab === "cancelled" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                Cancelled ({cancelledCount})
              </Link>
            </div>

            {/* List items block */}
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[360px] pr-1">
              {filteredBookings.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No bookings found in this view.
                </div>
              ) : (
                filteredBookings.map((b) => {
                  const bStart = new Date(b.startTime);
                  const bEnd = new Date(b.endTime);

                  const formattedDate = bStart.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                  const formattedTime = `${bStart.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} - ${bEnd.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`;

                  const canCancel = b.status === "UPCOMING" || b.status === "ONGOING";

                  return (
                    <div
                      key={b.id}
                      className="border border-slate-100 rounded-lg p-3 hover:bg-slate-50/50 transition-colors flex flex-col justify-between gap-3 bg-white"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-mono text-[10px] font-bold text-slate-800 bg-slate-100 px-1 py-0.5 rounded">
                              {b.asset.assetTag}
                            </span>
                            <Badge variant="outline" className={`${statusColors[b.status]} text-[9px] py-0 px-1.5`}>
                              {b.status}
                            </Badge>
                          </div>
                          <p className="font-medium text-slate-800 text-xs truncate" title={b.asset.name}>
                            {b.asset.name}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-medium flex items-center gap-1">
                            <User className="size-3 text-slate-350" />
                            {b.user.name}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold text-slate-800">{formattedDate}</p>
                          <p className="text-[9px] text-slate-400 font-medium mt-0.5">{formattedTime}</p>
                        </div>
                      </div>

                      {/* Reminder feedback alert */}
                      <div className="flex items-center justify-between gap-2 border-t border-slate-50 pt-2 text-[10px] text-slate-400">
                        <span>
                          {b.needReminder ? (
                            b.reminderSent ? (
                              <span className="text-emerald-600 flex items-center gap-0.5">
                                <CheckCircle className="size-3" />
                                Alert Dispatched
                              </span>
                            ) : (
                              <span className="text-amber-600 flex items-center gap-0.5">
                                <Clock className="size-3" />
                                Alert Scheduled
                              </span>
                            )
                          ) : (
                            "No Alerts"
                          )}
                        </span>

                        {canCancel && (
                          <ConfirmationDialog
                            title="Cancel resource booking?"
                            description="This frees up the selected time slot for other employee bookings."
                            action={cancelBookingAction}
                            hiddenFields={{ id: b.id }}
                            submitLabel="Cancel Booking"
                            trigger={
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-destructive text-[10px] hover:bg-destructive/10 hover:text-destructive flex items-center gap-1"
                              >
                                <XCircle className="size-3" />
                                Cancel Slot
                              </Button>
                            }
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
