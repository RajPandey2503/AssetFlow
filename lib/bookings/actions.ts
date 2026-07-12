"use server";

import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BookingStatus } from "@/app/generated/prisma/enums";

function value(formData: FormData, key: string) {
  const formValue = formData.get(key);
  return typeof formValue === "string" ? formValue : "";
}

function redirectWithToast(message: string, type: "success" | "error" = "success") {
  const params = new URLSearchParams({
    toast: message,
    toastType: type,
  });
  redirect(`/bookings?${params.toString()}`);
}

export async function createBookingAction(formData: FormData) {
  const actor = await requireAuth();

  try {
    const assetId = value(formData, "assetId");
    const userId = value(formData, "userId");
    const startStr = value(formData, "startTime");
    const endStr = value(formData, "endTime");
    const needReminder = value(formData, "needReminder") === "on" || value(formData, "needReminder") === "true";

    if (!assetId || !userId || !startStr || !endStr) {
      throw new Error("Asset, employee, start time, and end time are required.");
    }

    const startTime = new Date(startStr);
    const endTime = new Date(endStr);
    const now = new Date();

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error("Invalid start or end date format.");
    }

    if (startTime >= endTime) {
      throw new Error("Start time must be before the end time.");
    }

    if (startTime < now && Math.abs(now.getTime() - startTime.getTime()) > 1000 * 60 * 15) {
      // Allow booking starting slightly in the past (up to 15 mins) for flexibility, otherwise block
      throw new Error("Booking start time cannot be in the past.");
    }

    // Verify asset exists and is a shared resource
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { sharedResource: true, name: true, assetTag: true },
    });

    if (!asset) {
      throw new Error("Asset not found.");
    }

    if (!asset.sharedResource) {
      throw new Error(`Asset ${asset.assetTag} (${asset.name}) is not registered as a Shared Resource and cannot be booked.`);
    }

    const employee = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    if (!employee) {
      throw new Error("Target employee not found.");
    }

    // Enforce Overlap Validation
    const overlapping = await prisma.booking.findFirst({
      where: {
        assetId,
        status: { in: ["UPCOMING", "ONGOING"] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      include: { user: { select: { name: true } } },
    });

    if (overlapping) {
      throw new Error(
        `Overlap detected: Asset is already booked by ${
          overlapping.user.name
        } from ${new Date(overlapping.startTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })} to ${new Date(overlapping.endTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}.`
      );
    }

    // Set initial status based on current time
    let status: BookingStatus = "UPCOMING";
    if (startTime <= now && endTime >= now) {
      status = "ONGOING";
    } else if (endTime < now) {
      status = "COMPLETED";
    }

    const formattedStart = startTime.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const formattedEnd = endTime.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    await prisma.$transaction([
      prisma.booking.create({
        data: {
          assetId,
          userId,
          startTime,
          endTime,
          status,
          needReminder,
          reminderSent: false,
        },
      }),
      prisma.assetHistory.create({
        data: {
          assetId,
          action: "BOOKED",
          details: `Resource booked for ${employee.name} from ${formattedStart} to ${formattedEnd}. Reminder: ${needReminder ? "Enabled" : "Disabled"}.`,
          changedBy: actor.name || actor.email,
        },
      }),
    ]);

    redirectWithToast(`Resource ${asset.assetTag} successfully booked for ${employee.name}.`);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest: string }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Unable to book resource.";
    redirectWithToast(message, "error");
  }
}

export async function cancelBookingAction(formData: FormData) {
  const actor = await requireAuth();

  try {
    const id = value(formData, "id");
    if (!id) {
      throw new Error("Booking ID is required.");
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { asset: true, user: true },
    });

    if (!booking) {
      throw new Error("Booking record not found.");
    }

    if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
      throw new Error(`Cannot cancel a booking that is already ${booking.status.toLowerCase()}.`);
    }

    await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: { status: "CANCELLED" },
      }),
      prisma.assetHistory.create({
        data: {
          assetId: booking.assetId,
          action: "BOOKING_CANCELLED",
          details: `Booking for ${booking.user.name} cancelled by ${actor.name}.`,
          changedBy: actor.name || actor.email,
        },
      }),
    ]);

    redirectWithToast(`Booking for asset ${booking.asset.assetTag} cancelled.`);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest: string }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Unable to cancel booking.";
    redirectWithToast(message, "error");
  }
}

export async function triggerRemindersAction() {
  const actor = await requireAuth();

  try {
    // Find bookings that need reminders and haven't been sent
    const pendingReminders = await prisma.booking.findMany({
      where: {
        needReminder: true,
        reminderSent: false,
        status: { in: ["UPCOMING", "ONGOING"] },
      },
      include: { asset: true, user: true },
    });

    if (pendingReminders.length === 0) {
      redirectWithToast("No pending reminders to dispatch.", "success");
      return;
    }

    const updates = pendingReminders.map((booking) =>
      prisma.booking.update({
        where: { id: booking.id },
        data: { reminderSent: true },
      })
    );

    const historyLogs = pendingReminders.map((booking) =>
      prisma.assetHistory.create({
        data: {
          assetId: booking.assetId,
          action: "REMINDER_SENT",
          details: `Simulated email notification dispatched to ${booking.user.name} (${booking.user.email}) for resource booking.`,
          changedBy: actor.name || actor.email,
        },
      })
    );

    await prisma.$transaction([...updates, ...historyLogs]);

    redirectWithToast(`Successfully dispatched simulated email alerts for ${pendingReminders.length} bookings.`);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest: string }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Unable to trigger reminders.";
    redirectWithToast(message, "error");
  }
}
