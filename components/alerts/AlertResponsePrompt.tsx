"use client";

import { useState, useTransition } from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { respondToAlert } from "@/actions/alerts";
import type { SafetyStatus } from "@/types";

interface AlertResponsePromptProps {
  alertId: string;
  existingResponse?: SafetyStatus | null;
}

export function AlertResponsePrompt({
  alertId,
  existingResponse,
}: AlertResponsePromptProps) {
  const [isPending, startTransition] = useTransition();
  const [responded, setResponded] = useState(!!existingResponse);
  const [responseStatus, setResponseStatus] = useState<SafetyStatus | null>(
    existingResponse ?? null
  );
  const [note, setNote] = useState("");

  function respond(status: SafetyStatus) {
    startTransition(async () => {
      await respondToAlert(alertId, status, note || undefined);
      setResponded(true);
      setResponseStatus(status);
    });
  }

  if (responded && responseStatus) {
    return (
      <div
        className={`rounded-xl p-4 text-center ${
          responseStatus === "SAFE"
            ? "bg-safe-light border border-safe/30"
            : "bg-danger-light border border-danger/30"
        }`}
      >
        <p
          className={`font-semibold ${
            responseStatus === "SAFE" ? "text-safe" : "text-danger"
          }`}
        >
          {responseStatus === "SAFE"
            ? "✓ You marked yourself safe"
            : "! You requested help"}
        </p>
        <button
          onClick={() => setResponded(false)}
          className="text-xs text-gray-500 underline mt-1"
        >
          Change response
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-danger bg-danger-light p-4 space-y-3">
      <p className="font-semibold text-gray-900 text-center text-sm">
        Are you safe? Respond now
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="safe"
          size="xl"
          className="gap-2"
          disabled={isPending}
          onClick={() => respond("SAFE")}
        >
          <CheckCircle className="h-5 w-5" />
          I'm Safe
        </Button>
        <Button
          variant="danger"
          size="xl"
          className="gap-2"
          disabled={isPending}
          onClick={() => respond("NEED_HELP")}
        >
          <AlertTriangle className="h-5 w-5" />
          Need Help
        </Button>
      </div>

      <Textarea
        placeholder="Optional note…"
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 280))}
        rows={2}
        className="text-sm resize-none"
      />
    </div>
  );
}
