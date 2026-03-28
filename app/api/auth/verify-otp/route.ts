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

    const { phone, code, displayName } = parsed.data;

    // ── Verify OTP ──────────────────────────────────────────────────────────
    const isDevMode =
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_VERIFY_SERVICE_SID;

    if (isDevMode) {
      // Allow any 6-digit code in dev; default bypass: 123456
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

    // ── Upsert user ─────────────────────────────────────────────────────────
    const user = await prisma.user.upsert({
      where: { phone },
      create: { phone, displayName: displayName ?? null },
      update: displayName ? { displayName } : {},
    });

    // ── Create session ───────────────────────────────────────────────────────
    const session = await getSession();
    session.userId = user.id;
    session.phone = user.phone;
    session.displayName = user.displayName;
    await session.save();

    // Log session in DB for audit
    await prisma.userSession.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    });

    const isNewUser = !user.displayName;

    return NextResponse.json({
      success: true,
      userId: user.id,
      isNewUser,
    });
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
