/**
 * Alert Processor
 *
 * Central place for ingesting alert events from any source.
 * TODO: Plug in external providers (FEMA IPAWS, PagerDuty, etc.)
 * by adding a new provider adapter that calls `ingestAlert`.
 */

import { prisma } from "@/lib/db/client";
import { sendPushToGroup, sendPushToAllUsers } from "@/lib/push/webpush";
import type { AlertEvent } from "@/types";

export interface IngestAlertInput {
  title: string;
  description?: string;
  sourceType?: string;
  sourceRef?: string;
  groupId?: string;
  expiresInMinutes?: number;
}

export async function ingestAlert(input: IngestAlertInput): Promise<AlertEvent> {
  const expiresAt = input.expiresInMinutes
    ? new Date(Date.now() + input.expiresInMinutes * 60 * 1000)
    : undefined;

  const alert = await prisma.alertEvent.create({
    data: {
      title: input.title,
      description: input.description,
      sourceType: input.sourceType ?? "MANUAL",
      sourceRef: input.sourceRef,
      groupId: input.groupId,
      state: "ACTIVE",
      expiresAt,
    },
  });

  // Dispatch push notifications asynchronously (fire-and-forget for MVP)
  const payload = JSON.stringify({
    title: `⚠️ ${alert.title}`,
    body: alert.description ?? "Are you safe? Tap to respond.",
    data: { alertId: alert.id, url: `/alerts/${alert.id}` },
  });

  if (input.groupId) {
    sendPushToGroup(input.groupId, payload).catch(console.error);
  } else {
    sendPushToAllUsers(payload).catch(console.error);
  }

  return alert;
}

export async function resolveAlert(alertId: string): Promise<void> {
  await prisma.alertEvent.update({
    where: { id: alertId },
    data: { state: "RESOLVED" },
  });
}

export async function recordAlertResponse(
  alertId: string,
  userId: string,
  status: "SAFE" | "NEED_HELP" | "NO_UPDATE",
  note?: string
) {
  return prisma.alertResponse.upsert({
    where: { alertEventId_userId: { alertEventId: alertId, userId } },
    create: { alertEventId: alertId, userId, status, note },
    update: { status, note, respondedAt: new Date() },
  });
}
