import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { submitPromotionRequestForEvaluation, isRetryableKfsaErrorCode } from "@/lib/kfsa/promotion-submission";
import { KfsaSubmissionBoundaryError } from "@/lib/kfsa/errors";
import { KfsaClientError } from "@/lib/kfsa/client";
import { PluginBoundaryError } from "@/lib/plugins/errors";

/**
 * The SaaS Governance Gateway boundary for KFSA Promotion Request
 * submission. The browser sends only { promotion_request_id }; every
 * canonical field the external KFSA Runtime Core sees is resolved
 * server-side from already-persisted, RLS-scoped rows by
 * submitPromotionRequestForEvaluation -- see
 * docs/plugins/kfsa-promotion-request-integration-v1.md. The browser never
 * calls KFSA directly and never supplies organization_id, source_plugin_id,
 * source_skill_id, source_run_id, evidence_ids, authority_context,
 * review_outcome, or any KFSA decision field; any of those present in the
 * request body are rejected outright before this route does anything else.
 *
 * Two Supabase clients are used deliberately: `tenantClient` is the
 * caller's own session-scoped client (RLS-enforced, used for every
 * ownership read), and `adminClient` is a service-role client used only
 * for the KFSA-integration writes themselves, after ownership has already
 * been verified -- see lib/supabase/admin.ts and
 * repositories/kfsa-integration-admin-repository.ts for why this split
 * exists (an authenticated tenant could otherwise INSERT a fabricated
 * "KFSA evaluation result" directly).
 */
const PROHIBITED_BODY_FIELDS = [
  "organization_id",
  "source_plugin_id",
  "source_skill_id",
  "source_run_id",
  "evidence_ids",
  "authority_context",
  "review_outcome",
  "formal_decision_created",
  "decision_code",
  "kfsa_decision_id",
  "kfsa_decision_code",
  "official_decision",
  "official_verdict",
];

export async function POST(request: Request) {
  const tenantClient = createServerSupabaseClient();

  const {
    data: { user },
  } = await tenantClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated", message: "Sign in required." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json", message: "Request body must be valid JSON." }, { status: 400 });
  }

  for (const field of PROHIBITED_BODY_FIELDS) {
    if (field in body) {
      return NextResponse.json({ error: "client_authored_field", message: `Field "${field}" is prohibited; it is always resolved server-side.` }, { status: 400 });
    }
  }

  if (typeof body.promotion_request_id !== "string" || body.promotion_request_id.length === 0) {
    return NextResponse.json({ error: "missing_promotion_request_id", message: "promotion_request_id is required." }, { status: 400 });
  }

  try {
    const adminClient = createSupabaseAdminClient();
    const outcome = await submitPromotionRequestForEvaluation(tenantClient, adminClient, { promotionRequestId: body.promotion_request_id });

    if (outcome.kind === "in_progress") {
      return NextResponse.json({ status: "IN_PROGRESS", retryable: true });
    }

    if (outcome.kind === "failed") {
      return NextResponse.json({
        status: "FAILED",
        error_code: outcome.errorCode,
        retryable: outcome.retryable,
      });
    }

    return NextResponse.json({
      status: outcome.kind === "replay" ? "REPLAYED" : "COMPLETED",
      external_promotion_request_id: outcome.evaluationResponse.external_promotion_request_id,
      review_outcome: outcome.evaluationResponse.review_outcome,
      evidence_status: outcome.evaluationResponse.evidence_status,
      authority_status: outcome.evaluationResponse.authority_status,
      escalation_required: outcome.evaluationResponse.escalation_required,
      blocked_actions: outcome.evaluationResponse.blocked_actions,
      formal_decision_created: outcome.evaluationResponse.formal_decision_created,
    });
  } catch (error) {
    if (error instanceof KfsaSubmissionBoundaryError || error instanceof PluginBoundaryError) {
      return NextResponse.json({ error: error.reason, message: error.message }, { status: 403 });
    }
    // A KfsaClientError escaping all the way here means the external call
    // itself failed in a way submitPromotionRequestForEvaluation could not
    // convert into a { kind: "failed" } outcome (e.g. it was thrown before
    // an attempt row existed to attach the failure to). Sanitize it into
    // the same structured shape rather than letting it become a raw 500.
    if (error instanceof KfsaClientError) {
      return NextResponse.json({ status: "FAILED", error_code: error.code, retryable: isRetryableKfsaErrorCode(error.code) });
    }
    throw error;
  }
}
