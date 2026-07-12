"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@/app/generated/prisma/client";
import { UserRole } from "@/app/generated/prisma/enums";
import { hashPassword } from "@/lib/auth/password";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  categorySchema,
  departmentSchema,
  employeeSchema,
} from "@/lib/organization/validation";
import { redirectWithToast } from "@/lib/organization/navigation";

function value(formData: FormData, key: string) {
  const formValue = formData.get(key);
  return typeof formValue === "string" ? formValue : "";
}

function parseId(formData: FormData) {
  return value(formData, "id").trim();
}

function actionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return "A record with this unique value already exists.";
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

function randomTemporaryPassword() {
  return `AssetFlow-${randomUUID()}-Reset`;
}

export async function createDepartmentAction(formData: FormData) {
  await requireAuth();

  try {
    const input = departmentSchema.parse({
      name: value(formData, "name"),
      code: value(formData, "code"),
      parentDepartmentId: value(formData, "parentDepartmentId"),
      departmentHeadId: value(formData, "departmentHeadId"),
      status: value(formData, "status"),
    });

    if (input.parentDepartmentId && input.id === input.parentDepartmentId) {
      throw new Error("A department cannot be its own parent.");
    }

    await prisma.department.create({ data: input });
    redirectWithToast("departments", "Department created.");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirectWithToast("departments", actionError(error), "error");
  }
}

export async function updateDepartmentAction(formData: FormData) {
  await requireAuth();

  try {
    const id = parseId(formData);
    const input = departmentSchema.parse({
      id,
      name: value(formData, "name"),
      code: value(formData, "code"),
      parentDepartmentId: value(formData, "parentDepartmentId"),
      departmentHeadId: value(formData, "departmentHeadId"),
      status: value(formData, "status"),
    });

    if (!id) {
      throw new Error("Department id is required.");
    }

    if (input.parentDepartmentId === id) {
      throw new Error("A department cannot be its own parent.");
    }

    await prisma.department.update({
      where: { id },
      data: {
        name: input.name,
        code: input.code,
        parentDepartmentId: input.parentDepartmentId,
        departmentHeadId: input.departmentHeadId,
        status: input.status,
      },
    });

    redirectWithToast("departments", "Department updated.");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirectWithToast("departments", actionError(error), "error");
  }
}

export async function deactivateDepartmentAction(formData: FormData) {
  await requireAuth();

  try {
    const id = parseId(formData);

    if (!id) {
      throw new Error("Department id is required.");
    }

    await prisma.department.update({
      where: { id },
      data: { status: "INACTIVE" },
    });

    redirectWithToast("departments", "Department deactivated.");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirectWithToast("departments", actionError(error), "error");
  }
}

export async function createCategoryAction(formData: FormData) {
  await requireAuth();

  try {
    const input = categorySchema.parse({
      name: value(formData, "name"),
      description: value(formData, "description"),
      status: value(formData, "status"),
    });

    await prisma.assetCategory.create({ data: input });
    redirectWithToast("categories", "Category created.");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirectWithToast("categories", actionError(error), "error");
  }
}

export async function updateCategoryAction(formData: FormData) {
  await requireAuth();

  try {
    const id = parseId(formData);
    const input = categorySchema.parse({
      id,
      name: value(formData, "name"),
      description: value(formData, "description"),
      status: value(formData, "status"),
    });

    if (!id) {
      throw new Error("Category id is required.");
    }

    await prisma.assetCategory.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        status: input.status,
      },
    });

    redirectWithToast("categories", "Category updated.");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirectWithToast("categories", actionError(error), "error");
  }
}

export async function deactivateCategoryAction(formData: FormData) {
  await requireAuth();

  try {
    const id = parseId(formData);

    if (!id) {
      throw new Error("Category id is required.");
    }

    await prisma.assetCategory.update({
      where: { id },
      data: { status: "INACTIVE" },
    });

    redirectWithToast("categories", "Category deactivated.");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirectWithToast("categories", actionError(error), "error");
  }
}

export async function createEmployeeAction(formData: FormData) {
  const actor = await requireAuth();

  try {
    const input = employeeSchema.parse({
      name: value(formData, "name"),
      email: value(formData, "email"),
      departmentId: value(formData, "departmentId"),
      role: value(formData, "role"),
      status: value(formData, "status"),
    });

    if (input.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: input.departmentId },
        select: { status: true },
      });

      if (!department || department.status !== "ACTIVE") {
        throw new Error("Employees can only be assigned to active departments.");
      }
    }

    await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        departmentId: input.departmentId,
        role: actor.role === UserRole.ADMIN ? input.role : UserRole.EMPLOYEE,
        status: input.status,
        password: await hashPassword(randomTemporaryPassword()),
      },
    });

    redirectWithToast("employees", "Employee created.");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirectWithToast("employees", actionError(error), "error");
  }
}

export async function updateEmployeeAction(formData: FormData) {
  const actor = await requireAuth();

  try {
    const id = parseId(formData);
    const input = employeeSchema.parse({
      id,
      name: value(formData, "name"),
      email: value(formData, "email"),
      departmentId: value(formData, "departmentId"),
      role: value(formData, "role"),
      status: value(formData, "status"),
    });

    if (!id) {
      throw new Error("Employee id is required.");
    }

    const existingEmployee = await prisma.user.findUnique({
      where: { id },
      select: { departmentId: true },
    });

    if (!existingEmployee) {
      throw new Error("Employee not found.");
    }

    if (input.departmentId && input.departmentId !== existingEmployee.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: input.departmentId },
        select: { status: true },
      });

      if (!department || department.status !== "ACTIVE") {
        throw new Error("Employees can only be assigned to active departments.");
      }
    }

    await prisma.user.update({
      where: { id },
      data: {
        name: input.name,
        email: input.email,
        departmentId: input.departmentId,
        status: input.status,
        ...(actor.role === UserRole.ADMIN ? { role: input.role } : {}),
      },
    });

    redirectWithToast("employees", "Employee updated.");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirectWithToast("employees", actionError(error), "error");
  }
}

export async function deactivateEmployeeAction(formData: FormData) {
  await requireAuth();

  try {
    const id = parseId(formData);

    if (!id) {
      throw new Error("Employee id is required.");
    }

    await prisma.user.update({
      where: { id },
      data: { status: "INACTIVE" },
    });

    redirectWithToast("employees", "Employee deactivated.");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirectWithToast("employees", actionError(error), "error");
  }
}
