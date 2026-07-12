import { Badge } from "@/components/ui/badge";

type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const isActive = status === "ACTIVE";

  return (
    <Badge variant={isActive ? "secondary" : "outline"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
