import { AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";
import type { AlertEvent } from "@/types";

interface AlertCardProps {
  alert: AlertEvent & { group?: { name: string } | null };
  compact?: boolean;
}

export function AlertCard({ alert, compact = false }: AlertCardProps) {
  const isActive = alert.state === "ACTIVE";

  return (
    <Card
      className={`border-2 ${
        isActive ? "border-danger bg-danger-light" : "border-gray-200 bg-gray-50"
      }`}
    >
      <CardContent className={compact ? "py-3 px-4" : "py-4 px-4"}>
        <div className="flex items-start gap-3">
          <div
            className={`rounded-full p-2 flex-shrink-0 ${
              isActive ? "bg-danger text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            <AlertTriangle className={compact ? "h-4 w-4" : "h-5 w-5"} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className={`font-bold text-gray-900 ${
                  compact ? "text-sm" : "text-base"
                }`}
              >
                {alert.title}
              </p>
              {isActive && (
                <Badge variant="danger" className="text-xs animate-pulse">
                  Active
                </Badge>
              )}
              {alert.state === "RESOLVED" && (
                <Badge variant="secondary" className="text-xs">
                  Resolved
                </Badge>
              )}
            </div>
            {alert.description && !compact && (
              <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeAgo(alert.createdAt)}
              </span>
              {alert.group && (
                <span className="text-xs text-gray-500">
                  · {alert.group.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
