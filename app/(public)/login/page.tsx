import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { LoginFlow } from "@/components/auth/LoginFlow";

export const metadata = {
  title: "Sign In – SafeCircle",
};

export default async function LoginPage() {
  const session = await getSessionUser();
  if (session?.userId) redirect("/dashboard");

  return <LoginFlow />;
}
