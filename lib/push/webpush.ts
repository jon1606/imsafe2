/**
 * Web Push helpers using the `web-push` library.
 * VAPID keys are set via env vars.
 */

import webpush from "web-push";
import { prisma } from "@/lib/db/client";

// Configure VAPID once at module level
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:admin@${process.env.NEXT_PUBLIC_APP_URL ?? "example.com"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export function getVapidPublicKey(): string {
  return process.env.VAPID_PUBLIC_KEY ?? "";
}

async function sendToSubscription(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string
) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      payload
    );
  } catch (err: unknown) {
    // 410 = subscription expired, remove it
    if (
      err &&
      typeof err === "object" &&
      "statusCode" in err &&
      err.statusCode === 410
    ) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: subscription.endpoint },
      });
    } else {
      console.error("Push send error:", err);
    }
  }
}

export async function sendPushToUser(userId: string, payload: string) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  await Promise.allSettled(subs.map((s) => sendToSubscription(s, payload)));
}

export async function sendPushToGroup(groupId: string, payload: string) {
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });
  await Promise.allSettled(
    members.map((m) => sendPushToUser(m.userId, payload))
  );
}

export async function sendPushToAllUsers(payload: string) {
  const subs = await prisma.pushSubscription.findMany();
  await Promise.allSettled(subs.map((s) => sendToSubscription(s, payload)));
}
