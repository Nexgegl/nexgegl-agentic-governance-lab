-- Safe development seed data. No real customer data, no real personal data.
-- Applied automatically by `supabase db reset` after migrations run.
--
-- Fixed UUIDs are used throughout (instead of gen_random_uuid()) so that
-- foreign keys between sections of this file — use_cases -> models/vendors,
-- agents/incidents/audit_events/data_lineage -> use_cases, use_case_data_sources
-- join rows — can be written out explicitly and stay idempotent on re-run.

insert into public.organizations (id, name, slug)
values ('00000000-0000-0000-0000-000000000001', 'NEXGEGL Demo Org', 'nexgegl-demo')
on conflict (id) do nothing;

-- Vendors -------------------------------------------------------------------

insert into public.vendors (id, organization_id, name, name_ar, category, data_access_level, contract_status, risk_tier, last_assessed)
values
  ('00000000-0000-0000-0000-000000001001', '00000000-0000-0000-0000-000000000001', 'OpenAI', 'أوبن إيه آي', 'Model Provider', 'medium', 'active', 'medium', '2026-06-01'),
  ('00000000-0000-0000-0000-000000001002', '00000000-0000-0000-0000-000000000001', 'Internal ML Platform Team', 'فريق منصة تعلم الآلة الداخلي', 'Internal', 'high', 'active', 'low', '2026-05-15')
on conflict (id) do nothing;

-- Data sources ----------------------------------------------------------------

insert into public.data_sources (id, organization_id, name, name_ar, type, sensitivity, owner, classification_status, last_classified)
values
  ('00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000000001', 'CRM Customer Records', 'سجلات العملاء في نظام إدارة العلاقات', 'structured', 'high', 'Customer Service Ops', 'partial', '2026-06-20'),
  ('00000000-0000-0000-0000-000000002002', '00000000-0000-0000-0000-000000000001', 'Support Ticket Transcripts', 'محاضر تذاكر الدعم', 'unstructured', 'medium', 'Customer Service Ops', 'complete', '2026-06-18'),
  ('00000000-0000-0000-0000-000000002003', '00000000-0000-0000-0000-000000000001', 'Vendor Contract Repository', 'مستودع عقود الموردين', 'document_repository', 'high', 'Legal', 'missing', '2026-05-02'),
  ('00000000-0000-0000-0000-000000002004', '00000000-0000-0000-0000-000000000001', 'Meeting Transcript Feed', 'تغذية محاضر الاجتماعات', 'api_feed', 'low', 'Operations', 'complete', '2026-07-01'),
  ('00000000-0000-0000-0000-000000002005', '00000000-0000-0000-0000-000000000001', 'HR Candidate Records', 'سجلات المرشحين لدى الموارد البشرية', 'structured', 'high', 'HR', 'missing', '2026-04-10')
on conflict (id) do nothing;

-- Models ----------------------------------------------------------------------

insert into public.models (id, organization_id, name, provider, version, vendor_id, data_residency, evaluation_status, last_evaluated, risk_tier, approved_for_production)
values
  ('00000000-0000-0000-0000-000000003001', '00000000-0000-0000-0000-000000000001', 'GPT-4o mini (Support Drafts)', 'OpenAI', '2026-06', '00000000-0000-0000-0000-000000001001', 'regional', 'partial', '2026-06-15', 'medium', false),
  ('00000000-0000-0000-0000-000000003002', '00000000-0000-0000-0000-000000000001', 'Internal Lead Scoring Classifier', 'Internal', '3.2.0', '00000000-0000-0000-0000-000000001002', 'in_country', 'complete', '2026-06-30', 'low', false)
on conflict (id) do nothing;

-- Use cases (AI Inventory) ------------------------------------------------------

insert into public.use_cases (
  id, organization_id, name, name_ar, department, owner_name, authority, ai_type,
  business_purpose, business_purpose_ar, risk_level, data_sensitivity, tool_access,
  governance_status, eval_score, eval_outcome, readiness_score, evidence_status,
  authority_status, audit_trail_status, lifecycle_stage, production_approval_status,
  owner_evidence, authority_evidence, eval_evidence, audit_evidence, policy_boundary_evidence, approval_evidence,
  permissions, model_id, vendor_id
)
values
  (
    '00000000-0000-0000-0000-000000004001', '00000000-0000-0000-0000-000000000001',
    'Customer Support Draft Assistant', 'مساعد صياغة ردود دعم العملاء',
    'Customer Service', 'Demo Owner', 'Head of Support', 'Generative Assistant',
    'Drafts suggested replies for support agents to review before sending.',
    'صياغة ردود مقترحة لوكلاء الدعم لمراجعتها قبل الإرسال.',
    'medium', 'medium', 'read_only', 'GOVERNANCE_REVIEW_REQUIRED', 78, 'FIX', 60,
    'partial', 'escalation_required', 'partial', 'pilot', false,
    true, false, true, true, true, false,
    '{"read_internal_docs":"allowed","read_customer_data":"requires_approval","read_crm":"allowed","update_crm":"blocked","send_email":"requires_approval","export_data":"blocked","trigger_workflow":"blocked","external_api_access":"forbidden"}'::jsonb,
    '00000000-0000-0000-0000-000000003001', '00000000-0000-0000-0000-000000001001'
  ),
  (
    '00000000-0000-0000-0000-000000004002', '00000000-0000-0000-0000-000000000001',
    'Contract Clause Extraction', 'استخراج بنود العقود',
    'Legal', 'Demo Owner', 'General Counsel', 'Document Analysis',
    'Extracts key clauses from vendor contracts for paralegal review.',
    'استخراج البنود الأساسية من عقود الموردين لمراجعة المساعد القانوني.',
    'high', 'high', 'read_only', 'REPAIR_REQUIRED', 64, 'FIX', 45,
    'missing', 'missing', 'missing', 'proposed', false,
    false, false, false, false, false, false,
    '{"read_internal_docs":"allowed","read_customer_data":"blocked","read_crm":"blocked","update_crm":"forbidden","send_email":"blocked","export_data":"blocked","trigger_workflow":"blocked","external_api_access":"forbidden"}'::jsonb,
    null, null
  ),
  (
    '00000000-0000-0000-0000-000000004003', '00000000-0000-0000-0000-000000000001',
    'Meeting Notes Summarizer', 'تلخيص محاضر الاجتماعات',
    'Operations', 'Demo Owner', 'COO', 'Summarization',
    'Summarizes internal meeting transcripts into action items.',
    'تلخيص محاضر الاجتماعات الداخلية إلى بنود عمل.',
    'low', 'low', 'read_only', 'READY_FOR_AUTHORITY_REVIEW', 91, 'PASS', 88,
    'complete', 'confirmed', 'present', 'governed_runtime', false,
    true, true, true, true, true, true,
    '{"read_internal_docs":"allowed","read_customer_data":"forbidden","read_crm":"forbidden","update_crm":"forbidden","send_email":"blocked","export_data":"requires_approval","trigger_workflow":"blocked","external_api_access":"forbidden"}'::jsonb,
    null, null
  ),
  (
    '00000000-0000-0000-0000-000000004004', '00000000-0000-0000-0000-000000000001',
    'HR Resume Screening Assistant', 'مساعد فرز السير الذاتية',
    'HR', 'Demo Owner', 'VP People', 'Classification',
    'Screens incoming resumes against role requirements for recruiter triage.',
    'فرز السير الذاتية الواردة مقابل متطلبات الوظيفة لفرز المسؤول عن التوظيف.',
    'high', 'high', 'write', 'BLOCKED', 41, 'FAIL', 30,
    'missing', 'missing', 'missing', 'proposed', false,
    false, false, false, false, false, false,
    '{"read_internal_docs":"allowed","read_customer_data":"forbidden","read_crm":"forbidden","update_crm":"forbidden","send_email":"blocked","export_data":"blocked","trigger_workflow":"blocked","external_api_access":"forbidden"}'::jsonb,
    null, null
  ),
  (
    '00000000-0000-0000-0000-000000004005', '00000000-0000-0000-0000-000000000001',
    'Sales Lead Scoring Model', 'نموذج ترقيم العملاء المحتملين',
    'Sales', 'Demo Owner', 'VP Sales', 'Classification',
    'Scores inbound sales leads by conversion likelihood for pipeline triage.',
    'ترقيم العملاء المحتملين الواردين حسب احتمالية التحويل لفرز خط المبيعات.',
    'medium', 'medium', 'write', 'ESCALATE_REQUIRED', 55, 'ESCALATE', 50,
    'partial', 'escalation_required', 'partial', 'pilot', false,
    true, false, true, false, true, false,
    '{"read_internal_docs":"allowed","read_customer_data":"requires_approval","read_crm":"allowed","update_crm":"requires_approval","send_email":"blocked","export_data":"blocked","trigger_workflow":"requires_approval","external_api_access":"forbidden"}'::jsonb,
    '00000000-0000-0000-0000-000000003002', '00000000-0000-0000-0000-000000001002'
  ),
  (
    '00000000-0000-0000-0000-000000004006', '00000000-0000-0000-0000-000000000001',
    'Internal Policy Q&A Bot', 'روبوت أسئلة وأجوبة السياسات الداخلية',
    'Operations', 'Demo Owner', 'COO', 'Generative Assistant',
    'Answers employee questions about internal policy using approved documents only.',
    'يجيب عن أسئلة الموظفين حول السياسات الداخلية باستخدام المستندات المعتمدة فقط.',
    'low', 'low', 'read_only', 'READY_FOR_AUTHORITY_REVIEW', 88, 'PASS', 84,
    'complete', 'confirmed', 'present', 'pilot', false,
    true, true, true, true, true, true,
    '{"read_internal_docs":"allowed","read_customer_data":"forbidden","read_crm":"forbidden","update_crm":"forbidden","send_email":"blocked","export_data":"blocked","trigger_workflow":"blocked","external_api_access":"forbidden"}'::jsonb,
    null, null
  )
on conflict (id) do nothing;

-- Data lineage ------------------------------------------------------------------

insert into public.data_lineage (organization_id, data_source_id, use_case_id, flow_description, flow_description_ar)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000004001', 'CRM records are read to pre-fill draft reply context.', 'تُقرأ سجلات نظام العملاء لتعبئة سياق الرد المقترح.'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000002002', '00000000-0000-0000-0000-000000004001', 'Support ticket transcripts are the primary input for draft generation.', 'محاضر تذاكر الدعم هي المدخل الأساسي لتوليد الرد المقترح.'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000002003', '00000000-0000-0000-0000-000000004002', 'Contracts are parsed to extract clause candidates.', 'تُحلَّل العقود لاستخراج بنود مرشحة.'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000002004', '00000000-0000-0000-0000-000000004003', 'Meeting transcripts stream in for summarization.', 'تصل محاضر الاجتماعات عبر التغذية لتُلخَّص.'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000002005', '00000000-0000-0000-0000-000000004004', 'Candidate records are screened against role criteria.', 'تُفرز سجلات المرشحين مقابل معايير الوظيفة.'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000004005', 'CRM records feed the lead scoring model.', 'تُغذّي سجلات نظام العملاء نموذج ترقيم العملاء المحتملين.')
on conflict do nothing;

-- use_case_data_sources join ------------------------------------------------------

insert into public.use_case_data_sources (organization_id, use_case_id, data_source_id)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000004001', '00000000-0000-0000-0000-000000002001'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000004001', '00000000-0000-0000-0000-000000002002'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000004002', '00000000-0000-0000-0000-000000002003'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000004003', '00000000-0000-0000-0000-000000002004'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000004004', '00000000-0000-0000-0000-000000002005'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000004005', '00000000-0000-0000-0000-000000002001')
on conflict (use_case_id, data_source_id) do nothing;

-- Agents ---------------------------------------------------------------------

insert into public.agents (id, organization_id, name, name_ar, use_case_id, agent_type, tool_access, status, owner_team, last_permission_review)
values
  ('00000000-0000-0000-0000-000000005001', '00000000-0000-0000-0000-000000000001', 'Support Draft Agent', 'وكيل صياغة الدعم', '00000000-0000-0000-0000-000000004001', 'Generative Assistant', 'read_only', 'active', 'Customer Service Ops', '2026-06-20'),
  ('00000000-0000-0000-0000-000000005002', '00000000-0000-0000-0000-000000000001', 'Contract Extraction Agent', 'وكيل استخراج العقود', '00000000-0000-0000-0000-000000004002', 'Document Analysis', 'read_only', 'under_review', 'Legal', '2026-05-05'),
  ('00000000-0000-0000-0000-000000005003', '00000000-0000-0000-0000-000000000001', 'Meeting Summarizer Agent', 'وكيل تلخيص الاجتماعات', '00000000-0000-0000-0000-000000004003', 'Summarization', 'read_only', 'active', 'Operations', '2026-07-01'),
  ('00000000-0000-0000-0000-000000005004', '00000000-0000-0000-0000-000000000001', 'Resume Screening Agent', 'وكيل فرز السير الذاتية', '00000000-0000-0000-0000-000000004004', 'Classification', 'write', 'suspended', 'HR', '2026-04-12'),
  ('00000000-0000-0000-0000-000000005005', '00000000-0000-0000-0000-000000000001', 'Lead Scoring Agent', 'وكيل ترقيم العملاء المحتملين', '00000000-0000-0000-0000-000000004005', 'Classification', 'write', 'under_review', 'Sales', '2026-06-10'),
  ('00000000-0000-0000-0000-000000005006', '00000000-0000-0000-0000-000000000001', 'Policy Q&A Agent', 'وكيل أسئلة السياسات', '00000000-0000-0000-0000-000000004006', 'Generative Assistant', 'read_only', 'active', 'Operations', '2026-07-05')
on conflict (id) do nothing;

-- Incidents --------------------------------------------------------------------

insert into public.incidents (id, organization_id, use_case_id, title, title_ar, severity, status, reported_date, resolved_date, summary_ar)
values
  ('00000000-0000-0000-0000-000000006001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000004001', 'Draft reply referenced unverified pricing', 'رد مقترح أشار إلى تسعير غير موثّق', 'medium', 'resolved', '2026-06-05', '2026-06-08', 'أدرج المساعد رقم تسعير غير موثّق في رد مقترح، وتم اكتشافه أثناء المراجعة البشرية قبل الإرسال.'),
  ('00000000-0000-0000-0000-000000006002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000004004', 'Screening model showed demographic skew in test batch', 'أظهر نموذج الفرز انحيازًا ديموغرافيًا في دفعة اختبار', 'high', 'investigating', '2026-06-25', null, 'رصد فريق المراجعة انحيازًا محتملاً في نتائج الفرز التجريبية، وتم إيقاف الوكيل ريثما يكتمل التحقيق.'),
  ('00000000-0000-0000-0000-000000006003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000004005', 'Lead scoring model drifted after CRM schema change', 'انحرف نموذج ترقيم العملاء بعد تغيير في مخطط نظام العملاء', 'medium', 'open', '2026-07-10', null, 'أدى تغيير في حقول نظام العملاء إلى انحراف في مدخلات النموذج، وجارٍ تقييم الأثر على دقة الترقيم.')
on conflict (id) do nothing;

-- Compliance mappings --------------------------------------------------------------

insert into public.compliance_mappings (organization_id, framework_name, requirement, requirement_ar, mapped_control_ids, status, owner)
values
  ('00000000-0000-0000-0000-000000000001', 'ISO/IEC 42001', 'AI management system risk assessment', 'تقييم مخاطر نظام إدارة الذكاء الاصطناعي', array['ai-inventory','risk-assessment'], 'partial', 'AI Governance Office'),
  ('00000000-0000-0000-0000-000000000001', 'ISO/IEC 42001', 'Human oversight of AI-assisted decisions', 'الإشراف البشري على القرارات المدعومة بالذكاء الاصطناعي', array['human-review'], 'complete', 'AI Governance Office'),
  ('00000000-0000-0000-0000-000000000001', 'NIST AI RMF', 'Data provenance and lineage tracking', 'تتبع مصدر البيانات وسلسلة تدفقها', array['data-lineage'], 'partial', 'Data Governance Team'),
  ('00000000-0000-0000-0000-000000000001', 'NIST AI RMF', 'Model evaluation before deployment', 'تقييم النموذج قبل النشر', array['model-eval'], 'missing', 'ML Platform Team'),
  ('00000000-0000-0000-0000-000000000001', 'Internal Governance Policy v1', 'Access control review per use case', 'مراجعة التحكم في الوصول لكل حالة استخدام', array['access-control','permissions-matrix'], 'partial', 'Access Control Owner'),
  ('00000000-0000-0000-0000-000000000001', 'Internal Governance Policy v1', 'Incident register maintained per AI asset', 'الاحتفاظ بسجل حوادث لكل أصل ذكاء اصطناعي', array['incident-register'], 'complete', 'AI Governance Office')
on conflict do nothing;

-- Audit events -----------------------------------------------------------------

insert into public.audit_events (organization_id, "timestamp", actor, action, action_ar, use_case_id, layer)
values
  ('00000000-0000-0000-0000-000000000001', '2026-07-01T09:00:00Z', 'AI Governance Office', 'Use case registered', 'تسجيل حالة استخدام جديدة', '00000000-0000-0000-0000-000000004001', 'ai_inventory'),
  ('00000000-0000-0000-0000-000000000001', '2026-07-02T10:30:00Z', 'Data Governance Team', 'Data source classified', 'تصنيف مصدر بيانات', '00000000-0000-0000-0000-000000004001', 'data_foundation'),
  ('00000000-0000-0000-0000-000000000001', '2026-06-15T14:00:00Z', 'ML Platform Team', 'Model evaluation run', 'تشغيل تقييم النموذج', '00000000-0000-0000-0000-000000004001', 'model_lifecycle'),
  ('00000000-0000-0000-0000-000000000001', '2026-06-20T11:15:00Z', 'Access Control Owner', 'Permission matrix reviewed', 'مراجعة مصفوفة الصلاحيات', '00000000-0000-0000-0000-000000004001', 'access_control'),
  ('00000000-0000-0000-0000-000000000001', '2026-06-20T11:20:00Z', 'Customer Service Ops', 'Agent permission review completed', 'اكتمال مراجعة صلاحيات الوكيل', '00000000-0000-0000-0000-000000004001', 'agent_governance'),
  ('00000000-0000-0000-0000-000000000001', '2026-06-08T16:45:00Z', 'Support Team Lead', 'Human review approved for next stage', 'موافقة المراجعة البشرية للمرحلة التالية', '00000000-0000-0000-0000-000000004001', 'human_oversight'),
  ('00000000-0000-0000-0000-000000000001', '2026-06-01T08:00:00Z', 'AI Governance Office', 'Compliance mapping updated', 'تحديث خريطة الامتثال', null, 'compliance_audit'),
  ('00000000-0000-0000-0000-000000000001', '2026-06-25T13:10:00Z', 'HR Governance Reviewer', 'Incident opened for demographic skew', 'فتح حادثة بسبب انحياز ديموغرافي', '00000000-0000-0000-0000-000000004004', 'agent_governance'),
  ('00000000-0000-0000-0000-000000000001', '2026-07-05T09:30:00Z', 'Operations Lead', 'Use case moved to authority review', 'انتقال الحالة إلى مراجعة السلطة المعتمدة', '00000000-0000-0000-0000-000000004006', 'ai_inventory'),
  ('00000000-0000-0000-0000-000000000001', '2026-07-10T15:00:00Z', 'Sales Ops Lead', 'Incident opened for model drift', 'فتح حادثة بسبب انحراف النموذج', '00000000-0000-0000-0000-000000004005', 'model_lifecycle')
on conflict do nothing;

-- Skills registry (catalog display — mirrors runtime/demo-skills.ts) -------------

insert into public.skills (
  id, organization_id, name, name_ar, version, description, description_ar, source_type, source_reference,
  category, trigger_conditions, required_tools, allowed_data_classes, prohibited_data_classes, required_authority,
  action_type, reversibility, external_system_access, write_capability, audit_required, human_approval_required,
  risk_level, review_status, approved_for_use, checksum, last_reviewed, reviewer, instructions, risk_profile
)
values
  (
    'institutional-research-planning', '00000000-0000-0000-0000-000000000001',
    'Institutional Research Planning', 'تخطيط البحث المؤسسي', '1.0.0',
    'Turns an institutional research request into a bounded, auditable research objective and step outline.',
    'يحوّل طلب بحث مؤسسي إلى هدف بحثي محدود وقابل للتدقيق مع مخطط خطوات.',
    'INTERNAL', 'internal://nexgegl/skills/institutional-research-planning@1.0.0', 'planning',
    array['طلب بحث مؤسسي جديد','الحاجة لتحليل مخاطر اعتماد ذكاء اصطناعي أو وكيل'], array[]::text[],
    array['low','medium','high'], array[]::text[], false,
    'ANALYSIS', 'REVERSIBLE', false, false, true, false,
    'low', 'APPROVED_FOR_DEMO', true, 'sha256-demo-irp-1a2b3c', '2026-07-10', 'AI Governance Office',
    array[
      'حدد نطاق السؤال البحثي وصنّفه ضمن فئة الحوكمة المناسبة.',
      'لا تصدر أي توصية أو قرار في هذه المرحلة — الناتج خطة بحث فقط.',
      'ارفض أي طلب مباشر لإصدار قرار رسمي أو موافقة إنتاج أو حكم KFSA.',
      'حدد الأدلة المطلوبة والصلاحية المؤسسية اللازمة قبل المتابعة.'
    ],
    '{"writeCapability":false,"externalSystemAccess":false,"dataSensitivityHandled":"medium","requiresHumanApproval":false}'::jsonb
  ),
  (
    'evidence-collection', '00000000-0000-0000-0000-000000000001',
    'Evidence Collection', 'جمع الأدلة', '1.0.0',
    'Collects evidence items from approved read-only tools within the bounds of the governed plan.',
    'يجمع عناصر الأدلة من الأدوات المعتمدة للقراءة فقط ضمن حدود الخطة المحكومة.',
    'INTERNAL', 'internal://nexgegl/skills/evidence-collection@1.0.0', 'research',
    array['وجود خطوة بحث تتطلب أدلة موثقة'], array['demo_web_search','demo_document_search','demo_internal_policy_lookup'],
    array['low','medium','high'], array[]::text[], false,
    'READ', 'REVERSIBLE', false, false, true, false,
    'low', 'APPROVED_FOR_DEMO', true, 'sha256-demo-ec-4d5e6f', '2026-07-10', 'AI Governance Office',
    array[
      'استخدم فقط الأدوات المعتمدة ضمن الخطة.',
      'سجّل مصدر كل دليل وتاريخ التقاطه ودرجة جودته.',
      'لا يُعتبر أي دليل مقبولًا تلقائيًا — يبقى بحالة غير مراجَع حتى تُراجعه جهة بشرية.'
    ],
    '{"writeCapability":false,"externalSystemAccess":false,"dataSensitivityHandled":"medium","requiresHumanApproval":false}'::jsonb
  ),
  (
    'source-quality-review', '00000000-0000-0000-0000-000000000001',
    'Source Quality Review', 'مراجعة جودة المصادر', '1.0.0',
    'Assesses the quality, freshness, and provenance of collected evidence before evaluation.',
    'يقيّم جودة الأدلة المجمعة وحداثتها ومصدرها قبل مرحلة التقييم.',
    'INTERNAL', 'internal://nexgegl/skills/source-quality-review@1.0.0', 'quality',
    array['اكتمال جمع الأدلة لخطوة بحثية'], array['demo_calculator'],
    array['low','medium','high'], array[]::text[], false,
    'ANALYSIS', 'REVERSIBLE', false, false, true, false,
    'low', 'APPROVED_FOR_DEMO', true, 'sha256-demo-sqr-7g8h9i', '2026-07-10', 'AI Governance Office',
    array[
      'قيّم كل دليل على أساس الجودة والحداثة ووضوح المصدر.',
      'ارفع أي دليل ناقص الجودة كنقطة ضعف صريحة في التقييم بدل تجاهله.',
      'لا تُحسّن تصنيف الجودة لتفادي نتيجة إصلاح أو تصعيد.'
    ],
    '{"writeCapability":false,"externalSystemAccess":false,"dataSensitivityHandled":"medium","requiresHumanApproval":false}'::jsonb
  ),
  (
    'governance-risk-analysis', '00000000-0000-0000-0000-000000000001',
    'Governance Risk Analysis', 'تحليل مخاطر الحوكمة', '1.0.0',
    'Analyzes collected evidence against governance policy to surface risks, gaps, and required controls.',
    'يحلل الأدلة المجمعة مقابل سياسة الحوكمة لإبراز المخاطر والفجوات والضوابط المطلوبة.',
    'INTERNAL', 'internal://nexgegl/skills/governance-risk-analysis@1.0.0', 'governance',
    array['اكتمال مراجعة جودة المصادر'], array['demo_internal_policy_lookup','demo_calculator'],
    array['low','medium','high'], array[]::text[], true,
    'ANALYSIS', 'REVERSIBLE', false, false, true, true,
    'medium', 'APPROVED_FOR_DEMO', true, 'sha256-demo-gra-1j2k3l', '2026-07-10', 'AI Governance Office',
    array[
      'قارن نتائج الأدلة بسياسة الحوكمة الداخلية وحدد الضوابط الناقصة.',
      'صنّف الخطورة والحاجة لتصعيد أو إصلاح دون إصدار قرار مؤسسي.',
      'لا تفترض وجود صلاحية مؤسسية غير موثقة في الطلب.'
    ],
    '{"writeCapability":false,"externalSystemAccess":false,"dataSensitivityHandled":"high","requiresHumanApproval":true}'::jsonb
  ),
  (
    'decision-packet-drafting', '00000000-0000-0000-0000-000000000001',
    'Decision Packet Drafting', 'صياغة حزمة القرار', '1.0.0',
    'Assembles a draft, preliminary decision packet from the run''s evidence, evaluations, and findings.',
    'يجمّع حزمة قرار تمهيدية من أدلة التشغيل وتقييماته ونتائجه.',
    'INTERNAL', 'internal://nexgegl/skills/decision-packet-drafting@1.0.0', 'reporting',
    array['اكتمال تحليل مخاطر الحوكمة'], array['demo_report_builder'],
    array['low','medium','high'], array[]::text[], false,
    'GENERATION', 'REVERSIBLE', false, false, true, true,
    'medium', 'APPROVED_FOR_DEMO', true, 'sha256-demo-dpd-4m5n6o', '2026-07-10', 'AI Governance Office',
    array[
      'لخّص الأدلة والتقييمات والنتائج بإيجاز تنفيذي.',
      'ضع دائمًا جملة الحدود التنظيمية في نهاية الحزمة.',
      'لا تُصدر توصية نهائية أو قرارًا رسميًا أو حكم KFSA — الحزمة تمهيدية فقط.'
    ],
    '{"writeCapability":false,"externalSystemAccess":false,"dataSensitivityHandled":"medium","requiresHumanApproval":true}'::jsonb
  )
on conflict (id) do nothing;

-- Tools registry (catalog display — mirrors runtime/demo-tools.ts) --------------

insert into public.tools (
  id, organization_id, name, name_ar, description, description_ar, tool_type, system, action_type,
  read_write_class, data_classes, external_access, required_authority, approval_mode, reversible,
  audit_required, max_calls_per_run, enabled, demo_only
)
values
  (
    'demo_web_search', '00000000-0000-0000-0000-000000000001', 'Demo Web Search', 'بحث ويب تجريبي',
    'Simulated web search returning fixed demonstration snippets — no real network access.',
    'بحث ويب محاكى يعيد مقتطفات تجريبية ثابتة — بدون أي وصول فعلي للشبكة.',
    'WEB_SEARCH', 'Demo Search Index', 'READ', 'READ_ONLY', array['low','medium'], false, false, 'NONE', true, true, 4, true, true
  ),
  (
    'demo_document_search', '00000000-0000-0000-0000-000000000001', 'Demo Document Search', 'بحث مستندات تجريبي',
    'Simulated internal document retrieval over a fixed local demonstration corpus.',
    'استرجاع مستندات داخلية محاكى فوق مجموعة مستندات تجريبية محلية ثابتة.',
    'DOCUMENT_RETRIEVAL', 'Demo Document Repository', 'READ', 'READ_ONLY', array['low','medium','high'], false, false, 'NONE', true, true, 4, true, true
  ),
  (
    'demo_internal_policy_lookup', '00000000-0000-0000-0000-000000000001', 'Demo Internal Policy Lookup', 'الاطلاع على السياسات الداخلية (تجريبي)',
    'Simulated lookup against a fixed local snapshot of internal governance policy summaries.',
    'اطلاع محاكى على لقطة محلية ثابتة لملخصات سياسات الحوكمة الداخلية.',
    'INTERNAL_DATA_LOOKUP', 'Demo Policy Repository', 'READ', 'READ_ONLY', array['low','medium'], false, false, 'NONE', true, true, 3, true, true
  ),
  (
    'demo_calculator', '00000000-0000-0000-0000-000000000001', 'Demo Calculator', 'آلة حاسبة تجريبية',
    'Deterministic local arithmetic helper for scoring and aggregation steps.',
    'أداة حسابية محلية حتمية لخطوات الترقيم والتجميع.',
    'CALCULATOR', 'Local', 'ANALYSIS', 'READ_ONLY', array['low'], false, false, 'NONE', true, false, 6, true, true
  ),
  (
    'demo_report_builder', '00000000-0000-0000-0000-000000000001', 'Demo Report Builder', 'منشئ تقارير تجريبي',
    'Assembles collected evidence and findings into a structured draft report — generation only, no external write.',
    'يجمّع الأدلة والنتائج في تقرير مسودة منظم — توليد فقط، بدون أي كتابة خارجية.',
    'REPORT_GENERATOR', 'Local', 'GENERATION', 'READ_ONLY', array['low','medium','high'], false, false, 'PRE_APPROVAL', true, true, 2, true, true
  ),
  (
    'demo_crm_update', '00000000-0000-0000-0000-000000000001', 'Demo CRM Update (Prohibited)', 'تحديث نظام العملاء (ممنوع)',
    'Demonstration of a forbidden tool — a live external write action that this runtime must always refuse to execute.',
    'توضيح لأداة ممنوعة — إجراء كتابة خارجي حي يجب على هذا النظام رفض تنفيذه دائمًا.',
    'WRITE_ACTION', 'CRM Platform', 'WRITE', 'WRITE', array['medium','high'], true, true, 'FORBIDDEN', false, true, 0, false, true
  )
on conflict (id) do nothing;

-- Plugin foundation: ai-governance pilot plugin ------------------------------

insert into public.plugin_definitions (plugin_id, name, domain, description, status, production_approval_status, owner, required_platform_version, constitutional_reference)
values (
  'ai-governance',
  '{"en":"AI Governance","ar":"حوكمة الذكاء الاصطناعي"}'::jsonb,
  'ai_governance',
  '{"en":"Institutional AI governance capability: intake, qualification, vendor review, evidence collection, risk assessment, promotion-request preparation.","ar":"قدرة حوكمة الذكاء الاصطناعي المؤسسية: استقبال، تأهيل، مراجعة موردين، جمع أدلة، تقييم مخاطر، وإعداد طلبات ترقية."}'::jsonb,
  'experimental',
  false,
  'AI Governance Office',
  '>=0.1.0',
  array[
    'claude-operating-system/00-master-standards/KFSA_VOCABULARY_MAP_v1_1.md',
    'claude-operating-system/02-product-profiles/sdgm-kfsa/CLAUDE.sdgm-kfsa.md'
  ]
)
on conflict (plugin_id) do nothing;

insert into public.plugin_versions (id, plugin_id, version, manifest)
values (
  '00000000-0000-0000-0000-000000007001',
  'ai-governance',
  '0.1.0',
  '{"plugin_id":"ai-governance","version":"0.1.0","status":"experimental","production_approval_status":false}'::jsonb
)
on conflict (plugin_id, version) do nothing;

insert into public.plugin_installations (organization_id, plugin_id, plugin_version_id, state, installed_at)
values (
  '00000000-0000-0000-0000-000000000001',
  'ai-governance',
  '00000000-0000-0000-0000-000000007001',
  'installed',
  now()
)
on conflict (organization_id, plugin_id) do nothing;

-- Connectors -------------------------------------------------------------------

insert into public.connector_definitions (id, organization_id, connector_id, connector_type, status, allowed_operations, denied_operations, data_classifications, credential_scope)
values
  ('00000000-0000-0000-0000-000000008001', '00000000-0000-0000-0000-000000000001', 'supabase-internal', 'internal_database', 'enabled', array['read'], array['write','delete','schema_change'], array['low','medium','high'], 'server_only_anon_key_rls_scoped'),
  ('00000000-0000-0000-0000-000000008002', '00000000-0000-0000-0000-000000000001', 'document-repository-placeholder', 'document_repository', 'not_configured', array['read'], array['write','delete'], array['low','medium','high'], 'not_applicable_placeholder'),
  ('00000000-0000-0000-0000-000000008003', '00000000-0000-0000-0000-000000000001', 'http-api-placeholder', 'approved_http_api', 'not_configured', array['read'], array['write','delete'], array['low','medium'], 'not_applicable_placeholder')
on conflict (organization_id, connector_id) do nothing;

insert into public.plugin_connector_permissions (organization_id, plugin_id, connector_id, allowed)
values (
  '00000000-0000-0000-0000-000000000001',
  'ai-governance',
  '00000000-0000-0000-0000-000000008001',
  true
)
on conflict (organization_id, plugin_id, connector_id) do nothing;

-- Skills (extends the existing skills table with the ai-governance rows) ------

insert into public.skills (
  id, organization_id, name, name_ar, version, description, description_ar, source_type, source_reference,
  category, trigger_conditions, required_tools, allowed_data_classes, prohibited_data_classes, required_authority,
  action_type, reversibility, external_system_access, write_capability, audit_required, human_approval_required,
  risk_level, review_status, approved_for_use, checksum, last_reviewed, reviewer, instructions, risk_profile,
  plugin_id, execution_status, required_profile_fields, permitted_connectors, escalation_conditions
)
values
  (
    'ai-governance.ai-inventory-intake', '00000000-0000-0000-0000-000000000001',
    'AI Inventory Intake', 'استقبال سجل الذكاء الاصطناعي', '0.1.0',
    'Registers a new AI use case into the AI Inventory as a preliminary candidate awaiting governance qualification.',
    'يسجّل حالة استخدام جديدة في سجل الذكاء الاصطناعي كمرشح تمهيدي بانتظار التأهيل الحوكمي.',
    'INTERNAL', 'internal://nexgegl/plugins/ai-governance/skills/ai-inventory-intake@0.1.0', 'intake',
    array['طلب تسجيل أصل ذكاء اصطناعي جديد'], array[]::text[], array['low','medium','high'], array[]::text[], false,
    'WRITE', 'IRREVERSIBLE', false, true, true, false,
    'low', 'APPROVED_FOR_DEMO', true, 'sha256-plugin-ai-inv-intake-v0.1.0', '2026-07-19', 'AI Governance Office',
    array['اجمع الحقول المسموحة فقط.', 'لا تحدد حالة الحوكمة أو نتيجة التقييم أو موافقة الإنتاج — القيم الافتراضية محايدة دائمًا.'],
    '{"writeCapability":true,"externalSystemAccess":false,"dataSensitivityHandled":"medium","requiresHumanApproval":false}'::jsonb,
    'ai-governance', 'implemented', array['ai_governance_owner','risk_appetite'], array['supabase-internal'],
    array['risk_level = high and evidence incomplete','data_sensitivity = high without owner confirmation']
  ),
  (
    'ai-governance.ai-use-case-qualification', '00000000-0000-0000-0000-000000000001',
    'AI Use Case Qualification', 'تأهيل حالة استخدام الذكاء الاصطناعي', '0.1.0',
    'Qualifies a raw AI inventory signal against governance criteria to produce a qualification summary.',
    'يؤهّل إشارة سجل ذكاء اصطناعي خام مقابل معايير الحوكمة لإنتاج ملخص تأهيل.',
    'INTERNAL', 'internal://nexgegl/plugins/ai-governance/skills/ai-use-case-qualification@0.1.0', 'qualification',
    array['اكتمال استقبال حالة استخدام'], array[]::text[], array['low','medium','high'], array[]::text[], false,
    'ANALYSIS', 'REVERSIBLE', false, false, true, false,
    'medium', 'UNDER_REVIEW', false, 'sha256-plugin-ai-uc-qual-v0.1.0', '2026-07-19', 'AI Governance Office',
    array['لا يوجد منفّذ تنفيذ في هذا الإصدار.'],
    '{"writeCapability":false,"externalSystemAccess":false,"dataSensitivityHandled":"medium","requiresHumanApproval":false}'::jsonb,
    'ai-governance', 'not_implemented', array['ai_governance_owner','risk_appetite','escalation_threshold_risk_level'], array['supabase-internal'],
    array['risk_level >= escalation_threshold_risk_level']
  ),
  (
    'ai-governance.ai-vendor-review', '00000000-0000-0000-0000-000000000001',
    'AI Vendor Review', 'مراجعة مورّد الذكاء الاصطناعي', '0.1.0',
    'Reviews a vendor record against the organization''s approved-connector and approved-model lists.',
    'يراجع سجل مورّد مقابل قوائم الموصلات والنماذج المعتمدة للمؤسسة.',
    'INTERNAL', 'internal://nexgegl/plugins/ai-governance/skills/ai-vendor-review@0.1.0', 'vendor_review',
    array['إضافة أو تحديث مورّد ذكاء اصطناعي'], array[]::text[], array['low','medium','high'], array[]::text[], false,
    'ANALYSIS', 'REVERSIBLE', false, false, true, false,
    'medium', 'UNDER_REVIEW', false, 'sha256-plugin-ai-vendor-review-v0.1.0', '2026-07-19', 'AI Governance Office',
    array['لا يوجد منفّذ تنفيذ في هذا الإصدار.'],
    '{"writeCapability":false,"externalSystemAccess":false,"dataSensitivityHandled":"medium","requiresHumanApproval":false}'::jsonb,
    'ai-governance', 'not_implemented', array['approved_connector_ids','approved_models','risk_appetite'], array['supabase-internal'],
    array['vendor.risk_tier = high','vendor.contract_status = expired']
  ),
  (
    'ai-governance.evidence-collection', '00000000-0000-0000-0000-000000000001',
    'Evidence Collection', 'جمع الأدلة', '0.1.0',
    'Collects evidence items from approved read-only connectors within a use case''s evidence requirements.',
    'يجمع عناصر أدلة من الموصلات المعتمدة للقراءة فقط ضمن متطلبات الأدلة لحالة الاستخدام.',
    'INTERNAL', 'internal://nexgegl/plugins/ai-governance/skills/evidence-collection@0.1.0', 'evidence',
    array['وجود حالة استخدام تتطلب أدلة موثقة'], array[]::text[], array['low','medium','high'], array[]::text[], false,
    'READ', 'REVERSIBLE', false, false, true, false,
    'low', 'UNDER_REVIEW', false, 'sha256-plugin-evidence-collection-v0.1.0', '2026-07-19', 'AI Governance Office',
    array['لا يوجد منفّذ تنفيذ في هذا الإصدار.'],
    '{"writeCapability":false,"externalSystemAccess":false,"dataSensitivityHandled":"medium","requiresHumanApproval":false}'::jsonb,
    'ai-governance', 'not_implemented', array['evidence_requirements'], array['supabase-internal','document-repository-placeholder'],
    array['required evidence type unavailable from any permitted connector']
  ),
  (
    'ai-governance.governance-risk-assessment', '00000000-0000-0000-0000-000000000001',
    'Governance Risk Assessment', 'تقييم مخاطر الحوكمة', '0.1.0',
    'Analyzes a use case''s evidence against the domain profile to surface a risk assessment and control gaps.',
    'يحلل أدلة حالة الاستخدام مقابل الملف النطاقي لإبراز تقييم مخاطر وفجوات الضوابط.',
    'INTERNAL', 'internal://nexgegl/plugins/ai-governance/skills/governance-risk-assessment@0.1.0', 'risk_assessment',
    array['اكتمال جمع الأدلة'], array[]::text[], array['low','medium','high'], array[]::text[], true,
    'ANALYSIS', 'REVERSIBLE', false, false, true, true,
    'medium', 'UNDER_REVIEW', false, 'sha256-plugin-gov-risk-assess-v0.1.0', '2026-07-19', 'AI Governance Office',
    array['لا يوجد منفّذ تنفيذ في هذا الإصدار.'],
    '{"writeCapability":false,"externalSystemAccess":false,"dataSensitivityHandled":"high","requiresHumanApproval":true}'::jsonb,
    'ai-governance', 'not_implemented', array['risk_appetite','prohibited_ai_uses','restricted_data_classifications','escalation_threshold_risk_level'], array['supabase-internal'],
    array['identified use falls within prohibited_ai_uses','risk_level >= escalation_threshold_risk_level']
  ),
  (
    'ai-governance.promotion-request-preparation', '00000000-0000-0000-0000-000000000001',
    'Promotion Request Preparation', 'إعداد طلب الترقية', '0.1.0',
    'Assembles a Promotion Request draft from evidence packages and a risk assessment for submission toward KFSA Ingress.',
    'يجمّع مسودة طلب ترقية من حزم الأدلة وتقييم المخاطر للتقديم نحو مدخل KFSA.',
    'INTERNAL', 'internal://nexgegl/plugins/ai-governance/skills/promotion-request-preparation@0.1.0', 'promotion',
    array['اكتمال تقييم مخاطر الحوكمة'], array[]::text[], array['low','medium','high'], array[]::text[], true,
    'GENERATION', 'REVERSIBLE', false, false, true, true,
    'medium', 'UNDER_REVIEW', false, 'sha256-plugin-promo-req-prep-v0.1.0', '2026-07-19', 'AI Governance Office',
    array['لا يوجد منفّذ تنفيذ في هذا الإصدار كمهارة مستقلة — انظر lib/plugins/promotion-request-composer.ts للمسار العام المطبَّق.'],
    '{"writeCapability":false,"externalSystemAccess":false,"dataSensitivityHandled":"medium","requiresHumanApproval":true}'::jsonb,
    'ai-governance', 'not_implemented', array['ai_governance_owner','human_review_required'], array['supabase-internal'],
    array['evidence_status incomplete','authority_status not confirmed']
  )
on conflict (id) do nothing;

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
