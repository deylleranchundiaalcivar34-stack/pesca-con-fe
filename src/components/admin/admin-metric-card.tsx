import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface AdminMetricCardProps {
  title: string;
  value: string;
  helper: string;
  icon: LucideIcon;
}

export function AdminMetricCard({
  title,
  value,
  helper,
  icon: Icon,
}: AdminMetricCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-black text-dark-blue">{value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
        </div>
        <span className="flex size-11 items-center justify-center rounded-lg bg-secondary text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
    </Card>
  );
}
