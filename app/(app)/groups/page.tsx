import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/client";
import { GroupCard } from "@/components/groups/GroupCard";
import { CreateGroupDialog } from "@/components/groups/CreateGroupDialog";

export const metadata = { title: "Groups – SafeCircle" };

export default async function GroupsPage() {
  const { userId } = await requireAuth();

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
  });

  const groupsWithCounts = memberships.map(({ group }: any) => {
    const members = group.members;
    const safe = members.filter(
      (m: any) => m.user.statusUpdates[0]?.status === "SAFE"
    ).length;
    const needHelp = members.filter(
      (m: any) => m.user.statusUpdates[0]?.status === "NEED_HELP"
    ).length;
    const noUpdate = members.filter(
      (m: any) => !m.user.statusUpdates[0] || m.user.statusUpdates[0].status === "NO_UPDATE"
    ).length;

    return {
      ...group,
      safeCounts: { safe, needHelp, noUpdate },
    };
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Groups</h1>
          <p className="text-sm text-gray-500">{groupsWithCounts.length} group{groupsWithCounts.length !== 1 ? "s" : ""}</p>
        </div>
        <CreateGroupDialog />
      </div>

      {groupsWithCounts.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="text-5xl">👥</div>
          <p className="text-gray-700 font-medium">No groups yet</p>
          <p className="text-sm text-gray-500">
            Create a group or join one via an invite link
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {groupsWithCounts.map((group: any) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
