import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { joinGroupByInviteCode } from "@/actions/group";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function JoinGroupPage({ params }: PageProps) {
  const { code } = await params;
  const session = await getSessionUser();

  if (!session?.userId) {
    redirect(`/login?from=/join/${code}`);
  }

  const result = await joinGroupByInviteCode(code);

  if (result.success) {
    redirect(`/groups/${result.data.groupId}`);
  } else {
    redirect(`/groups?error=${encodeURIComponent(result.error)}`);
  }
}
