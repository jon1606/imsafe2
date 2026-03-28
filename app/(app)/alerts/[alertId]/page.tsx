import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/client";
import { AlertResponsePrompt } from "@/components/alerts/AlertResponsePrompt";
import { AlertCard } from "@/components/alerts/AlertCard";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ alertId: string }>;
}

export default async function AlertDetailPage({ params }: PageProps) {
  const { alertId } = await params;
  const { userId } = await requireAuth();

  const alert = await prisma.alertEvent.findUnique({
    where: { id: alertId },
    include: {
      group: { select: { name: true, id: true } },
      responses: {
        include: { user: true },
        orderBy: { respondedAt: "asc" },
      },
    },
  });

  if (!alert) notFound();

  const myResponse = alert.responses.find((r) => r.userId === userId);

  const safeCount = alert.responses.filter((r) => r.status === "SAFE").length;
  const needHelpCount = alert.responses.filter((r) => r.status === "NEED_HELP").length;

  return (
    <div className="space-y-0">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <Link href="/alerts" className="flex items-center gap-1 text-sm text-blue-600 mb-3">
          <ArrowLeft className="h-4 w-4" />
          Alerts
        </Link>
        <AlertCard alert={alert} />
      </div>

      <div className="p-4 space-y-4">
        {/* Response prompt if active */}
        {alert.state === "ACTIVE" && (
          <AlertResponsePrompt
            alertId={alert.id}
            existingResponse={myResponse?.status ?? null}
          />
        )}

        {/* Response summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            Responses ({alert.responses.length})
          </h3>
          <div className="flex gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-safe">{safeCount}</p>
              <p className="text-xs text-gray-500">Safe</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-danger">{needHelpCount}</p>
              <p className="text-xs text-gray-500">Need Help</p>
            </div>
          </div>

          {alert.responses.length > 0 && (
            <ul className="divide-y divide-gray-50">
              {alert.responses.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-2.5">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                    {(r.user.displayName ?? r.user.phone).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {r.user.displayName ?? r.user.phone}
                    </p>
                    {r.note && (
                      <p className="text-xs text-gray-500">{r.note}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      r.status === "SAFE"
                        ? "bg-safe-light text-safe"
                        : "bg-danger-light text-danger"
                    }`}
                  >
                    {r.status === "SAFE" ? "✓ Safe" : "! Help"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
