"use server";

import { Prisma } from "@/app/generated/prisma/client";

import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { assetSchema } from "@/lib/assets/validation";
import { redirect } from "next/navigation";

function value(formData: FormData, key: string) {
  const formValue = formData.get(key);
  return typeof formValue === "string" ? formValue : "";
}

function parseId(formData: FormData) {
  return value(formData, "id").trim();
}

function actionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return "An asset with this unique value (e.g., Tag or Serial Number) already exists.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unable to save changes.";
}

function isRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

function redirectWithToast(message: string, type: "success" | "error" = "success") {
  const params = new URLSearchParams({
    toast: message,
    toastType: type,
  });
  redirect(`/assets?${params.toString()}`);
}

export async function createAssetAction(formData: FormData) {
  const actor = await requireAuth();

  try {
    const input = assetSchema.parse({
      name: value(formData, "name"),
      categoryId: value(formData, "categoryId"),
      serialNumber: value(formData, "serialNumber"),
      acquisitionDate: value(formData, "acquisitionDate"),
      acquisitionCost: value(formData, "acquisitionCost"),
      condition: value(formData, "condition"),
      location: value(formData, "location"),
      sharedResource: value(formData, "sharedResource"),
      status: value(formData, "status") || "AVAILABLE",
      imagePath: value(formData, "imagePath"),
      documentPath: value(formData, "documentPath"),
    });

    // Generate sequential asset tag (AF-XXXX)
    const lastAsset = await prisma.asset.findFirst({
      orderBy: { assetTag: "desc" },
      select: { assetTag: true },
    });

    let nextNumber = 1;
    if (lastAsset) {
      const match = lastAsset.assetTag.match(/^AF-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const assetTag = `AF-${String(nextNumber).padStart(4, "0")}`;

    const asset = await prisma.asset.create({
      data: {
        assetTag,
        name: input.name,
        categoryId: input.categoryId,
        serialNumber: input.serialNumber,
        acquisitionDate: input.acquisitionDate,
        acquisitionCost: input.acquisitionCost,
        condition: input.condition,
        location: input.location,
        sharedResource: input.sharedResource,
        status: input.status,
        imagePath: input.imagePath,
        documentPath: input.documentPath,
      },
    });

    await prisma.assetHistory.create({
      data: {
        assetId: asset.id,
        action: "REGISTERED",
        details: `Registered by ${actor.name}. Status: ${asset.status}, Condition: ${asset.condition}.`,
        changedBy: actor.name || actor.email,
      },
    });

    redirectWithToast(`Asset registered successfully with Tag ${assetTag}.`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    redirectWithToast(actionError(error), "error");
  }
}

export async function updateAssetAction(formData: FormData) {
  const actor = await requireAuth();

  try {
    const id = parseId(formData);
    if (!id) {
      throw new Error("Asset ID is required for updating.");
    }

    const input = assetSchema.parse({
      name: value(formData, "name"),
      categoryId: value(formData, "categoryId"),
      serialNumber: value(formData, "serialNumber"),
      acquisitionDate: value(formData, "acquisitionDate"),
      acquisitionCost: value(formData, "acquisitionCost"),
      condition: value(formData, "condition"),
      location: value(formData, "location"),
      sharedResource: value(formData, "sharedResource"),
      status: value(formData, "status"),
      imagePath: value(formData, "imagePath"),
      documentPath: value(formData, "documentPath"),
    });

    const currentAsset = await prisma.asset.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!currentAsset) {
      throw new Error("Asset not found.");
    }

    // Perform validation and prepare audit trail details
    const changes: string[] = [];
    if (currentAsset.name !== input.name) {
      changes.push(`Name changed from "${currentAsset.name}" to "${input.name}"`);
    }
    if (currentAsset.categoryId !== input.categoryId) {
      const newCategory = await prisma.assetCategory.findUnique({
        where: { id: input.categoryId },
        select: { name: true },
      });
      changes.push(`Category changed to "${newCategory?.name || input.categoryId}"`);
    }
    if (currentAsset.serialNumber !== input.serialNumber) {
      changes.push(`Serial Number changed to "${input.serialNumber || "None"}"`);
    }
    if (currentAsset.condition !== input.condition) {
      changes.push(`Condition updated from ${currentAsset.condition} to ${input.condition}`);
    }
    if (currentAsset.status !== input.status) {
      changes.push(`Status updated from ${currentAsset.status} to ${input.status}`);
    }
    if (currentAsset.location !== input.location) {
      changes.push(`Location updated to "${input.location || "Unassigned"}"`);
    }
    if (currentAsset.sharedResource !== input.sharedResource) {
      changes.push(`Shared resource flag changed to ${input.sharedResource}`);
    }
    if (input.imagePath && currentAsset.imagePath !== input.imagePath) {
      changes.push(`New image uploaded: "${input.imagePath}"`);
    }
    if (input.documentPath && currentAsset.documentPath !== input.documentPath) {
      changes.push(`New document uploaded: "${input.documentPath}"`);
    }

    await prisma.asset.update({
      where: { id },
      data: {
        name: input.name,
        categoryId: input.categoryId,
        serialNumber: input.serialNumber,
        acquisitionDate: input.acquisitionDate,
        acquisitionCost: input.acquisitionCost,
        condition: input.condition,
        location: input.location,
        sharedResource: input.sharedResource,
        status: input.status,
        imagePath: input.imagePath,
        documentPath: input.documentPath,
      },
    });

    if (changes.length > 0) {
      await prisma.assetHistory.create({
        data: {
          assetId: id,
          action: "UPDATED",
          details: changes.join(", ") + `. Updated by ${actor.name}.`,
          changedBy: actor.name || actor.email,
        },
      });
    }

    redirectWithToast(`Asset ${currentAsset.assetTag} updated successfully.`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    redirectWithToast(actionError(error), "error");
  }
}

export async function deleteAssetAction(formData: FormData) {
  await requireAuth();

  try {
    const id = parseId(formData);
    if (!id) {
      throw new Error("Asset ID is required for deactivation.");
    }

    const asset = await prisma.asset.findUnique({
      where: { id },
      select: { assetTag: true },
    });

    if (!asset) {
      throw new Error("Asset not found.");
    }

    // Since onDelete: Cascade is configured on the relation, deleting the asset cleans up history.
    await prisma.asset.delete({
      where: { id },
    });

    redirectWithToast(`Asset ${asset.assetTag} deleted successfully.`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    redirectWithToast(actionError(error), "error");
  }
}
