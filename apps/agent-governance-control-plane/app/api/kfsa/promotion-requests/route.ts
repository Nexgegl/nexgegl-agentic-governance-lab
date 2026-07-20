import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { submitPromotionRequestForEvaluation } from "@/lib/kfsa/promotion-submission";
import { KfsaSubmissionBoundaryError } from "@/lib/kfsa/errors";
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
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
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
    const outcome = await submitPromotionRequestForEvaluation(supabase, { promotionRequestId: body.promotion_request_id });

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
    throw error;
  }
}
