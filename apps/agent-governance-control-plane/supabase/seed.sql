-- Safe development seed data. No real customer data, no real personal data.
-- Applied automatically by `supabase db reset` after migrations run.

insert into public.organizations (id, name, slug)
values ('00000000-0000-0000-0000-000000000001', 'NEXGEGL Demo Org', 'nexgegl-demo')
on conflict (id) do nothing;

insert into public.use_cases (
  organization_id, name, name_ar, department, owner_name, authority, ai_type,
  business_purpose, business_purpose_ar, risk_level, data_sensitivity, tool_access,
  governance_status, eval_score, eval_outcome, readiness_score, evidence_status,
  authority_status, audit_trail_status, lifecycle_stage, production_approval_status
)
select * from (values
  (
    '00000000-0000-0000-0000-000000000001'::uuid, 'Customer Support Draft Assistant', 'مساعد صياغة ردود دعم العملاء',
    'Customer Service', 'Demo Owner', 'Head of Support', 'Generative Assistant',
    'Drafts suggested replies for support agents to review before sending.',
    'صياغة ردود مقترحة لوكلاء الدعم لمراجعتها قبل الإرسال.',
    'medium', 'medium', 'read_only', 'GOVERNANCE_REVIEW_REQUIRED', 78::numeric, 'FIX', 60::numeric,
    'partial', 'escalation_required', 'partial', 'pilot', false
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid, 'Contract Clause Extraction', 'استخراج بنود العقود',
    'Legal', 'Demo Owner', 'General Counsel', 'Document Analysis',
    'Extracts key clauses from vendor contracts for paralegal review.',
    'استخراج البنود الأساسية من عقود الموردين لمراجعة المساعد القانوني.',
    'high', 'high', 'read_only', 'REPAIR_REQUIRED', 64::numeric, 'FIX', 45::numeric,
    'missing', 'missing', 'missing', 'proposed', false
  ),
  (
    '00000000-0000-0000-0000-000000000001'::uuid, 'Meeting Notes Summarizer', 'تلخيص محاضر الاجتماعات',
    'Operations', 'Demo Owner', 'COO', 'Summarization',
    'Summarizes internal meeting transcripts into action items.',
    'تلخيص محاضر الاجتماعات الداخلية إلى بنود عمل.',
    'low', 'low', 'read_only', 'READY_FOR_AUTHORITY_REVIEW', 91::numeric, 'PASS', 88::numeric,
    'complete', 'confirmed', 'present', 'governed_runtime', false
  )
) as v
where not exists (select 1 from public.use_cases where name = v.column2);

-- Test profile placeholder flow (manual, one-time, not scriptable here):
--
-- profiles.id is a foreign key into auth.users(id), which is managed by
-- Supabase Auth (GoTrue), not by plain SQL insert — there is no real test
-- user in this environment to attach a profile to. To finish the flow:
--
--   1. Create a test user via Supabase Auth (dashboard "Add user", or
--      `supabase auth admin create-user` against a linked project).
--   2. Run, substituting the created user's id:
--
--      insert into public.profiles (id, organization_id, full_name, role)
--      values ('<auth-user-uuid>', '00000000-0000-0000-0000-000000000001', 'Demo Test User', 'admin');
