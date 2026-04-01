import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { VerifyOtpSchema } from "@/lib/validation/schemas";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = VerifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { phone, code } = parsed.data;

    // ── Verify OTP ──────────────────────────────────────────────────────────
    const isDevMode =
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_VERIFY_SERVICE_SID;

    if (isDevMode) {
      if (code !== "123456") {
        return NextResponse.json(
          { error: "Invalid OTP (dev mode: use 123456)" },
          { status: 400 }
        );
      }
    } else {
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      const check = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
        .verificationChecks.create({ to: phone, code });

      if (check.status !== "approved") {
        return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
      }
    }

    // ── Resolve user ─────────────────────────────────────────────────────────
    // In demo/dev mode the in-memory DB is not shared across serverless
    // invocations. Creating a new user here would produce a UUID that is
    // unknown to every other Lambda, causing requireAuth to redirect back
    // to /login on the very next request.
    //
    // Strategy: match the phone to a seed user; fall back to u1 (Alice Chen)
    // so every login always resolves to a persistent, known user ID.
    let user = await prisma.user.findFirst({ where: { phone } });
    if (!user) {
      // Default demo persona — all seed users have a displayName
      user = await prisma.user.findUnique({ where: { id: "u1" } });
    }

    if (!user) {
      return NextResponse.json({ error: "Demo data missing" }, { status: 500 });
    }

    // ── Create session ───────────────────────────────────────────────────────
    const session = await getSession();
    session.userId = user.id;
    session.phone = user.phone;
    session.displayName = user.displayName;
    await session.save();

    return NextResponse.json({
      success: true,
      userId: user.id,
      isNewUser: false, // seed users always have display names
    });
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
