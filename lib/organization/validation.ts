import { z } from "zod";
import { CategoryStatus, DepartmentStatus, UserRole, UserStatus } from "@/app/generated/prisma/enums";

const optionalIdSchema = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable();

export const departmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Department name is required.").max(80),
  code: z
    .string()
    .trim()
    .min(2, "Department code is required.")
    .max(20)
    .regex(/^[A-Z0-9-]+$/i, "Use letters, numbers, and hyphens only.")
    .transform((value) => value.toUpperCase()),
  parentDepartmentId: optionalIdSchema,
  departmentHeadId: optionalIdSchema,
  status: z.nativeEnum(DepartmentStatus),
});

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Category name is required.").max(80),
  description: z
    .string()
    .trim()
    .max(300, "Description must be 300 characters or fewer.")
    .transform((value) => (value === "" ? null : value)),
  status: z.nativeEnum(CategoryStatus),
});

export const employeeSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Employee name is required.").max(100),
  email: z.string().trim().email("Enter a valid email.").max(120).toLowerCase(),
  departmentId: optionalIdSchema,
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type EmployeeInput = z.infer<typeof employeeSchema>;
