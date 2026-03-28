"use client";

import { useState, useTransition } from "react";
import { Copy, RefreshCw, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateInviteUrl } from "@/lib/utils";
import { rotateInviteCode } from "@/actions/group";

interface InviteLinkCardProps {
  groupId: string;
  inviteCode: string;
  isAdmin: boolean;
}

export function InviteLinkCard({ groupId, inviteCode, isAdmin }: InviteLinkCardProps) {
  const [code, setCode] = useState(inviteCode);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const url = generateInviteUrl(code);

  function copyLink() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function rotate() {
    startTransition(async () => {
      const result = await rotateInviteCode(groupId);
      if (result.success) {
        setCode(result.data.inviteCode);
      }
    });
  }

  return (
    <Card className="border border-blue-100 bg-blue-50/50">
      <CardContent className="py-3 px-4">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
          Invite link
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-white border border-blue-200 rounded px-2 py-1.5 text-gray-700 truncate">
            {url}
          </code>
          <Button
            size="icon"
            variant="outline"
            onClick={copyLink}
            className="h-8 w-8 flex-shrink-0 border-blue-200"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          {isAdmin && (
            <Button
              size="icon"
              variant="outline"
              onClick={rotate}
              disabled={isPending}
              className="h-8 w-8 flex-shrink-0 border-blue-200"
              title="Rotate invite code"
            >
              <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
