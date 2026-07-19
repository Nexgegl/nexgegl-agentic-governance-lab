import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { preparePromotionRequestFromRun } from "@/lib/plugins/promotion-request-composer";
import { PluginBoundaryError } from "@/lib/plugins/errors";

export async function POST(request: Request, { params }: { params: { runId: string } }) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated", message: "Sign in required." }, { status: 401 });
  }

  let body: { objective?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json", message: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!body.objective) {
    return NextResponse.json({ error: "missing_objective", message: "objective is required." }, { status: 400 });
  }

  try {
    const promotionRequest = await preparePromotionRequestFromRun(supabase, { runId: params.runId, objective: body.objective });
    return NextResponse.json({
      promotion_request_id: promotionRequest.id,
      review_outcome: promotionRequest.review_outcome,
      evidence_status: promotionRequest.evidence_status,
      authority_status: promotionRequest.authority_status,
      escalation_required: promotionRequest.escalation_required,
      blocked_actions: promotionRequest.blocked_actions,
    });
  } catch (error) {
    if (error instanceof PluginBoundaryError) {
      return NextResponse.json({ error: error.reason, message: error.message }, { status: 403 });
    }
    throw error;
  }
}
