import { Pencil, Plus } from "lucide-react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { roleLabels } from "@/lib/auth/permissions";
import {
  createEmployeeAction,
  updateEmployeeAction,
} from "@/lib/organization/actions";

type DepartmentOption = {
  id: string;
  name: string;
  code: string;
  status: string;
};

type EmployeeFormDialogProps = {
  mode: "create" | "edit";
  canManageRoles: boolean;
  employee?: {
    id: string;
    name: string;
    email: string;
    departmentId: string | null;
    role: keyof typeof roleLabels;
    status: string;
  };
  departments: DepartmentOption[];
};

const roleOptions = [
  "ADMIN",
  "ASSET_MANAGER",
  "DEPARTMENT_HEAD",
  "EMPLOYEE",
] as const;

export function EmployeeFormDialog({
  mode,
  canManageRoles,
  employee,
  departments,
}: EmployeeFormDialogProps) {
  const isEdit = mode === "edit";
  const role = employee?.role ?? "EMPLOYEE";

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant={isEdit ? "outline" : "default"} size={isEdit ? "sm" : "default"} />
        }
      >
        {isEdit ? <Pencil /> : <Plus />}
        {isEdit ? "Edit" : "New Employee"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit employee" : "New employee"}</DialogTitle>
          <DialogDescription>
            Manage employee profile, department assignment, role, and account status.
          </DialogDescription>
        </DialogHeader>
        <form action={isEdit ? updateEmployeeAction : createEmployeeAction} className="space-y-4">
          {employee ? <input type="hidden" name="id" value={employee.id} /> : null}
          {!canManageRoles ? <input type="hidden" name="role" value={role} /> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`employee-name-${employee?.id ?? "new"}`}>
                Name
              </label>
              <Input
                id={`employee-name-${employee?.id ?? "new"}`}
                name="name"
                defaultValue={employee?.name}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`employee-email-${employee?.id ?? "new"}`}>
                Email
              </label>
              <Input
                id={`employee-email-${employee?.id ?? "new"}`}
                name="email"
                type="email"
                defaultValue={employee?.email}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`employee-department-${employee?.id ?? "new"}`}>
                Department
              </label>
              <Select
                id={`employee-department-${employee?.id ?? "new"}`}
                name="departmentId"
                defaultValue={employee?.departmentId ?? ""}
              >
                <option value="">Unassigned</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name} ({department.code})
                    {department.status === "INACTIVE" ? " - inactive" : ""}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`employee-role-${employee?.id ?? "new"}`}>
                Role
              </label>
              {canManageRoles ? (
                <Select
                  id={`employee-role-${employee?.id ?? "new"}`}
                  name="role"
                  defaultValue={role}
                >
                  {roleOptions.map((option) => (
                    <option key={option} value={option}>
                      {roleLabels[option]}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input value={roleLabels[role]} disabled />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`employee-status-${employee?.id ?? "new"}`}>
              Status
            </label>
            <Select
              id={`employee-status-${employee?.id ?? "new"}`}
              name="status"
              defaultValue={employee?.status ?? "ACTIVE"}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </div>
          <DialogFooter>
            <SubmitButton pendingText="Saving employee">
              {isEdit ? "Save Employee" : "Create Employee"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
