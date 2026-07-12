import type { ReactNode } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationControls } from "@/components/organization/pagination-controls";
import type { LucideIcon } from "lucide-react";

type OrganizationDataTableProps = {
  columns: string[];
  rows: ReactNode;
  isEmpty: boolean;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  tab: string;
  query: string;
  page: number;
  totalPages: number;
};

export function OrganizationDataTable({
  columns,
  rows,
  isEmpty,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  tab,
  query,
  page,
  totalPages,
}: OrganizationDataTableProps) {
  return (
    <Card className="rounded-lg py-0">
      {isEmpty ? (
        <div className="p-4">
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{rows}</TableBody>
        </Table>
      )}
      <PaginationControls
        tab={tab}
        query={query}
        page={page}
        totalPages={totalPages}
      />
    </Card>
  );
}

export { TableCell, TableRow };
