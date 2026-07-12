"use server";

import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

function value(formData: FormData, key: string) {
  const formValue = formData.get(key);
  return typeof formValue === "string" ? formValue : "";
}

function redirectWithToast(message: string, type: "success" | "error" = "success", tab = "cycles") {
  const params = new URLSearchParams({
    toast: message,
    toastType: type,
    tab,
  });
  redirect(`/reports?${params.toString()}`);
}

export async function createAuditCycleAction(formData: FormData) {
  const actor = await requireAuth();

  try {
    const name = value(formData, "name");
    const dueStr = value(formData, "dueDate");
    const auditorId = value(formData, "auditorId");

    if (!name || !dueStr || !auditorId) {
      throw new Error("Audit name, due date, and auditor assignment are required.");
    }

    const dueDate = new Date(dueStr);
    if (isNaN(dueDate.getTime())) {
      throw new Error("Invalid due date format.");
    }

    // Verify auditor exists
    const auditor = await prisma.user.findUnique({
      where: { id: auditorId },
      select: { name: true },
    });

    if (!auditor) {
      throw new Error("Assigned auditor not found.");
    }

    // Find all assets in database
    const assets = await prisma.asset.findMany({
      select: { id: true, assetTag: true },
    });

    if (assets.length === 0) {
      throw new Error("No assets registered in system to audit.");
    }

    // Create Audit Cycle and Audit Items transactionally
    await prisma.$transaction(async (tx) => {
      const cycle = await tx.auditCycle.create({
        data: {
          name,
          dueDate,
          auditorId,
          createdById: actor.id,
          status: "ACTIVE",
        },
      });

      // Create Audit Item for each asset
      await tx.auditItem.createMany({
        data: assets.map((asset) => ({
          auditCycleId: cycle.id,
          assetId: asset.id,
          verified: false,
          status: "PENDING",
        })),
      });

      // Log history entry on assets
      const historyLogs = assets.map((asset) =>
        tx.assetHistory.create({
          data: {
            assetId: asset.id,
            action: "AUDIT_SCOPED",
            details: `Scoped into Audit Cycle "${name}" assigned to ${auditor.name}.`,
            changedBy: actor.name || actor.email,
          },
        })
      );
      await Promise.all(historyLogs);
    });

    redirectWithToast(`Audit Cycle "${name}" successfully created with ${assets.length} assets scoped.`);
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
    const message = error instanceof Error ? error.message : "Unable to create audit cycle.";
    redirectWithToast(message, "error");
  }
}

export async function verifyAuditItemAction(formData: FormData) {
  const actor = await requireAuth();

  try {
    const itemId = value(formData, "itemId");
    const status = value(formData, "status"); // "VERIFIED", "MISSING", "DAMAGED"
    const notes = value(formData, "notes");

    if (!itemId || !status) {
      throw new Error("Audit item reference and verification status are required.");
    }

    if (status !== "VERIFIED" && status !== "MISSING" && status !== "DAMAGED") {
      throw new Error("Invalid verification status.");
    }

    // Find the audit item and cycle
    const item = await prisma.auditItem.findUnique({
      where: { id: itemId },
      include: {
        asset: true,
        auditCycle: {
          include: { auditor: true },
        },
      },
    });

    if (!item) {
      throw new Error("Audit item not found.");
    }

    if (item.verified) {
      throw new Error("This asset is already verified for this cycle.");
    }

    // Security check: only assigned auditor or admin can verify
    if (item.auditCycle.auditorId !== actor.id && actor.role !== "ADMIN" && actor.role !== "ASSET_MANAGER") {
      throw new Error("Only the assigned auditor or an Administrator can verify this item.");
    }

    const verifyNotes = notes === "" ? null : notes;

    await prisma.$transaction(async (tx) => {
      // 1. Update the Audit Item status
      await tx.auditItem.update({
        where: { id: itemId },
        data: {
          verified: true,
          verifiedAt: new Date(),
          status,
          notes: verifyNotes,
        },
      });

      // 2. Perform state auto-sync and log details
      if (status === "MISSING") {
        // Change asset status to LOST
        await tx.asset.update({
          where: { id: item.assetId },
          data: { status: "LOST" },
        });

        await tx.assetHistory.create({
          data: {
            assetId: item.assetId,
            action: "AUDIT_DISCREPANCY_MISSING",
            details: `Asset marked MISSING by auditor ${actor.name}. Status updated to LOST. Notes: "${verifyNotes || "None"}".`,
            changedBy: actor.name || actor.email,
          },
        });
      } else if (status === "DAMAGED") {
        // Change asset condition to BROKEN
        await tx.asset.update({
          where: { id: item.assetId },
          data: { condition: "BROKEN" },
        });

        await tx.assetHistory.create({
          data: {
            assetId: item.assetId,
            action: "AUDIT_DISCREPANCY_DAMAGED",
            details: `Asset marked DAMAGED by auditor ${actor.name}. Condition changed to BROKEN. Notes: "${verifyNotes || "None"}".`,
            changedBy: actor.name || actor.email,
          },
        });
      } else {
        // Normal verification
        await tx.assetHistory.create({
          data: {
            assetId: item.assetId,
            action: "AUDIT_VERIFIED",
            details: `Asset verified as present by auditor ${actor.name}. Notes: "${verifyNotes || "None"}".`,
            changedBy: actor.name || actor.email,
          },
        });
      }

      // 3. Check if all items in the cycle are now verified. If so, auto-complete the cycle
      const unverifiedItemsCount = await tx.auditItem.count({
        where: {
          auditCycleId: item.auditCycleId,
          verified: false,
        },
      });

      if (unverifiedItemsCount === 0) {
        await tx.auditCycle.update({
          where: { id: item.auditCycleId },
          data: { status: "COMPLETED" },
        });
      }
    });

    redirectWithToast(`Asset ${item.asset.assetTag} successfully verified.`, "success", "cycles");
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
    const message = error instanceof Error ? error.message : "Unable to verify item.";
    redirectWithToast(message, "error", "cycles");
  }
}
