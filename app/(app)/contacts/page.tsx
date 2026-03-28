import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/client";
import { ContactCard } from "@/components/contacts/ContactCard";
import { AddContactDialog } from "@/components/contacts/AddContactDialog";
import { PendingRequestsSection } from "@/components/contacts/PendingRequestsSection";

export const metadata = { title: "Contacts – SafeCircle" };
export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const { userId } = await requireAuth();

  // People I follow (accepted)
  const following = await prisma.contactFollow.findMany({
    where: { followerId: userId, state: "ACCEPTED" },
    include: {
      following: {
        include: {
          statusUpdates: {
            orderBy: { createdAt: "desc" },
            take: 1,
            where: { groupId: null }, // global status only
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Incoming pending requests
  const incomingRequests = await prisma.contactFollow.findMany({
    where: { followingId: userId, state: "PENDING" },
    include: { follower: true },
    orderBy: { createdAt: "desc" },
  });

  // Outgoing pending requests
  const outgoingRequests = await prisma.contactFollow.findMany({
    where: { followerId: userId, state: "PENDING" },
    include: { following: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-0">
      <div className="px-4 py-4 flex items-center justify-between bg-white border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500">{following.length} following</p>
        </div>
        <AddContactDialog />
      </div>

      {/* Pending incoming */}
      {incomingRequests.length > 0 && (
        <PendingRequestsSection requests={incomingRequests} />
      )}

      {/* Following list */}
      {following.length === 0 && incomingRequests.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="text-5xl">👤</div>
          <p className="text-gray-700 font-medium">No contacts yet</p>
          <p className="text-sm text-gray-500">
            Add contacts by phone number to see their safety status
          </p>
        </div>
      ) : (
        <div className="bg-white mt-2 divide-y divide-gray-100">
          {following.map(({ following: contact }) => (
            <ContactCard
              key={contact.id}
              user={contact}
              latestStatus={contact.statusUpdates[0] ?? null}
            />
          ))}
        </div>
      )}

      {/* Outgoing pending */}
      {outgoingRequests.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 px-4 py-2">
            Pending sent ({outgoingRequests.length})
          </p>
          <div className="bg-white divide-y divide-gray-100">
            {outgoingRequests.map(({ following: contact }) => (
              <div key={contact.id} className="flex items-center gap-3 px-4 py-3">
                <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-500">
                  {(contact.displayName ?? contact.phone).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {contact.displayName ?? contact.phone}
                  </p>
                  <p className="text-xs text-gray-400">Pending</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
