import { notFound } from "next/navigation";
import { Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/client";
import { getGroupMemberStatuses } from "@/actions/status";
import { StatusActionBar } from "@/components/status/StatusActionBar";
import { MemberList } from "@/components/groups/MemberList";
import { InviteLinkCard } from "@/components/groups/InviteLinkCard";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupDetailPage({ params }: PageProps) {
  const { groupId } = await params;
  const { userId } = await requireAuth();

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { _count: { select: { members: true } } },
  });

  if (!group) notFound();

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!membership) notFound();

  const membersWithStatus = await getGroupMemberStatuses(groupId);

  const safeCount = membersWithStatus.filter(
    (m: any) => m.latestStatus?.status === "SAFE"
  ).length;
  const needHelpCount = membersWithStatus.filter(
    (m: any) => m.latestStatus?.status === "NEED_HELP"
  ).length;
  const noUpdateCount = membersWithStatus.filter(
    (m: any) => !m.latestStatus || m.latestStatus.status === "NO_UPDATE"
  ).length;

  const recentUpdates = await prisma.statusUpdate.findMany({
    where: { groupId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { user: true },
  });

  const isAdmin = membership.role === "ADMIN";

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <Link
          href="/groups"
          className="flex items-center gap-1 text-sm text-blue-600 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Groups
        </Link>

        <div className="flex items-center gap-3">
          <div className="bg-blue-100 rounded-full h-12 w-12 flex items-center justify-center">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{group.name}</h1>
            <p className="text-sm text-gray-500">
              {group._count.members} member{group._count.members !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Status counts */}
        <div className="flex gap-2 mt-4">
          <Badge variant="safe" className="text-sm px-3 py-1">
            ✓ {safeCount} Safe
          </Badge>
          <Badge variant="danger" className="text-sm px-3 py-1">
            ! {needHelpCount} Need Help
          </Badge>
          <Badge variant="noupdate" className="text-sm px-3 py-1">
            – {noUpdateCount} No Update
          </Badge>
        </div>
      </div>

      {/* Status action bar */}
      <div className="px-4 py-4 bg-gray-50">
        <StatusActionBar groupId={groupId} />
      </div>

      {/* Invite link */}
      <div className="px-4 pb-4 bg-gray-50">
        <InviteLinkCard
          groupId={group.id}
          inviteCode={group.inviteCode}
          isAdmin={isAdmin}
        />
      </div>

      {/* Member list – segmented */}
      <div className="bg-white">
        {needHelpCount > 0 && (
          <MemberList
            members={membersWithStatus}
            filterStatus="NEED_HELP"
            title="Need Help"
          />
        )}
        <MemberList
          members={membersWithStatus}
          filterStatus="SAFE"
          title="Safe"
        />
        <MemberList
          members={membersWithStatus}
          filterStatus="NO_UPDATE"
          title="No Update"
        />
      </div>

      {/* Recent updates timeline */}
      {recentUpdates.length > 0 && (
        <div className="bg-white border-t border-gray-100 mt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 px-4 py-2">
            Recent Updates
          </h3>
          <ul className="divide-y divide-gray-50">
            {recentUpdates.map((update: any) => (
              <li key={update.id} className="px-4 py-2.5 flex items-start gap-2">
                <span
                  className={`mt-0.5 text-xs font-bold rounded-full px-1.5 py-0.5 ${
                    update.status === "SAFE"
                      ? "bg-safe-light text-safe"
                      : update.status === "NEED_HELP"
                      ? "bg-danger-light text-danger"
                      : "bg-noupdate-light text-slate-500"
                  }`}
                >
                  {update.status === "SAFE"
                    ? "✓"
                    : update.status === "NEED_HELP"
                    ? "!"
                    : "–"}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900">
                    {update.user.displayName ?? update.user.phone}
                  </span>
                  {update.note && (
                    <span className="text-sm text-gray-500"> · {update.note}</span>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(update.createdAt).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
