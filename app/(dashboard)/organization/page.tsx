import { Building2, FolderTree, Trash2, Users } from "lucide-react";

import { UserRole } from "@/app/generated/prisma/enums";
import { CategoryFormDialog } from "@/components/organization/category-form-dialog";
import { DepartmentFormDialog } from "@/components/organization/department-form-dialog";
import { EmployeeFormDialog } from "@/components/organization/employee-form-dialog";
import {
  OrganizationDataTable,
  TableCell,
  TableRow,
} from "@/components/organization/organization-data-table";
import { OrganizationTabs } from "@/components/organization/organization-tabs";
import { SearchBar } from "@/components/organization/search-bar";
import { StatusBadge } from "@/components/organization/status-badge";
import { ToastFeedback } from "@/components/organization/toast-feedback";
import { roleLabels } from "@/lib/auth/permissions";
import { requireAuth } from "@/lib/auth/session";
import {
  deactivateCategoryAction,
  deactivateDepartmentAction,
  deactivateEmployeeAction,
} from "@/lib/organization/actions";
import { pageCount, pageSize, parsePage, parseSearch } from "@/lib/organization/pagination";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

type OrganizationPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const allowedTabs = ["departments", "categories", "employees"] as const;

function activeTab(value: string | string[] | undefined) {
  const tab = Array.isArray(value) ? value[0] : value;
  return allowedTabs.includes(tab as (typeof allowedTabs)[number])
    ? (tab as (typeof allowedTabs)[number])
    : "departments";
}

export default async function OrganizationPage({
  searchParams,
}: OrganizationPageProps) {
  const user = await requireAuth();
  const params = await searchParams;
  const tab = activeTab(params.tab);
  const query = parseSearch(params.q);
  const page = parsePage(params.page);
  const canManageRoles = user.role === UserRole.ADMIN;

  const [departmentOptions, employeeOptions] = await Promise.all([
    prisma.department.findMany({
      orderBy: [{ status: "asc" }, { name: "asc" }],
      select: { id: true, name: true, code: true, status: true },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  const activeDepartmentOptions = departmentOptions.filter(
    (department) => department.status === "ACTIVE",
  );

  return (
    <div className="space-y-6">
      <ToastFeedback />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organization Setup</h1>
          <p className="mt-2 text-muted-foreground">
            Configure departments, asset categories, and employee directory records.
          </p>
        </div>
      </div>

      <OrganizationTabs activeTab={tab} />

      {tab === "departments" ? (
        <DepartmentsTab
          query={query}
          page={page}
          departments={departmentOptions}
          employees={employeeOptions}
        />
      ) : null}

      {tab === "categories" ? <CategoriesTab query={query} page={page} /> : null}

      {tab === "employees" ? (
        <EmployeesTab
          query={query}
          page={page}
          canManageRoles={canManageRoles}
          departments={activeDepartmentOptions}
        />
      ) : null}
    </div>
  );
}

async function DepartmentsTab({
  query,
  page,
  departments,
  employees,
}: {
  query: string;
  page: number;
  departments: { id: string; name: string; code: string; status: string }[];
  employees: { id: string; name: string; email: string }[];
}) {
  const where = query
    ? {
        OR: [
          { name: { contains: query } },
          { code: { contains: query } },
          { departmentHead: { name: { contains: query } } },
        ],
      }
    : {};
  const [items, total] = await Promise.all([
    prisma.department.findMany({
      where,
      orderBy: [{ status: "asc" }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        parentDepartment: { select: { name: true, code: true } },
        departmentHead: { select: { name: true, email: true } },
        _count: { select: { employees: true } },
      },
    }),
    prisma.department.count({ where }),
  ]);
  const totalPages = pageCount(total);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          tab="departments"
          defaultValue={query}
          placeholder="Search name, code, or head"
        />
        <DepartmentFormDialog
          mode="create"
          departments={departments}
          employees={employees}
        />
      </div>
      <OrganizationDataTable
        columns={["Name", "Code", "Parent", "Department Head", "Employees", "Status"]}
        isEmpty={items.length === 0}
        emptyIcon={Building2}
        emptyTitle="No departments found"
        emptyDescription="Create departments to model your organization structure."
        tab="departments"
        query={query}
        page={Math.min(page, totalPages)}
        totalPages={totalPages}
        rows={items.map((department) => (
          <TableRow key={department.id}>
            <TableCell className="font-medium">{department.name}</TableCell>
            <TableCell>{department.code}</TableCell>
            <TableCell>
              {department.parentDepartment
                ? `${department.parentDepartment.name} (${department.parentDepartment.code})`
                : "None"}
            </TableCell>
            <TableCell>
              {department.departmentHead
                ? `${department.departmentHead.name} (${department.departmentHead.email})`
                : "Unassigned"}
            </TableCell>
            <TableCell>{department._count.employees}</TableCell>
            <TableCell>
              <StatusBadge status={department.status} />
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <DepartmentFormDialog
                  mode="edit"
                  department={department}
                  departments={departments}
                  employees={employees}
                />
                <ConfirmationDialog
                  title="Deactivate department?"
                  description="This keeps the department history but prevents it from being used for new employee assignments."
                  action={deactivateDepartmentAction}
                  hiddenFields={{ id: department.id }}
                  submitLabel="Deactivate"
                  trigger={
                    <Button variant="destructive" size="sm">
                      <Trash2 />
                      Delete
                    </Button>
                  }
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      />
    </section>
  );
}

async function CategoriesTab({ query, page }: { query: string; page: number }) {
  const where = query
    ? {
        OR: [{ name: { contains: query } }, { description: { contains: query } }],
      }
    : {};
  const [items, total] = await Promise.all([
    prisma.assetCategory.findMany({
      where,
      orderBy: [{ status: "asc" }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { assets: true } } },
    }),
    prisma.assetCategory.count({ where }),
  ]);
  const totalPages = pageCount(total);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          tab="categories"
          defaultValue={query}
          placeholder="Search name or description"
        />
        <CategoryFormDialog mode="create" />
      </div>
      <OrganizationDataTable
        columns={["Name", "Description", "Assets", "Status"]}
        isEmpty={items.length === 0}
        emptyIcon={FolderTree}
        emptyTitle="No categories found"
        emptyDescription="Create asset categories before registering assets."
        tab="categories"
        query={query}
        page={Math.min(page, totalPages)}
        totalPages={totalPages}
        rows={items.map((category) => (
          <TableRow key={category.id}>
            <TableCell className="font-medium">{category.name}</TableCell>
            <TableCell className="max-w-md whitespace-normal text-muted-foreground">
              {category.description ?? "No description"}
            </TableCell>
            <TableCell>{category._count.assets}</TableCell>
            <TableCell>
              <StatusBadge status={category.status} />
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <CategoryFormDialog mode="edit" category={category} />
                <ConfirmationDialog
                  title="Deactivate category?"
                  description="This keeps the category for historical assets while hiding it from new active workflows."
                  action={deactivateCategoryAction}
                  hiddenFields={{ id: category.id }}
                  submitLabel="Deactivate"
                  trigger={
                    <Button variant="destructive" size="sm">
                      <Trash2 />
                      Delete
                    </Button>
                  }
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      />
    </section>
  );
}

async function EmployeesTab({
  query,
  page,
  canManageRoles,
  departments,
}: {
  query: string;
  page: number;
  canManageRoles: boolean;
  departments: { id: string; name: string; code: string; status: string }[];
}) {
  const where = query
    ? {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
          { department: { name: { contains: query } } },
        ],
      }
    : {};
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ status: "asc" }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { department: { select: { id: true, name: true, code: true, status: true } } },
    }),
    prisma.user.count({ where }),
  ]);
  const totalPages = pageCount(total);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          tab="employees"
          defaultValue={query}
          placeholder="Search name, email, or department"
        />
        <EmployeeFormDialog
          mode="create"
          canManageRoles={canManageRoles}
          departments={departments}
        />
      </div>
      <OrganizationDataTable
        columns={["Name", "Email", "Department", "Role", "Status"]}
        isEmpty={items.length === 0}
        emptyIcon={Users}
        emptyTitle="No employees found"
        emptyDescription="Create employee records or invite users through signup."
        tab="employees"
        query={query}
        page={Math.min(page, totalPages)}
        totalPages={totalPages}
        rows={items.map((employee) => {
          const employeeDepartments = employee.department
            ? [
                ...departments,
                ...(departments.some((department) => department.id === employee.department?.id)
                  ? []
                  : [employee.department]),
              ]
            : departments;

          return (
            <TableRow key={employee.id}>
              <TableCell className="font-medium">{employee.name}</TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell>
                {employee.department
                  ? `${employee.department.name} (${employee.department.code})`
                  : "Unassigned"}
              </TableCell>
              <TableCell>{roleLabels[employee.role]}</TableCell>
              <TableCell>
                <StatusBadge status={employee.status} />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <EmployeeFormDialog
                    mode="edit"
                    employee={employee}
                    canManageRoles={canManageRoles}
                    departments={employeeDepartments}
                  />
                  <ConfirmationDialog
                    title="Deactivate employee?"
                    description="This keeps the employee account and history while removing active access."
                    action={deactivateEmployeeAction}
                    hiddenFields={{ id: employee.id }}
                    submitLabel="Deactivate"
                    trigger={
                      <Button variant="destructive" size="sm">
                        <Trash2 />
                        Delete
                      </Button>
                    }
                  />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      />
    </section>
  );
}
