import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";
import type { SessionData } from "@/types";

// SESSION_SECRET must be ≥32 chars.
// A safe default is provided so no env var is needed for the demo.
// Change this in production via the SESSION_SECRET environment variable.
const DEFAULT_SECRET = "safecircle-demo-secret-32chars!!";

export const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET ?? DEFAULT_SECRET,
  cookieName: "safecircle_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS);
}

export async function getSessionUser(): Promise<SessionData | null> {
  const session = await getSession();
  if (!session.userId) return null;
  return {
    userId: session.userId,
    phone: session.phone,
    displayName: session.displayName,
  };
}
