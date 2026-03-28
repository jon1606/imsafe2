import { Badge } from "@/components/ui/badge";
import type { SafetyStatus } from "@/types";
import { STATUS_LABEL } from "@/types";

interface StatusBadgeProps {
  status: SafetyStatus;
  size?: "sm" | "default";
}

const VARIANT_MAP: Record<SafetyStatus, "safe" | "danger" | "noupdate"> = {
  SAFE: "safe",
  NEED_HELP: "danger",
  NO_UPDATE: "noupdate",
};

export function StatusBadge({ status, size = "default" }: StatusBadgeProps) {
  return (
    <Badge
      variant={VARIANT_MAP[status]}
      className={size === "sm" ? "text-xs px-2 py-0" : ""}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}
