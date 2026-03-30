"use client";

import { useTransition } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerMockAlert } from "@/actions/alerts";

interface MockAlertButtonProps {
  groupId?: string;
}

export function MockAlertButton({ groupId }: MockAlertButtonProps) {
  const [isPending, startTransition] = useTransition();

  function trigger() {
    startTransition(() => { void triggerMockAlert(groupId); });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-50"
      onClick={trigger}
      disabled={isPending}
    >
      <Zap className="h-4 w-4" />
      {isPending ? "Triggering…" : "Mock Alert"}
    </Button>
  );
}
