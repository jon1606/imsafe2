import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/status/StatusBadge";
import { timeAgo } from "@/lib/utils";
import type { SafetyStatus } from "@/types";

interface Member {
  id: string;
  userId: string;
  role: string;
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

interface MemberListProps {
  members: Member[];
  filterStatus?: SafetyStatus | "ALL";
  title?: string;
}

export function MemberList({ members, filterStatus = "ALL", title }: MemberListProps) {
  const filtered =
    filterStatus === "ALL"
      ? members
      : members.filter((m) => (m.latestStatus?.status ?? "NO_UPDATE") === filterStatus);

  if (filtered.length === 0) return null;

  return (
    <div>
      {title && (
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 px-4 py-2">
          {title} ({filtered.length})
        </h3>
      )}
      <ul className="divide-y divide-gray-100 bg-white">
        {filtered.map((member) => {
          const initials = member.user.displayName
            ? member.user.displayName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
            : "?";
          const status = member.latestStatus?.status ?? "NO_UPDATE";

          return (
            <li key={member.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarFallback className="bg-blue-50 text-blue-700 text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {member.user.displayName ?? member.user.phone}
                  </p>
                  {member.role === "ADMIN" && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 rounded px-1 py-0.5 font-medium">
                      Admin
                    </span>
                  )}
                </div>
                {member.latestStatus?.note && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {member.latestStatus.note}
                  </p>
                )}
                {member.latestStatus && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {timeAgo(member.latestStatus.createdAt)}
                  </p>
                )}
              </div>

              <StatusBadge status={status} size="sm" />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
