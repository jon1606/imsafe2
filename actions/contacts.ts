"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/helpers";
import { FollowContactSchema } from "@/lib/validation/schemas";
import type { ActionResult } from "@/types";

export async function followContact(phone: string): Promise<ActionResult> {
  const { userId } = await requireAuth();

  const parsed = FollowContactSchema.safeParse({ phone });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const target = await prisma.user.findUnique({ where: { phone } });
  if (!target) {
    return { success: false, error: "No user found with that phone number" };
  }

  if (target.id === userId) {
    return { success: false, error: "You cannot follow yourself" };
  }

  const existing = await prisma.contactFollow.findUnique({
    where: { followerId_followingId: { followerId: userId, followingId: target.id } },
  });

  if (existing) {
    return {
      success: false,
      error: existing.state === "ACCEPTED" ? "Already following" : "Request already sent",
    };
  }

  await prisma.contactFollow.create({
    data: { followerId: userId, followingId: target.id, state: "PENDING" },
  });

  revalidatePath("/contacts");
  return { success: true, data: undefined };
}

export async function acceptFollowRequest(followId: string): Promise<ActionResult> {
  const { userId } = await requireAuth();

  const follow = await prisma.contactFollow.findUnique({ where: { id: followId } });
  if (!follow || follow.followingId !== userId) {
    return { success: false, error: "Follow request not found" };
  }

  await prisma.contactFollow.update({
    where: { id: followId },
    data: { state: "ACCEPTED" },
  });

  // Create the reverse follow too (mutual follow)
  await prisma.contactFollow.upsert({
    where: {
      followerId_followingId: { followerId: userId, followingId: follow.followerId },
    },
    create: { followerId: userId, followingId: follow.followerId, state: "ACCEPTED" },
    update: { state: "ACCEPTED" },
  });

  revalidatePath("/contacts");
  return { success: true, data: undefined };
}

export async function rejectFollowRequest(followId: string): Promise<ActionResult> {
  const { userId } = await requireAuth();

  const follow = await prisma.contactFollow.findUnique({ where: { id: followId } });
  if (!follow || follow.followingId !== userId) {
    return { success: false, error: "Follow request not found" };
  }

  await prisma.contactFollow.delete({ where: { id: followId } });

  revalidatePath("/contacts");
  return { success: true, data: undefined };
}

export async function unfollowContact(targetUserId: string): Promise<ActionResult> {
  const { userId } = await requireAuth();

  await prisma.contactFollow.deleteMany({
    where: { followerId: userId, followingId: targetUserId },
  });

  revalidatePath("/contacts");
  return { success: true, data: undefined };
}
