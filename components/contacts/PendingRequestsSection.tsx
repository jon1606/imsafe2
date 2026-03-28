"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptFollowRequest, rejectFollowRequest } from "@/actions/contacts";
import type { ContactFollow, User } from "@/types";

interface PendingRequestsSectionProps {
  requests: (ContactFollow & { follower: User })[];
}

export function PendingRequestsSection({ requests }: PendingRequestsSectionProps) {
  const [isPending, startTransition] = useTransition();

  function accept(id: string) {
    startTransition(() => acceptFollowRequest(id));
  }

  function reject(id: string) {
    startTransition(() => rejectFollowRequest(id));
  }

  return (
    <div className="mt-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 px-4 py-2 bg-amber-50 border-y border-amber-100">
        Follow requests ({requests.length})
      </p>
      <div className="bg-white divide-y divide-gray-100">
        {requests.map(({ id, follower }) => (
          <div key={id} className="flex items-center gap-3 px-4 py-3">
            <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center text-sm font-semibold text-blue-700">
              {(follower.displayName ?? follower.phone).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {follower.displayName ?? follower.phone}
              </p>
              <p className="text-xs text-gray-400">wants to follow you</p>
            </div>
            <div className="flex gap-1.5">
              <Button
                size="icon"
                className="h-8 w-8 bg-green-500 hover:bg-green-600"
                onClick={() => accept(id)}
                disabled={isPending}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 border-red-200 text-red-500 hover:bg-red-50"
                onClick={() => reject(id)}
                disabled={isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
