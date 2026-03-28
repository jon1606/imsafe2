/**
 * POST /api/webhooks/twilio
 *
 * Twilio status callback webhook.
 * Validates the Twilio signature and logs delivery status.
 */

import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(request: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = request.headers.get("x-twilio-signature") ?? "";
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`;

  const body = await request.text();
  const params = Object.fromEntries(new URLSearchParams(body));

  // Validate Twilio signature in production
  if (authToken && process.env.NODE_ENV === "production") {
    const isValid = twilio.validateRequest(authToken, signature, url, params);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
  }

  // Log or process status callback
  const { MessageStatus, MessageSid, To } = params;
  console.log(`[Twilio] ${MessageSid} → ${To}: ${MessageStatus}`);

  // Return 200 to acknowledge receipt
  return new NextResponse(null, { status: 200 });
}
