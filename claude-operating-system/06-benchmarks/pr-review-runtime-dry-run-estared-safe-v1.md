# PR Review Runtime Dry Run — ESTARED Safe Claims v1.0

> هذا تقرير **محاكاة (Simulation)** فقط لاختبار منطق `05-routines/pr-pre-merge-review.md` (PR Review Runtime v1.0) مقابل PR افتراضي يمس صفحة هبوط ESTARED بنسخة **آمنة** ومتوافقة مع اتجاه الرسالة المعتمد. لا يوجد PR حقيقي، لا كود تطبيقي، ولا تعديل على أي ملف Runtime/Standard/Skill/Agent/Profile. الغرض التحقق من أن المنطق الموثَّق فعلاً **يسمح** بنسخة سليمة عند نجاح المراجعة القانونية/الامتثالية، لا أن يمنع كل شيء تلقائياً — هذا التقرير مكمِّل لـ `pr-review-runtime-dry-run-estared-v1.md` (السيناريو الخطر).

## Executive Verdict

**MERGE READY**

## Scenario

- **PR Title:** "Add safe ESTARED landing page hero copy"
- **Changed File:** `apps/web/src/app/page.tsx`
- **Customer-Facing Copy:**
  > "إسترد يساعدك على فهم أين أموالك، وما القابل للاسترداد، وما يحتاج دليلاً أو موافقة قبل أي إجراء."

## Runtime Trigger Analysis

| Trigger | Present? | Activated Agent / Skill | Notes |
|---|---|---|---|
| مسار ملف يمس `supabase/`, `migrations/`, `rls`, `auth`, `tenant_id`, `database`, `.env` (§7) | لا | — | `apps/web/src/app/page.tsx` لا يطابق أي نمط بيانات/مصادقة/RLS |
| محتوى يمس `02-product-profiles/` أو محتوى تسويقي/واجهة عميل (§7) | نعم | `product-governor` — أعلى مستوى صرامة (كالمعتاد، إلزامي دائماً) | صفحة هبوط = محتوى تسويقي موجَّه للعملاء مباشرة |
| كلمة مفتاح `ESTARED` / `إسترد` (§7) | نعم | `legal-compliance-reviewer` | الاسم التجاري يظهر في النص؛ التفعيل قائم على وجود الكلمة المفتاحية، بصرف النظر عن مستوى الخطورة |
| محتوى الموقع العام (public website copy) (§7) | نعم | `legal-compliance-reviewer` | "landing page hero copy" تعريف حرفي لمحتوى موقع عام |
| كلمة مفتاح `SAMA` / `regulatory approval` / `payment` / `banking` / `debt collection` / `legal action` / `guaranteed recovery` / `automatic collection` (§7) | **لا** | — | لا يظهر أي من هذه الكلمات المحفزة في النص |
| مساس بمنطق مالي/DSO/تقادم ذمم/Receivables فعلي في الكود (§ ESTARED profile §9) | لا | `cfo-logic-reviewer` = **N/A** | نص تسويقي عام، لا منطق حسابي أو بيانات ذمم فعلية |
| مساس ببيانات عميل/مصادقة/قاعدة بيانات/RLS (§ ESTARED profile §9) | لا | `security-rls-auditor` = **N/A** | لا صلة بطبقة البيانات أو المصادقة في هذا التغيير |

## Activated Agents

| Agent | Required? | Reason |
|---|---|---|
| `crag` | ✅ نعم — إلزامي دائماً | يفحص فصل Signal/Decision وسلسلة Evidence+Authority+Audit؛ النص نفسه يُبقي الفصل سليماً ("يحتاج دليلاً أو موافقة قبل أي إجراء") |
| `product-governor` | ✅ نعم — إلزامي دائماً | يفحص اتساق النسخة مع بروفايل ESTARED؛ النسخة تطابق تقريباً حرفياً اتجاه الرسالة المعتمد في §11 |
| `legal-compliance-reviewer` | ✅ **نعم — مُفعَّل** (عبر كلمة `ESTARED/إسترد` ومحتوى موقع عام في §7) | التفعيل إلزامي لأن النص يحمل اسم العلامة التجارية ومحتوى عام موجَّه للعملاء — **التفعيل لا يعني FAIL تلقائياً**؛ هنا يُتوقَّع PASS لأن لا ادعاء خطر موجود |
| `security-rls-auditor` | ⛔ **N/A** | لا مساس بـ Supabase/RLS/auth/database/tenant data |
| `cfo-logic-reviewer` | ⛔ **N/A** | لا مساس بمنطق حسابي مالي فعلي (DSO/Aging/Receivables/Cash Impact) |

## Required Skills

| Skill | Required? | Reason |
|---|---|---|
| `claude-code-pr-review-skill` | ✅ نعم — دائماً | تقييم الـ PR بصيغة MERGE READY / FIX BEFORE MERGE / BLOCK MERGE (§5 من الـ Routine) |
| `product-governance-review-skill` | ✅ نعم — دائماً | تقييم اتساق التغيير مع حوكمة NEXGEGL وبروفايل ESTARED (§5 من الـ Routine) |
| `evidence-pack-builder-skill` | ⛔ **N/A** | لا يوجد ادعاء واقعي/تنظيمي/مقياس رقمي يستلزم إرفاق دليل — النص عبارة قيمة عامة (Value Proposition) لا رقم أو اعتماد محدد |
| `cash-recovery-decision-skill` | ⛔ **N/A** (سياقي) | لا تغيير في منطق أو تصنيف قرار الاسترداد نفسه — النص يذكر "القابل للاسترداد" بشكل عام دون الادعاء بآلية أو مسار تحصيل محدد |
| `competitor-trust-audit-skill` | ⛔ **N/A** | لا ادعاء مقارنة بمنافس |
| `pricing-scope-skill` | ⛔ **N/A** | لا مساس بتسعير أو نطاق عرض تجاري |

## Legal Compliance Review Simulation

> محاكاة موجزة لمخرج `legal-compliance-reviewer.md` وفق صيغة القسم 8 من ملفه (LEGAL COMPLIANCE REVIEW).

**Scope:**
- Reviewed material: نص Hero لصفحة هبوط ESTARED (`apps/web/src/app/page.tsx`)
- Audience: عملاء محتملون (خارجي)
- Product context: ESTARED external

**Claim Review:**

| Claim | Claim Type | Evidence Status | Risk | Required Action |
|---|---|---|---|---|
| "إسترد يساعدك على فهم أين أموالك" | product capability | N/A — عبارة قيمة عامة، ليست ادعاءً واقعياً قابلاً للقياس | Low | لا إجراء |
| "ما القابل للاسترداد" | product capability / نطاق تحليل | N/A — وصف نطاق التحليل، لا رقم أو ضمان محدد | Low | لا إجراء |
| "ما يحتاج دليلاً أو موافقة قبل أي إجراء" | governance / process statement | N/A — بيان حوكمي يُحصِّن الفصل بين التوصية والقرار | Low | لا إجراء — هذه العبارة **تُحصِّن** الامتثال، لا تُهدِّده |

**Regulatory / SAMA / Payment Language:**
- Status: **N/A**
- Notes: لا يوجد أي ادعاء اعتماد تنظيمي، مدفوعات، أو مصرفي في هذا النص.

**Privacy / PDPL / Data Language:**
- Status: **N/A**
- Notes: لا يوجد ادعاء خصوصية أو بيانات عميل.

**ESTARED / إسترد Naming:**
- Status: **PASS**
- Notes: الاسم التجاري مستخدم بشكل صحيح وثابت دون تحريف أو ترجمة أو اختصار غير معتمد.

**Recovery Promise Risk:**
- Status: **PASS**
- Notes: لا يوجد وعد بنتيجة، لا مدة قاطعة، لا كلمة "تلقائي" أو "مضمون" — النص يفصل صراحة بين التحليل وما يتطلب دليلاً/موافقة.

**Recommended Safer Wording:** لا حاجة — انظر قسم "Optional Safer Replacement Copy" أدناه لتحسين أسلوبي اختياري فقط.

**VERDICT: PASS**

**Required Fixes:**
- لا يوجد.

**Escalation:**
- None.

**ملاحظات مطلوبة (مطابقة لمعايير القبول):**
- لا ادعاء اعتماد SAMA/تنظيمي.
- لا ادعاء ضمان استرداد.
- لا ادعاء إجراء قانوني.
- لا ادعاء تحصيل تلقائي.
- الصلاحية البشرية محفوظة صراحة عبر عبارة "موافقة قبل أي إجراء".

## Product Governance Review

**هذه النسخة مسموح بها صراحةً وفق بروفايل ESTARED (`CLAUDE.estared.md`).**

- **الاسم التجاري:** "إسترد" مستخدم بشكل صحيح دون أي تحريف (§1، §5 من البروفايل).
- **اتساق مع اتجاه الرسالة المعتمد (§11):** النص يطابق تقريباً حرفياً أول عبارة "استخدم اتجاهاً مثل" في البروفايل: *"نساعدك تفهم أين أموالك، وما القابل للاسترداد، وما يحتاج دليل أو موافقة قبل أي إجراء."*
- **لا مطابقة لأي عبارة من قائمة "تجنَّب" (§11):** لا "استرداد مضمون"، لا "تحصيل تلقائي"، لا "معتمد من SAMA"، لا مدة قاطعة "خلال X يوم"، لا "ننفذ إجراءات قانونية تلقائياً".
- **اتساق مع §4 (ما هو ESTARED وليس) و§6 (قواعد الادعاءات):** النص لا يضمن استرداداً، لا يدّعي ترخيصاً، ولا يستبدل الصلاحية البشرية — بل يؤكدها صراحة.

**الخلاصة: هذه النسخة متسقة تماماً مع اتجاه الرسالة المعتمد لـ ESTARED ولا تخالف أي عبارة محظورة.**

## Decision Aggregation

- **`legal-compliance-reviewer` = PASS** — لا ادعاء غير موثَّق، لا مخاطرة استرداد/تحصيل/قانونية، تسمية سليمة.
- **`product-governor` = PASS** — النسخة تطابق اتجاه الرسالة المعتمد ولا تخالف أي عبارة محظورة في بروفايل ESTARED.
- **`crag` = PASS** — لا خرق لفصل Signal/Decision ولا لسلسلة Evidence+Authority+Audit؛ العبارة "يحتاج دليلاً أو موافقة قبل أي إجراء" تُحصِّن هذا الفصل بدل أن تخرقه.
- **`security-rls-auditor` = N/A** — لا مساس بالبيانات/المصادقة/RLS.
- **`cfo-logic-reviewer` = N/A** — لا مساس بمنطق مالي حسابي فعلي.
- **النتيجة الإجمالية = MERGE READY**، لأن كل المراجعات المطلوبة (`crag`، `product-governor`، `legal-compliance-reviewer`) أصدرت PASS، ولا يوجد أي وكيل بنتيجة FAIL/FIX يفرض خفض النتيجة وفق §8 من الـ Routine.

> **ملاحظة حاسمة:** `MERGE READY` هنا يبقى **توصية مراجعة (Recommendation)** فقط، **وليس تفويضاً آلياً للدمج (Automatic Merge Authorization)** — وفق §9 (Final Merge Authority) من `pr-pre-merge-review.md`. الدمج الفعلي يتطلب صاحب صلاحية بشري أو Automation مصرَّح له صراحة في سياسة المستودع المحلية، ولا ينفِّذ أي وكيل AI أو هذا الـ Routine الدمج تلقائياً بذاته.

## Optional Safer Replacement Copy

**لا حاجة لاستبدال — النص آمن ومعتمد كما هو.**

تحسين أسلوبي اختياري (لا يغيّر المعنى، لمجرد الصقل اللغوي):

> "إسترد يساعدك على فهم أين أموالك، وما القابل للاسترداد فعلياً، وما يحتاج دليلاً أو موافقة معتمدة قبل اتخاذ أي إجراء."

(إضافة "فعلياً" و"معتمدة" هنا توضيح أسلوبي اختياري فقط، وليس إصلاحاً إلزامياً.)

## Final Recommendation

- يجوز لهذا الـ PR الافتراضي المضي قدماً نحو الموافقة البشرية/موافقة مالك الكود (Code Owner Approval) الاعتيادية.
- **لا يُمنح أي تفويض دمج آلي.** `MERGE READY` توصية تشغيلية فقط.
- إعادة تشغيل PR Review Runtime إذا تغيّرت النسخة النصية لاحقاً، حتى لو كان التغيير طفيفاً في الظاهر.
