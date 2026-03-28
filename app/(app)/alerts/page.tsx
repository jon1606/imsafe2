import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/client";
import { AlertCard } from "@/components/alerts/AlertCard";
import { MockAlertButton } from "@/components/alerts/MockAlertButton";

export const metadata = { title: "Alerts – SafeCircle" };
export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const { userId } = await requireAuth();

  // Fetch alerts relevant to this user:
  // 1. Global alerts (no groupId)
  // 2. Alerts for groups the user belongs to
  const userGroups = await prisma.groupMember.findMany({
    where: { userId },
    select: { groupId: true },
  });
  const groupIds = userGroups.map((m) => m.groupId);

  const alerts = await prisma.alertEvent.findMany({
    where: {
      OR: [
        { groupId: null },
        { groupId: { in: groupIds } },
      ],
    },
    include: {
      group: { select: { name: true } },
      responses: { where: { userId }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const activeAlerts = alerts.filter((a) => a.state === "ACTIVE");
  const pastAlerts = alerts.filter((a) => a.state !== "ACTIVE");

  return (
    <div className="space-y-0">
      <div className="px-4 py-4 flex items-center justify-between bg-white border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Alerts</h1>
          {activeAlerts.length > 0 && (
            <p className="text-sm text-danger font-medium">
              {activeAlerts.length} active alert{activeAlerts.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
        {/* Dev mode mock trigger */}
        {process.env.NODE_ENV !== "production" && <MockAlertButton />}
      </div>

      <div className="p-4 space-y-4">
        {activeAlerts.length === 0 && pastAlerts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🛡️</div>
            <p className="font-medium text-gray-700">No alerts</p>
            <p className="text-sm text-gray-500 mt-1">
              You'll be notified when an emergency alert is triggered
            </p>
          </div>
        )}

        {activeAlerts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Active
            </h2>
            {activeAlerts.map((alert) => (
              <a key={alert.id} href={`/alerts/${alert.id}`}>
                <AlertCard alert={alert} />
              </a>
            ))}
          </div>
        )}

        {pastAlerts.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mt-2">
              Past
            </h2>
            {pastAlerts.map((alert) => (
              <a key={alert.id} href={`/alerts/${alert.id}`}>
                <AlertCard alert={alert} compact />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
