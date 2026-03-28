"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/helpers";
import { ingestAlert, recordAlertResponse, resolveAlert } from "@/lib/alerts/processor";
import type { ActionResult, SafetyStatus } from "@/types";

/**
 * Mock alert trigger for dev/admin use.
 * TODO: Replace with real external provider webhook via /api/alerts/ingest
 */
export async function triggerMockAlert(
  groupId?: string
): Promise<ActionResult<{ alertId: string }>> {
  await requireAuth(); // any logged-in user can trigger in dev

  const alert = await ingestAlert({
    title: "Mock Emergency Alert",
    description: "This is a test alert. Are you safe?",
    sourceType: "MANUAL",
    groupId,
    expiresInMinutes: 60,
  });

  revalidatePath("/alerts");
  revalidatePath("/dashboard");
  return { success: true, data: { alertId: alert.id } };
}

export async function respondToAlert(
  alertId: string,
  status: SafetyStatus,
  note?: string
): Promise<ActionResult> {
  const { userId } = await requireAuth();

  await recordAlertResponse(alertId, userId, status, note);

  revalidatePath("/alerts");
  revalidatePath(`/alerts/${alertId}`);
  revalidatePath("/dashboard");

  return { success: true, data: undefined };
}

export async function resolveAlertAction(alertId: string): Promise<ActionResult> {
  await requireAuth();
  await resolveAlert(alertId);
  revalidatePath("/alerts");
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}
