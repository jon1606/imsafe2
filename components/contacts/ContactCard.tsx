import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/status/StatusBadge";
import { timeAgo } from "@/lib/utils";
import type { SafetyStatus } from "@/types";

interface ContactCardProps {
  user: {
    id: string;
    displayName: string | null;
    phone: string;
  };
  latestStatus: {
    status: SafetyStatus;
    note: string | null;
    createdAt: Date;
  } | null;
}

export function ContactCard({ user, latestStatus }: ContactCardProps) {
  const initials = user.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const status = latestStatus?.status ?? "NO_UPDATE";

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white">
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarFallback className="bg-blue-50 text-blue-700 text-xs font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900 truncate">
          {user.displayName ?? user.phone}
        </p>
        {latestStatus?.note && (
          <p className="text-xs text-gray-500 truncate">{latestStatus.note}</p>
        )}
        {latestStatus && (
          <p className="text-[11px] text-gray-400">{timeAgo(latestStatus.createdAt)}</p>
        )}
      </div>
      <StatusBadge status={status} size="sm" />
    </div>
  );
}
