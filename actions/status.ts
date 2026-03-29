"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/helpers";
import { UpdateStatusSchema } from "@/lib/validation/schemas";
import type { ActionResult, SafetyStatus } from "@/types";

export async function updateMyStatus(
  status: SafetyStatus,
  note?: string | null,
  groupId?: string | null
): Promise<ActionResult> {
  const { userId } = await requireAuth();

  // Validate
  const parsed = UpdateStatusSchema.safeParse({ status, note, groupId });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await prisma.statusUpdate.create({
    data: {
      userId,
      status,
      note: note ?? null,
      groupId: groupId ?? null,
    },
  });

  // Revalidate relevant pages
  revalidatePath("/dashboard");
  if (groupId) {
    revalidatePath(`/groups/${groupId}`);
  }

  return { success: true, data: undefined };
}

/**
 * Get the latest status for a user, optionally scoped to a group.
 * Used in server components.
 */
export async function getLatestStatus(userId: string, groupId?: string | null) {
  return prisma.statusUpdate.findFirst({
    where: { userId, groupId: groupId ?? null },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get the latest status for all members of a group.
 */
export async function getGroupMemberStatuses(groupId: string) {
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: {
      user: true,
    },
  });

  const statuses = await Promise.all(
    members.map(async (m: any) => {
      const latest = await prisma.statusUpdate.findFirst({
        where: { userId: m.userId, groupId },
        orderBy: { createdAt: "desc" },
      });
      return {
        ...m,
        latestStatus: latest,
      };
    })
  );

  return statuses;
}
