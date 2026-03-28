"use client";

import { useState, useTransition } from "react";
import { CheckCircle, AlertTriangle, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateMyStatus } from "@/actions/status";
import type { SafetyStatus } from "@/types";

interface StatusActionBarProps {
  groupId?: string | null;
  currentStatus?: SafetyStatus | null;
  onSuccess?: () => void;
}

export function StatusActionBar({ groupId, currentStatus, onSuccess }: StatusActionBarProps) {
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [selected, setSelected] = useState<SafetyStatus | null>(null);

  function submit(status: SafetyStatus) {
    setSelected(status);
    startTransition(async () => {
      await updateMyStatus(status, note || null, groupId);
      setNote("");
      setShowNote(false);
      setSelected(null);
      onSuccess?.();
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
      <p className="text-sm font-medium text-gray-600 text-center">
        Update your status
      </p>

      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="safe"
          size="lg"
          className="flex-col gap-1 h-auto py-3"
          disabled={isPending}
          onClick={() => submit("SAFE")}
        >
          <CheckCircle className="h-5 w-5" />
          <span className="text-xs">I'm Safe</span>
        </Button>

        <Button
          variant="danger"
          size="lg"
          className="flex-col gap-1 h-auto py-3"
          disabled={isPending}
          onClick={() => submit("NEED_HELP")}
        >
          <AlertTriangle className="h-5 w-5" />
          <span className="text-xs">Need Help</span>
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="flex-col gap-1 h-auto py-3 text-gray-500"
          disabled={isPending}
          onClick={() => submit("NO_UPDATE")}
        >
          <MinusCircle className="h-5 w-5" />
          <span className="text-xs">No Update</span>
        </Button>
      </div>

      <button
        type="button"
        onClick={() => setShowNote((v) => !v)}
        className="text-xs text-blue-600 hover:underline w-full text-center"
      >
        {showNote ? "Hide note" : "+ Add a short note"}
      </button>

      {showNote && (
        <Textarea
          placeholder="Optional message (max 280 chars)"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 280))}
          rows={2}
          className="text-sm resize-none"
        />
      )}

      {isPending && (
        <p className="text-xs text-center text-muted-foreground animate-pulse">
          Updating…
        </p>
      )}
    </div>
  );
}
