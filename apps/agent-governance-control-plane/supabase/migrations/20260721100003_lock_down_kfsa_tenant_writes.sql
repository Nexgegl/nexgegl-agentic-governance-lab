-- KFSA Promotion Request Integration v1 -- remediation of the independent
-- pre-PR review's HIGH findings. Additive only: does not rewrite
-- 20260721100001_create_kfsa_integration.sql,
-- 20260721100002_rls_kfsa_integration.sql, or any historical migration.
--
-- H-1 (confirmed by direct empirical reproduction against real Postgres):
-- an authenticated tenant could INSERT directly into
-- kfsa_submission_attempts / kfsa_evaluation_responses /
-- kfsa_external_audit_links using nothing but their own normal session,
-- fabricating a "successful KFSA evaluation" -- any ReviewOutcome, any
-- external_promotion_request_id, any response_hash -- entirely bypassing
-- lib/kfsa/client.ts, lib/kfsa/contracts/promotion-request-v1.ts, and the
-- Governance Gateway route, with zero audit trail.
--
-- Fix: remove every ordinary-tenant INSERT/UPDATE policy on these three
-- tables. SELECT (own-org read) is unchanged -- tenants can still see
-- their own submission history and evaluation results. No DELETE policy
-- ever existed for any of these tables (unchanged). All writes now go
-- through repositories/kfsa-integration-admin-repository.ts using a
-- service-role client (lib/supabase/admin.ts), called only from
-- lib/kfsa/promotion-submission.ts *after* ownership has already been
-- verified with the ordinary tenant-scoped client. Service-role bypasses
-- RLS entirely (see `create role service_role ... bypassrls` in
-- scripts/governance-tests/db-setup.ts's auth stub, matching a real
-- Supabase project's posture), so no INSERT/UPDATE policy is written for
-- it -- there is deliberately no policy any ordinary authenticated caller
-- could ever satisfy for these operations.
--
-- Related finding: the original single-column foreign keys only checked
-- that a referenced row *existed*, not that it belonged to the same
-- organization -- a different tenant could still INSERT (before this
-- migration) a row whose promotion_request_id/submission_attempt_id
-- pointed at *another* organization's real row. RLS SELECT was verified
-- to still correctly exclude such a row from the other organization's own
-- queries, but the write itself should never have been possible. Fixed by
-- replacing every KFSA-integration foreign key with a composite
-- (organization_id, <id>) foreign key against a composite
-- (organization_id, id) unique constraint on the referenced table, so a
-- cross-tenant reference is rejected by Postgres itself, not only by
-- application logic -- and, independently, by removing tenant write
-- access outright per the fix above.

-- 1. Remove all ordinary-tenant write access on the KFSA integration tables

drop policy if exists "kfsa_submission_attempts_insert_own_org" on public.kfsa_submission_attempts;
drop policy if exists "kfsa_submission_attempts_update_own_org" on public.kfsa_submission_attempts;
drop policy if exists "kfsa_evaluation_responses_insert_own_org" on public.kfsa_evaluation_responses;
drop policy if exists "kfsa_external_audit_links_insert_own_org" on public.kfsa_external_audit_links;

-- 2. Tenant-consistent composite foreign keys --------------------------------

-- promotion_requests.id is already globally unique (primary key), so this
-- composite unique constraint is satisfiable by every existing row; safe
-- to add unconditionally on what is, pre-launch, always an empty table.
alter table public.promotion_requests
  add constraint promotion_requests_org_id_unique unique (organization_id, id);

alter table public.kfsa_submission_attempts
  add constraint kfsa_submission_attempts_org_id_unique unique (organization_id, id);

alter table public.kfsa_submission_attempts
  drop constraint if exists kfsa_submission_attempts_promotion_request_id_fkey,
  add constraint kfsa_submission_attempts_org_promotion_request_fkey
    foreign key (organization_id, promotion_request_id)
    references public.promotion_requests (organization_id, id)
    on delete restrict;

alter table public.kfsa_evaluation_responses
  drop constraint if exists kfsa_evaluation_responses_promotion_request_id_fkey,
  add constraint kfsa_evaluation_responses_org_promotion_request_fkey
    foreign key (organization_id, promotion_request_id)
    references public.promotion_requests (organization_id, id)
    on delete restrict;

alter table public.kfsa_evaluation_responses
  drop constraint if exists kfsa_evaluation_responses_submission_attempt_id_fkey,
  add constraint kfsa_evaluation_responses_org_submission_attempt_fkey
    foreign key (organization_id, submission_attempt_id)
    references public.kfsa_submission_attempts (organization_id, id)
    on delete restrict;

alter table public.kfsa_external_audit_links
  drop constraint if exists kfsa_external_audit_links_promotion_request_id_fkey,
  add constraint kfsa_external_audit_links_org_promotion_request_fkey
    foreign key (organization_id, promotion_request_id)
    references public.promotion_requests (organization_id, id)
    on delete restrict;

alter table public.kfsa_external_audit_links
  drop constraint if exists kfsa_external_audit_links_submission_attempt_id_fkey,
  add constraint kfsa_external_audit_links_org_submission_attempt_fkey
    foreign key (organization_id, submission_attempt_id)
    references public.kfsa_submission_attempts (organization_id, id)
    on delete restrict;

-- 3. Everything else is unchanged --------------------------------------------
-- RLS remains enabled on all three tables (from 20260721100002). SELECT
-- (own-org read) policies are untouched. kfsa_evaluation_responses and
-- kfsa_external_audit_links remain fully immutable
-- (prevent_kfsa_evaluation_response_mutation() /
-- prevent_kfsa_audit_link_mutation(), from 20260721100001) -- those
-- triggers are unconditional on `auth.role() <> 'service_role'`, so they
-- still apply to the admin repository's own writes exactly as before: it
-- may INSERT, never UPDATE or DELETE. kfsa_submission_attempts' terminal-
-- state lock (guard_kfsa_submission_attempt_update()) is likewise
-- unconditional on role and still protects the admin repository's own
-- updates from ever re-mutating a terminal row. formal_decision_created's
-- check (= false) and review_outcome's check (in PASS/FIX/FAIL/ESCALATE)
-- are schema-level and untouched.
