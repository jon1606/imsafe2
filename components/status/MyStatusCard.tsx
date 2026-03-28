import { CheckCircle, AlertTriangle, MinusCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { timeAgo } from "@/lib/utils";
import type { StatusUpdate, SafetyStatus } from "@/types";
import { STATUS_LABEL } from "@/types";

interface MyStatusCardProps {
  status: StatusUpdate | null;
  displayName: string | null;
}

const ICON_MAP: Record<SafetyStatus, React.ElementType> = {
  SAFE: CheckCircle,
  NEED_HELP: AlertTriangle,
  NO_UPDATE: MinusCircle,
};

const BG_MAP: Record<SafetyStatus, string> = {
  SAFE: "bg-safe-light border-safe/30",
  NEED_HELP: "bg-danger-light border-danger/30",
  NO_UPDATE: "bg-noupdate-light border-slate-200",
};

const TEXT_MAP: Record<SafetyStatus, string> = {
  SAFE: "text-safe",
  NEED_HELP: "text-danger",
  NO_UPDATE: "text-slate-500",
};

export function MyStatusCard({ status, displayName }: MyStatusCardProps) {
  const current = status?.status ?? "NO_UPDATE";
  const Icon = ICON_MAP[current];

  return (
    <Card className={`border-2 ${BG_MAP[current]} shadow-sm`}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-full p-2 ${TEXT_MAP[current]}`}>
            <Icon className="h-8 w-8" strokeWidth={current === "SAFE" ? 2 : 2.5} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              Your status
            </p>
            <p className={`text-xl font-bold ${TEXT_MAP[current]}`}>
              {STATUS_LABEL[current]}
            </p>
            {status?.note && (
              <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{status.note}</p>
            )}
            {status?.createdAt && (
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                {timeAgo(status.createdAt)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
