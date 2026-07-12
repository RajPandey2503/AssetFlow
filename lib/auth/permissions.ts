import type { UserRole } from "@/app/generated/prisma/enums";

export const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  ASSET_MANAGER: "Asset Manager",
  DEPARTMENT_HEAD: "Department Head",
  EMPLOYEE: "Employee",
};

export const roleRank: Record<UserRole, number> = {
  EMPLOYEE: 1,
  DEPARTMENT_HEAD: 2,
  ASSET_MANAGER: 3,
  ADMIN: 4,
};

export function hasRole(userRole: UserRole, allowedRoles: UserRole[]) {
  return allowedRoles.includes(userRole);
}

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole) {
  return roleRank[userRole] >= roleRank[requiredRole];
}
