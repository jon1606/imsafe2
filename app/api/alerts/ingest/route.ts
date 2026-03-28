/**
 * POST /api/alerts/ingest
 *
 * External alert ingestion endpoint.
 * Secured by a shared secret (ALERT_INGEST_SECRET env var).
 *
 * TODO: Add provider-specific adapters (FEMA IPAWS, PagerDuty, etc.)
 * by transforming their payloads into IngestAlertInput before calling ingestAlert().
 */

import { NextRequest, NextResponse } from "next/server";
import { ingestAlert } from "@/lib/alerts/processor";
import { IngestAlertSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  // Verify shared secret
  const secret = request.headers.get("x-alert-secret");
  if (
    process.env.ALERT_INGEST_SECRET &&
    secret !== process.env.ALERT_INGEST_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = IngestAlertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const alert = await ingestAlert(parsed.data);

    return NextResponse.json({ success: true, alertId: alert.id }, { status: 201 });
  } catch (err) {
    console.error("Alert ingest error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
