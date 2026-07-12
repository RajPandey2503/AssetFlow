"use server";

import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { z } from "zod";

function value(formData: FormData, key: string) {
  const formValue = formData.get(key);
  return typeof formValue === "string" ? formValue : "";
}

function redirectWithToast(message: string, type: "success" | "error" = "success") {
  const params = new URLSearchParams({
    toast: message,
    toastType: type,
  });
  redirect(`/allocation?${params.toString()}`);
}

const optionalDateSchema = z
  .string()
  .trim()
  .transform((val) => (val === "" ? null : new Date(val)))
  .nullable();

export async function allocateAssetAction(formData: FormData) {
  const actor = await requireAuth();

  try {
    const assetId = value(formData, "assetId");
    const userId = value(formData, "userId");
    const returnDate = optionalDateSchema.parse(value(formData, "returnDate"));

    if (!assetId || !userId) {
      throw new Error("Asset and Employee are required fields.");
    }

    // Prevent double allocation: check if the asset is currently AVAILABLE
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { status: true, name: true, assetTag: true },
    });

    if (!asset) {
      throw new Error("Asset not found.");
    }

    if (asset.status !== "AVAILABLE") {
      throw new Error(`Asset ${asset.assetTag} cannot be allocated because its current status is ${asset.status}.`);
    }

    const employee = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    if (!employee) {
      throw new Error("Target employee not found.");
    }

    // Allocate asset
    await prisma.$transaction([
      prisma.asset.update({
        where: { id: assetId },
        data: { status: "ALLOCATED" },
      }),
      prisma.assetAllocation.create({
        data: {
          assetId,
          userId,
          returnDate,
          returned: false,
        },
      }),
      prisma.assetHistory.create({
        data: {
          assetId,
          action: "ALLOCATED",
          details: `Allocated to ${employee.name} (${employee.email}) by ${actor.name}. Expected return: ${
            returnDate ? returnDate.toLocaleDateString() : "No return date specified"
          }.`,
          changedBy: actor.name || actor.email,
        },
      }),
    ]);

    redirectWithToast(`Asset ${asset.assetTag} successfully allocated to ${employee.name}.`);
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
    const message = error instanceof Error ? error.message : "Unable to allocate asset.";
    redirectWithToast(message, "error");
  }
}

export async function returnAssetAction(formData: FormData) {
  const actor = await requireAuth();

  try {
    const allocationId = value(formData, "id");
    if (!allocationId) {
      throw new Error("Allocation ID is required.");
    }

    const allocation = await prisma.assetAllocation.findUnique({
      where: { id: allocationId },
      include: { asset: true, user: true },
    });

    if (!allocation || allocation.returned) {
      throw new Error("Active allocation not found.");
    }

    // Complete the allocation and mark asset AVAILABLE
    await prisma.$transaction([
      prisma.assetAllocation.update({
        where: { id: allocationId },
        data: {
          returned: true,
          returnedAt: new Date(),
        },
      }),
      prisma.asset.update({
        where: { id: allocation.assetId },
        data: { status: "AVAILABLE" },
      }),
      prisma.assetHistory.create({
        data: {
          assetId: allocation.assetId,
          action: "RETURNED",
          details: `Returned by ${allocation.user.name}. Return processed by ${actor.name}.`,
          changedBy: actor.name || actor.email,
        },
      }),
    ]);

    redirectWithToast(`Asset ${allocation.asset.assetTag} returned successfully.`);
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
    const message = error instanceof Error ? error.message : "Unable to process return.";
    redirectWithToast(message, "error");
  }
}

export async function createTransferRequestAction(formData: FormData) {
  const actor = await requireAuth();

  try {
    const assetId = value(formData, "assetId");
    const toUserId = value(formData, "toUserId");

    if (!assetId || !toUserId) {
      throw new Error("Asset and target employee are required.");
    }

    // Verify there is an active allocation
    const activeAllocation = await prisma.assetAllocation.findFirst({
      where: { assetId, returned: false },
      include: { user: true, asset: true },
    });

    if (!activeAllocation) {
      throw new Error("Asset must be currently allocated to be transferred.");
    }

    if (activeAllocation.userId === toUserId) {
      throw new Error("Asset is already allocated to this employee.");
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { name: true },
    });

    if (!targetUser) {
      throw new Error("Target employee not found.");
    }

    // Create the transfer request in PENDING status
    await prisma.$transaction([
      prisma.transferRequest.create({
        data: {
          assetId,
          fromUserId: activeAllocation.userId,
          toUserId,
          status: "PENDING",
          requestedById: actor.id,
        },
      }),
      prisma.assetHistory.create({
        data: {
          assetId,
          action: "TRANSFER_REQUESTED",
          details: `Transfer request initiated from ${activeAllocation.user.name} to ${targetUser.name} by ${actor.name}.`,
          changedBy: actor.name || actor.email,
        },
      }),
    ]);

    redirectWithToast(`Transfer request created for asset ${activeAllocation.asset.assetTag}.`);
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
    const message = error instanceof Error ? error.message : "Unable to request transfer.";
    redirectWithToast(message, "error");
  }
}

export async function processTransferRequestAction(formData: FormData) {
  const actor = await requireAuth();

  try {
    const requestId = value(formData, "id");
    const approve = value(formData, "approve") === "true";

    if (!requestId) {
      throw new Error("Request ID is required.");
    }

    const request = await prisma.transferRequest.findUnique({
      where: { id: requestId },
      include: {
        asset: true,
        fromUser: true,
        toUser: true,
      },
    });

    if (!request || request.status !== "PENDING") {
      throw new Error("Pending transfer request not found.");
    }

    if (approve) {
      // Find current active allocation
      const activeAllocation = await prisma.assetAllocation.findFirst({
        where: { assetId: request.assetId, returned: false },
      });

      const transactions = [
        // Update request status
        prisma.transferRequest.update({
          where: { id: requestId },
          data: { status: "APPROVED" },
        }),
        // Create new allocation
        prisma.assetAllocation.create({
          data: {
            assetId: request.assetId,
            userId: request.toUserId,
            returned: false,
          },
        }),
        // Log history
        prisma.assetHistory.create({
          data: {
            assetId: request.assetId,
            action: "TRANSFERRED",
            details: `Transfer approved by ${actor.name}. Reassigned from ${request.fromUser.name} to ${request.toUser.name}.`,
            changedBy: actor.name || actor.email,
          },
        }),
      ];

      // End active allocation if exists
      if (activeAllocation) {
        transactions.push(
          prisma.assetAllocation.update({
            where: { id: activeAllocation.id },
            data: {
              returned: true,
              returnedAt: new Date(),
            },
          })
        );
      }

      await prisma.$transaction(transactions);
      redirectWithToast(`Transfer approved. Asset ${request.asset.assetTag} assigned to ${request.toUser.name}.`);
    } else {
      // Reject transfer request
      await prisma.$transaction([
        prisma.transferRequest.update({
          where: { id: requestId },
          data: { status: "REJECTED" },
        }),
        prisma.assetHistory.create({
          data: {
            assetId: request.assetId,
            action: "TRANSFER_REJECTED",
            details: `Transfer request to ${request.toUser.name} rejected by ${actor.name}.`,
            changedBy: actor.name || actor.email,
          },
        }),
      ]);
      redirectWithToast(`Transfer request rejected.`);
    }
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
    const message = error instanceof Error ? error.message : "Unable to process transfer request.";
    redirectWithToast(message, "error");
  }
}
