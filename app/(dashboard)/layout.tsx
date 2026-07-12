import { ReactNode } from "react";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAuth();
  const now = new Date();

  // Retrieve notification alerts
  const [overdueAllocations, bookingReminders, maintenanceAlerts] = await Promise.all([
    prisma.assetAllocation.findMany({
      where: {
        returnedAt: null,
        returnDate: { lt: now },
      },
      include: {
        asset: { select: { assetTag: true, name: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.booking.findMany({
      where: {
        status: "UPCOMING",
        startTime: {
          gt: now,
          lte: new Date(now.getTime() + 24 * 60 * 60 * 1000), // next 24h
        },
      },
      include: {
        asset: { select: { assetTag: true, name: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.maintenanceRecord.findMany({
      where: {
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      include: {
        asset: { select: { assetTag: true, name: true } },
      },
    }),
  ]);

  // Construct consolidated alerts array
  const notifications = [
    ...overdueAllocations.map((a) => ({
      id: `overdue-${a.id}`,
      type: "OVERDUE",
      title: "Overdue Return Alert",
      message: `Asset [${a.asset.assetTag}] ${a.asset.name} is overdue for return by ${a.user.name}.`,
      timestamp: a.returnDate || new Date(),
    })),
    ...bookingReminders.map((b) => ({
      id: `booking-${b.id}`,
      type: "REMINDER",
      title: "Upcoming Booking",
      message: `Resource [${b.asset.assetTag}] ${b.asset.name} is reserved for ${b.user.name} starting soon.`,
      timestamp: b.startTime,
    })),
    ...maintenanceAlerts.map((m) => ({
      id: `maint-${m.id}`,
      type: "MAINTENANCE",
      title: "Maintenance Alert",
      message: `Asset [${m.asset.assetTag}] ${m.asset.name} is in status: ${m.status.toLowerCase().replace("_", " ")}.`,
      timestamp: m.createdAt,
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // sort newest first

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar user={user} notifications={notifications} />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
