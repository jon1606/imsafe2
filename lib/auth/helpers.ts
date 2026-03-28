import { redirect } from "next/navigation";
import { getSessionUser } from "./session";
import { prisma } from "@/lib/db/client";
import type { User } from "@/types";

/**
 * Require an authenticated session. Redirects to /login if not found.
 * Use in Server Components and Server Actions.
 */
export async function requireAuth(): Promise<{ userId: string; user: User }> {
  const session = await getSessionUser();
  if (!session?.userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    redirect("/login");
  }

  return { userId: user.id, user };
}

/**
 * Require group membership (throws if not a member).
 */
export async function requireGroupMember(groupId: string, userId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    include: { group: true },
  });
  if (!membership) {
    throw new Error("Not a member of this group");
  }
  return membership;
}

/**
 * Require group admin role.
 */
export async function requireGroupAdmin(groupId: string, userId: string) {
  const membership = await requireGroupMember(groupId, userId);
  if (membership.role !== "ADMIN") {
    throw new Error("Admin access required");
  }
  return membership;
}
