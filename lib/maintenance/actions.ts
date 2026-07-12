"use server";

import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

function value(formData: FormData, key: string) {
  const formValue = formData.get(key);
  return typeof formValue === "string" ? formValue : "";
}

function redirectWithToast(message: string, type: "success" | "error" = "success") {
  const params = new URLSearchParams({
    toast: message,
    toastType: type,
  });
  redirect(`/maintenance?${params.toString()}`);
}

export async function requestMaintenanceAction(formData: FormData) {
  const actor = await requireAuth();

  try {
    const assetId = value(formData, "assetId");
    const description = value(formData, "description");

    if (!assetId || !description) {
      throw new Error("Asset selection and problem description are required.");
    }

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { assetTag: true, name: true },
    });

    if (!asset) {
      throw new Error("Asset not found.");
    }

    await prisma.$transaction([
      prisma.maintenanceRecord.create({
        data: {
          assetId,
          description,
          status: "PENDING",
        },
      }),
      prisma.assetHistory.create({
        data: {
          assetId,
          action: "MAINTENANCE_REQUESTED",
          details: `Maintenance requested: "${description}". Requested by ${actor.name}.`,
          changedBy: actor.name || actor.email,
        },
      }),
    ]);

    redirectWithToast(`Maintenance ticket registered for asset ${asset.assetTag}.`);
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
    const message = error instanceof Error ? error.message : "Unable to request maintenance.";
    redirectWithToast(message, "error");
  }
}

export async function approveMaintenanceAction(formData: FormData) {
  const actor = await requireAuth();

  try {
    const id = value(formData, "id");
    if (!id) {
      throw new Error("Ticket ID is required.");
    }

    const ticket = await prisma.maintenanceRecord.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!ticket || ticket.status !== "PENDING") {
      throw new Error("Pending maintenance record not found.");
    }

    await prisma.$transaction([
      prisma.maintenanceRecord.update({
        where: { id },
        data: { status: "APPROVED" },
      }),
      // Set asset status to MAINTENANCE
      prisma.asset.update({
        where: { id: ticket.assetId },
        data: { status: "MAINTENANCE" },
      }),
      prisma.assetHistory.create({
        data: {
          assetId: ticket.assetId,
          action: "MAINTENANCE_APPROVED",
          details: `Maintenance request approved by ${actor.name}. Asset status changed to MAINTENANCE.`,
          changedBy: actor.name || actor.email,
        },
      }),
    ]);

    redirectWithToast(`Maintenance approved for asset ${ticket.asset.assetTag}.`);
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
    const message = error instanceof Error ? error.message : "Unable to approve maintenance.";
    redirectWithToast(message, "error");
  }
}

export async function assignTechnicianAction(formData: FormData) {
  const actor = await requireAuth();

  try {
    const id = value(formData, "id");
    const technicianId = value(formData, "technicianId");

    if (!id || !technicianId) {
      throw new Error("Ticket ID and technician selection are required.");
    }

    const ticket = await prisma.maintenanceRecord.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!ticket || (ticket.status !== "APPROVED" && ticket.status !== "PENDING")) {
      throw new Error("Valid ticket in Pending or Approved status not found.");
    }

    const technician = await prisma.user.findUnique({
      where: { id: technicianId },
      select: { name: true },
    });

    if (!technician) {
      throw new Error("Technician user not found.");
    }

    await prisma.$transaction([
      prisma.maintenanceRecord.update({
        where: { id },
        data: {
          status: "TECHNICIAN_ASSIGNED",
          technicianId,
        },
      }),
      prisma.asset.update({
        where: { id: ticket.assetId },
        data: { status: "MAINTENANCE" },
      }),
      prisma.assetHistory.create({
        data: {
          assetId: ticket.assetId,
          action: "MAINTENANCE_ASSIGNED",
          details: `Technician ${technician.name} assigned by ${actor.name}.`,
          changedBy: actor.name || actor.email,
        },
      }),
    ]);

    redirectWithToast(`Technician ${technician.name} assigned successfully.`);
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
    const message = error instanceof Error ? error.message : "Unable to assign technician.";
    redirectWithToast(message, "error");
  }
}

export async function startMaintenanceAction(formData: FormData) {
  const actor = await requireAuth();

  try {
    const id = value(formData, "id");
    if (!id) {
      throw new Error("Ticket ID is required.");
    }

    const ticket = await prisma.maintenanceRecord.findUnique({
      where: { id },
      include: { asset: true, technician: true },
    });

    if (!ticket || ticket.status !== "TECHNICIAN_ASSIGNED") {
      throw new Error("Ticket is not assigned or already in progress.");
    }

    const techName = ticket.technician?.name || "assigned technician";

    await prisma.$transaction([
      prisma.maintenanceRecord.update({
        where: { id },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
      }),
      prisma.asset.update({
        where: { id: ticket.assetId },
        data: { status: "MAINTENANCE" },
      }),
      prisma.assetHistory.create({
        data: {
          assetId: ticket.assetId,
          action: "MAINTENANCE_STARTED",
          details: `Repair started by ${techName}. Status: In Progress.`,
          changedBy: actor.name || actor.email,
        },
      }),
    ]);

    redirectWithToast(`Maintenance work started.`);
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
    const message = error instanceof Error ? error.message : "Unable to start maintenance.";
    redirectWithToast(message, "error");
  }
}

export async function resolveMaintenanceAction(formData: FormData) {
  const actor = await requireAuth();

  try {
    const id = value(formData, "id");
    const costStr = value(formData, "cost");
    const notes = value(formData, "notes");

    if (!id) {
      throw new Error("Ticket ID is required.");
    }

    const cost = costStr === "" ? null : parseFloat(costStr);
    if (cost !== null && (isNaN(cost) || cost < 0)) {
      throw new Error("Cost must be a valid positive number.");
    }

    const ticket = await prisma.maintenanceRecord.findUnique({
      where: { id },
      include: { asset: true, technician: true },
    });

    if (!ticket || ticket.status !== "IN_PROGRESS") {
      throw new Error("Ticket is not currently in progress.");
    }

    const techName = ticket.technician?.name || "technician";

    await prisma.$transaction([
      prisma.maintenanceRecord.update({
        where: { id },
        data: {
          status: "RESOLVED",
          completedAt: new Date(),
          cost,
          notes: notes === "" ? null : notes,
        },
      }),
      // Set asset status to AVAILABLE
      prisma.asset.update({
        where: { id: ticket.assetId },
        data: { status: "AVAILABLE" },
      }),
      prisma.assetHistory.create({
        data: {
          assetId: ticket.assetId,
          action: "MAINTENANCE_RESOLVED",
          details: `Repair completed by ${techName}. Notes: "${notes || "None"}". Cost: ${
            cost !== null ? `$${cost.toFixed(2)}` : "None"
          }. Asset status reverted to AVAILABLE.`,
          changedBy: actor.name || actor.email,
        },
      }),
    ]);

    redirectWithToast(`Maintenance ticket resolved. Asset ${ticket.asset.assetTag} is available.`);
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
    const message = error instanceof Error ? error.message : "Unable to resolve maintenance.";
    redirectWithToast(message, "error");
  }
}
