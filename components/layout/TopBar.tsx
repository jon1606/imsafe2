import Link from "next/link";
import { Shield } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { User } from "@/types";

interface TopBarProps {
  user: User;
}

export function TopBar({ user }: TopBarProps) {
  const initials = user.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-blue-600" />
        <span className="font-bold text-gray-900 text-lg">SafeCircle</span>
      </Link>
      <Link href="/profile">
        <Avatar className="h-8 w-8 cursor-pointer">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.displayName ?? "You"} />
          ) : null}
          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </Link>
    </header>
  );
}
