import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type PaginationControlsProps = {
  tab: string;
  query: string;
  page: number;
  totalPages: number;
};

function pageHref(tab: string, query: string, page: number) {
  const params = new URLSearchParams({ tab, page: String(page) });

  if (query) {
    params.set("q", query);
  }

  return `/organization?${params.toString()}`;
}

export function PaginationControls({
  tab,
  query,
  page,
  totalPages,
}: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          render={page > 1 ? <Link href={pageHref(tab, query, page - 1)} /> : undefined}
        >
          <ChevronLeft />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          render={
            page < totalPages ? (
              <Link href={pageHref(tab, query, page + 1)} />
            ) : undefined
          }
        >
          Next
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
