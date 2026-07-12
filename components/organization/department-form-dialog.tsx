import { Plus, Pencil } from "lucide-react";

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
import { SubmitButton } from "@/components/auth/submit-button";
import {
  createDepartmentAction,
  updateDepartmentAction,
} from "@/lib/organization/actions";

type DepartmentOption = {
  id: string;
  name: string;
  code: string;
};

type EmployeeOption = {
  id: string;
  name: string;
  email: string;
};

type DepartmentFormDialogProps = {
  mode: "create" | "edit";
  department?: {
    id: string;
    name: string;
    code: string;
    status: string;
    parentDepartmentId: string | null;
    departmentHeadId: string | null;
  };
  departments: DepartmentOption[];
  employees: EmployeeOption[];
};

export function DepartmentFormDialog({
  mode,
  department,
  departments,
  employees,
}: DepartmentFormDialogProps) {
  const isEdit = mode === "edit";

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant={isEdit ? "outline" : "default"} size={isEdit ? "sm" : "default"} />
        }
      >
        {isEdit ? <Pencil /> : <Plus />}
        {isEdit ? "Edit" : "New Department"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit department" : "New department"}</DialogTitle>
          <DialogDescription>
            Manage department hierarchy, code, department head, and active status.
          </DialogDescription>
        </DialogHeader>
        <form action={isEdit ? updateDepartmentAction : createDepartmentAction} className="space-y-4">
          {department ? <input type="hidden" name="id" value={department.id} /> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`department-name-${department?.id ?? "new"}`}>
                Name
              </label>
              <Input
                id={`department-name-${department?.id ?? "new"}`}
                name="name"
                defaultValue={department?.name}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`department-code-${department?.id ?? "new"}`}>
                Code
              </label>
              <Input
                id={`department-code-${department?.id ?? "new"}`}
                name="code"
                defaultValue={department?.code}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`department-parent-${department?.id ?? "new"}`}>
                Parent Department
              </label>
              <Select
                id={`department-parent-${department?.id ?? "new"}`}
                name="parentDepartmentId"
                defaultValue={department?.parentDepartmentId ?? ""}
              >
                <option value="">None</option>
                {departments
                  .filter((option) => option.id !== department?.id)
                  .map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} ({option.code})
                    </option>
                  ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`department-head-${department?.id ?? "new"}`}>
                Department Head
              </label>
              <Select
                id={`department-head-${department?.id ?? "new"}`}
                name="departmentHeadId"
                defaultValue={department?.departmentHeadId ?? ""}
              >
                <option value="">Unassigned</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.email})
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`department-status-${department?.id ?? "new"}`}>
              Status
            </label>
            <Select
              id={`department-status-${department?.id ?? "new"}`}
              name="status"
              defaultValue={department?.status ?? "ACTIVE"}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </div>
          <DialogFooter>
            <SubmitButton pendingText="Saving department">
              {isEdit ? "Save Department" : "Create Department"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
