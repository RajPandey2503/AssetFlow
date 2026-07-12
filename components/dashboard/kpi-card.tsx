import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KPIProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
}

export default function KpiCard({
  title,
  value,
  icon: Icon,
}: KPIProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>

          <h2 className="mt-2 text-3xl font-bold">
            {value}
          </h2>
        </div>

        <Icon className="h-10 w-10 text-blue-600" />
      </CardContent>
    </Card>
  );
}