import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/client";
import { MyStatusCard } from "@/components/status/MyStatusCard";
import { StatusActionBar } from "@/components/status/StatusActionBar";
import { GroupCard } from "@/components/groups/GroupCard";
import { ContactCard } from "@/components/contacts/ContactCard";
import { AlertCard } from "@/components/alerts/AlertCard";
import { PushSubscribeButton } from "@/components/push/PushSubscribeButton";
import { MockAlertButton } from "@/components/alerts/MockAlertButton";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = { title: "Dashboard – SafeCircle" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId, user } = await requireAuth();

  // My latest global status
  const myStatus = await prisma.statusUpdate.findFirst({
    where: { userId, groupId: null },
    orderBy: { createdAt: "desc" },
  });

  // My groups (up to 5)
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          _count: { select: { members: true } },
          members: {
            include: {
              user: {
                include: {
                  statusUpdates: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
    take: 5,
  });

  const groupsWithCounts = memberships.map(({ group }) => {
    const safe = group.members.filter(
      (m) => m.user.statusUpdates[0]?.status === "SAFE"
    ).length;
    const needHelp = group.members.filter(
      (m) => m.user.statusUpdates[0]?.status === "NEED_HELP"
    ).length;
    const noUpdate = group.members.filter(
      (m) =>
        !m.user.statusUpdates[0] ||
        m.user.statusUpdates[0].status === "NO_UPDATE"
    ).length;
    return { ...group, safeCounts: { safe, needHelp, noUpdate } };
  });

  // Followed contacts (up to 5)
  const contacts = await prisma.contactFollow.findMany({
    where: { followerId: userId, state: "ACCEPTED" },
    include: {
      following: {
        include: {
          statusUpdates: {
            orderBy: { createdAt: "desc" },
            take: 1,
            where: { groupId: null },
          },
        },
      },
    },
    take: 5,
    orderBy: { updatedAt: "desc" },
  });

  // Active alerts
  const userGroupIds = memberships.map((m) => m.groupId);
  const activeAlerts = await prisma.alertEvent.findMany({
    where: {
      state: "ACTIVE",
      OR: [{ groupId: null }, { groupId: { in: userGroupIds } }],
    },
    include: {
      group: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <div className="p-4 space-y-5">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Hi, {user.displayName?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-sm text-gray-500">Your safety dashboard</p>
        </div>
        <div className="flex gap-2">
          <PushSubscribeButton />
          {process.env.NODE_ENV !== "production" && <MockAlertButton />}
        </div>
      </div>

      {/* Active alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          {activeAlerts.map((alert) => (
            <a key={alert.id} href={`/alerts/${alert.id}`}>
              <AlertCard alert={alert} compact />
            </a>
          ))}
        </div>
      )}

      {/* My status */}
      <div className="space-y-3">
        <MyStatusCard status={myStatus} displayName={user.displayName} />
        <StatusActionBar groupId={null} currentStatus={myStatus?.status} />
      </div>

      {/* Groups */}
      {groupsWithCounts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Groups</h2>
            <Link
              href="/groups"
              className="text-sm text-blue-600 flex items-center gap-0.5"
            >
              All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {groupsWithCounts.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </div>
      )}

      {/* Contacts */}
      {contacts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Contacts</h2>
            <Link
              href="/contacts"
              className="text-sm text-blue-600 flex items-center gap-0.5"
            >
              All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {contacts.map(({ following: contact }) => (
              <ContactCard
                key={contact.id}
                user={contact}
                latestStatus={contact.statusUpdates[0] ?? null}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
