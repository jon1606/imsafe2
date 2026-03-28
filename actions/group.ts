"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { requireAuth, requireGroupMember, requireGroupAdmin } from "@/lib/auth/helpers";
import { CreateGroupSchema } from "@/lib/validation/schemas";
import type { ActionResult } from "@/types";

export async function createGroup(formData: FormData): Promise<ActionResult<{ groupId: string }>> {
  const { userId } = await requireAuth();

  const parsed = CreateGroupSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const group = await prisma.group.create({
    data: {
      name: parsed.data.name,
      createdById: userId,
      members: {
        create: { userId, role: "ADMIN" },
      },
    },
  });

  revalidatePath("/groups");
  return { success: true, data: { groupId: group.id } };
}

export async function joinGroupByInviteCode(
  inviteCode: string
): Promise<ActionResult<{ groupId: string }>> {
  const { userId } = await requireAuth();

  const group = await prisma.group.findUnique({ where: { inviteCode } });
  if (!group) {
    return { success: false, error: "Invalid invite code" };
  }

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId } },
  });

  if (existing) {
    return { success: true, data: { groupId: group.id } };
  }

  await prisma.groupMember.create({
    data: { groupId: group.id, userId, role: "MEMBER" },
  });

  revalidatePath("/groups");
  revalidatePath(`/groups/${group.id}`);
  return { success: true, data: { groupId: group.id } };
}

export async function leaveGroup(groupId: string): Promise<ActionResult> {
  const { userId } = await requireAuth();

  const membership = await requireGroupMember(groupId, userId);

  // Prevent last admin from leaving
  if (membership.role === "ADMIN") {
    const adminCount = await prisma.groupMember.count({
      where: { groupId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      return {
        success: false,
        error: "Cannot leave: you are the only admin. Promote another member first.",
      };
    }
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });

  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  return { success: true, data: undefined };
}

export async function removeMember(
  groupId: string,
  targetUserId: string
): Promise<ActionResult> {
  const { userId } = await requireAuth();
  await requireGroupAdmin(groupId, userId);

  if (targetUserId === userId) {
    return { success: false, error: "Use leaveGroup to remove yourself" };
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true, data: undefined };
}

export async function rotateInviteCode(groupId: string): Promise<ActionResult<{ inviteCode: string }>> {
  const { userId } = await requireAuth();
  await requireGroupAdmin(groupId, userId);

  const { randomUUID } = await import("crypto");
  const newCode = randomUUID();

  const group = await prisma.group.update({
    where: { id: groupId },
    data: { inviteCode: newCode },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true, data: { inviteCode: group.inviteCode } };
}
