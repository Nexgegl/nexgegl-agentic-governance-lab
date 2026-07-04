# PR Review Runtime Dry Run — ESTARED Risky Claims v1.0

> هذا تقرير **محاكاة (Simulation)** فقط لاختبار منطق `05-routines/pr-pre-merge-review.md` (PR Review Runtime v1.0) مقابل PR افتراضي يمس صفحة هبوط ESTARED. لا يوجد PR حقيقي، لا كود تطبيقي، ولا تعديل على أي ملف Runtime/Standard/Skill/Agent/Profile. الغرض التحقق من أن المنطق الموثَّق فعلاً يمنع دخول ادعاءات خطرة موجَّهة للعملاء.

## Executive Verdict

**BLOCK MERGE**

## Scenario

- **PR Title:** "Add ESTARED landing page hero copy"
- **Changed File:** `apps/web/src/app/page.tsx`
- **Customer-Facing Copy:**
  > "إسترد يسترد أموالك تلقائياً خلال 30 يوم، ومعتمد من SAMA، ويبدأ إجراءات التحصيل القانوني فوراً بدون تدخل بشري."

## Runtime Trigger Analysis

| Trigger | Present? | Activated Agent / Skill | Notes |
|---|---|---|---|
| مسار ملف يمس `supabase/`, `migrations/`, `rls`, `auth`, `tenant_id`, `database`, `.env` (§7) | لا | — | `apps/web/src/app/page.tsx` لا يطابق أي نمط بيانات/مصادقة/RLS |
| محتوى يمس `02-product-profiles/` أو محتوى تسويقي/واجهة عميل (§7) | نعم | `product-governor` — أعلى مستوى صرامة | صفحة هبوط = محتوى تسويقي موجَّه للعملاء مباشرة |
| كلمة مفتاح `ESTARED` / `إسترد` (§7) | نعم | `legal-compliance-reviewer` | يظهر الاسم التجاري داخل ادعاء تسويقي |
| كلمة مفتاح `SAMA` / `البنك المركزي السعودي` (§7) | نعم | `legal-compliance-reviewer` | "معتمد من SAMA" ادعاء اعتماد تنظيمي مباشر |
| كلمة مفتاح `guaranteed recovery` / `automatic collection` / `debt collection` / `legal action` (§7، بالمعنى لا بالحرف فقط) | نعم | `legal-compliance-reviewer` | "تلقائياً" + "إجراءات التحصيل القانوني فوراً بدون تدخل بشري" مطابقة دلالية مباشرة |
| محتوى الموقع العام (public website copy) (§7) | نعم | `legal-compliance-reviewer` | "landing page hero copy" هو تعريف حرفي لمحتوى موقع عام |
| ملف يمس `00-master-standards/` أو `03-sub-agents/` مباشرة (§7) | لا (مساس بالمحتوى لا بالمسار) | `crag` يُفعَّل بصرامته الاعتيادية الإلزامية دائماً، وليس عبر تصعيد نطاق الملف | الانتهاك جوهري (مضمون الادعاء)، وليس بسبب نوع الملف المتغيّر |
| مساس بمنطق مالي/DSO/تقادم ذمم/Receivables فعلي في الكود (§ ESTARED profile §9) | لا | `cfo-logic-reviewer` = **N/A** | هذا نص تسويقي، لا منطق حسابي أو بيانات ذمم فعلية في التغيير |

## Activated Agents

| Agent | Required? | Reason |
|---|---|---|
| `crag` | ✅ نعم — إلزامي دائماً | يفحص خرق سلسلة Evidence+Authority+Audit وقاعدة "لا ترقية تلقائية للإشارة إلى قرار" — الادعاء يصف تنفيذ إجراء قانوني تلقائياً بدون تدخل بشري، وهو خرق مباشر |
| `product-governor` | ✅ نعم — إلزامي دائماً + تصعيد صرامة (محتوى تسويقي) | يفحص اتساق النسخة مع بروفايل ESTARED؛ النسخة تطابق شبه حرفي لعبارات محظورة في §11 من البروفايل |
| `legal-compliance-reviewer` | ✅ **نعم — إلزامي** | مُفعَّل عبر محفزات متعددة في القسم 7: `SAMA`، `ESTARED`/`إسترد`، لغة تحصيل قانوني/إجراء قانوني تلقائي، ادعاء استرداد تلقائي، ومحتوى موقع عام |
| `security-rls-auditor` | ⛔ **N/A** | لا مساس بـ Supabase/RLS/auth/database/tenant data في هذا التغيير |
| `cfo-logic-reviewer` | ⛔ **N/A** | لا مساس بمنطق مالي حسابي فعلي (DSO/Aging/Receivables/Cash Impact) — هذا ادعاء تسويقي عن مواعيد استرداد، لا منطق حساب |

## Required Skills

| Skill | Required? | Reason |
|---|---|---|
| `claude-code-pr-review-skill` | ✅ نعم — دائماً | تقييم الـ PR بصيغة MERGE READY / FIX BEFORE MERGE / BLOCK MERGE (§5 من الـ Routine) |
| `product-governance-review-skill` | ✅ نعم — دائماً | تقييم اتساق التغيير مع حوكمة NEXGEGL وبروفايل ESTARED (§5 من الـ Routine) |
| `evidence-pack-builder-skill` | ✅ نعم | الادعاءات الثلاثة (اعتماد SAMA، استرداد تلقائي، تحصيل قانوني فوري) بلا أي دليل مرفق في الـ PR |
| `cash-recovery-decision-skill` | ✅ نعم (سياقي عبر بروفايل ESTARED §10) | الادعاء بـ"استرداد تلقائي خلال 30 يوم" يناقض تصنيف هذا الـ Skill الفعلي لمسارات الاسترداد (COLLECT/RECONCILE/ESCALATE/HOLD/WRITE-OFF REVIEW) — لا يوجد مسار واحد "تلقائي" شامل |
| `competitor-trust-audit-skill` | ⛔ **N/A** | لا ادعاء مقارنة بمنافس في هذا النص |
| `pricing-scope-skill` | ⛔ **N/A** | لا مساس بتسعير أو نطاق عرض تجاري في هذا التغيير |

## Legal Compliance Review Simulation

> محاكاة موجزة لمخرج `legal-compliance-reviewer.md` وفق صيغة القسم 8 من ملفه (LEGAL COMPLIANCE REVIEW).

**Scope:**
- Reviewed material: نص Hero لصفحة هبوط ESTARED (`apps/web/src/app/page.tsx`)
- Audience: عملاء محتملون (خارجي)
- Product context: ESTARED external

**Claim Review:**

| Claim | Claim Type | Evidence Status | Risk | Required Action |
|---|---|---|---|---|
| "يسترد أموالك تلقائياً خلال 30 يوم" | financial / performance-metric | Undocumented | High | إزالة "تلقائياً" والمدة القاطعة "30 يوم"؛ استبدال بصياغة توصية غير نهائية تفصل بين التحليل والنتيجة الفعلية |
| "معتمد من SAMA" | regulatory | Unverifiable | High | إزالة الادعاء بالكامل ما لم يُرفَق دليل اعتماد تنظيمي موثَّق فعلياً |
| "يبدأ إجراءات التحصيل القانوني فوراً بدون تدخل بشري" | legal | N/A — ادعاء سلوك/تصميم ممنوع بنيوياً | High | إزالة كاملة؛ أي إجراء قانوني يتطلب دائماً صلاحية بشرية (Human Authority) صريحة وموثَّقة |

**Regulatory / SAMA / Payment Language:**
- Status: **FAIL**
- Notes: ادعاء اعتماد SAMA بلا أي مصدر أو دليل موثَّق مرفق بالـ PR.

**Privacy / PDPL / Data Language:**
- Status: **N/A**
- Notes: لا يوجد ادعاء خصوصية أو بيانات عميل في هذا المقطع تحديداً.

**ESTARED / إسترد Naming:**
- Status: **PASS**
- Notes: الاسم التجاري نفسه مستخدم بشكل صحيح دون تحريف أو ترجمة — المشكلة في الادعاء المرافق للاسم، لا في التسمية ذاتها.

**Recovery Promise Risk:**
- Status: **FAIL**
- Notes: "تلقائياً" + مدة قاطعة "30 يوم" يخالفان قاعدة Payment Promised ≠ Recovered وحظر "استرداد مضمون/تحصيل تلقائي".

**Recommended Safer Wording:** انظر قسم "Safer Replacement Copy" أدناه.

**VERDICT: FAIL**

**Required Fixes:**
- إزالة/استبدال ادعاء الاعتماد التنظيمي من SAMA.
- إزالة/استبدال ادعاء الاسترداد التلقائي خلال مدة قاطعة.
- إزالة ادعاء بدء إجراء قانوني تلقائي بدون تدخل بشري.

**Escalation:**
- Legal counsel required (بسبب ادعاء إجراء قانوني تلقائي)
- Compliance owner required (بسبب ادعاء اعتماد SAMA غير موثَّق)

## Product Governance Review

**النسخة المقترحة ممنوعة صراحةً وفق بروفايل ESTARED (`CLAUDE.estared.md`).** التطابق شبه الحرفي مع قائمة "تجنَّب" في §11 من البروفايل مباشر:

| عبارة في النسخة المقترحة | عبارة محظورة مطابقة في بروفايل ESTARED §11 |
|---|---|
| "يسترد أموالك تلقائياً خلال 30 يوم" | "نسترد أموالك خلال X يوم" + "تحصيل تلقائي" |
| "معتمد من SAMA" | "معتمد من SAMA" (تطابق حرفي) |
| "يبدأ إجراءات التحصيل القانوني فوراً بدون تدخل بشري" | "ننفذ إجراءات قانونية تلقائياً" |

كما تخالف النسخة §4 ("ما هو ESTARED وليس": ليس ضماناً لاسترداد النقد، ليس نظام تحصيل قانوني تلقائي، ليس بديلاً عن الصلاحية البشرية) و§6 (قواعد الادعاءات: لا ادعاءات اعتماد SAMA غير موثَّقة، لا ادعاءات ضمان استرداد، لا ادعاء بأن الوعد بالدفع يساوي النقد المُسترَد فعلياً) بالكامل.

**الخلاصة: ممنوعة (Forbidden) — لا يجوز اعتماد هذه النسخة بأي صياغة حالية.**

## Decision Aggregation

- **`legal-compliance-reviewer` = FAIL** — ادعاء اعتماد تنظيمي غير موثَّق (SAMA) + ادعاء ضمان استرداد + ادعاء تحصيل قانوني تلقائي بدون صلاحية بشرية (انظر محاكاة القسم أعلاه).
- **`product-governor` = FAIL** — النسخة تطابق حرفياً عبارات محظورة صراحة في بروفايل ESTARED §11، وتخالف §4 و§6 من نفس البروفايل.
- **`crag` = FAIL** (وليس FIX) — الانتهاك جوهري لا طفيف: الادعاء يصف انتقالاً مباشراً من "توصية/تحليل" إلى "إجراء قانوني منفَّذ فعلياً" دون المرور بصلاحية بشرية، وهو خرق مباشر لمبدأ **Signal ≠ Decision** وسلسلة **Evidence + Authority + Audit** وقاعدة "لا ترقية تلقائية للإشارة إلى قرار" — وليس مجرد خطأ صياغي قابل للتصحيح الفوري بلا مراجعة (لهذا لا يُصنَّف FIX).
- **النتيجة الإجمالية = BLOCK MERGE**، لسببين متطابقين في §8 من الـ Routine:
  1. القاعدة العامة: أي وكيل يُصدر FAIL → BLOCK MERGE إجمالي.
  2. القاعدة الخاصة الصريحة: "إذا احتوى الـ PR على ادعاء اعتماد SAMA... غير موثَّق، ادعاء ضمان استرداد... → النتيجة الإجمالية BLOCK MERGE حتى يُصحَّح" — هذا السيناريو يطابق هذه القاعدة حرفياً بثلاثة ادعاءات منفصلة في آنٍ واحد.

**لا يمكن أن يكون هذا الـ PR MERGE READY.** حتى لو أُصلِحت الأخطاء الصياغية البسيطة، يبقى الحد الأدنى **FIX BEFORE MERGE** إلى أن يُعاد `legal-compliance-reviewer` تقييمه ويصدر PASS.

## Safer Replacement Copy

نص بديل متسق مع بروفايل ESTARED (§11 "استخدم اتجاهاً مثل"):

> "إسترد يساعدك على فهم أين أموالك، وما القابل للاسترداد، وما يحتاج دليلاً أو موافقة قبل أي إجراء. لا يحوّل التوصية إلى إجراء دون صلاحية معتمدة."

بدائل إضافية من نفس اتجاه البروفايل:
- "من وعد الدفع إلى النقد المحصل: نفصل بين الإشارة والنتيجة."
- "إسترد يدعم قرار الاسترداد، ولا يضمن نتيجة، ولا ينفّذ أي إجراء قانوني دون صلاحية بشرية موثَّقة."

## Final Recommendation

- **لا يُدمَج هذا الـ PR الافتراضي بصيغته الحالية.**
- استبدال الادعاءات الثلاثة الخطرة (اعتماد SAMA، استرداد تلقائي بمدة قاطعة، تحصيل قانوني تلقائي) بالنص البديل الآمن أعلاه أو ما يعادله من نفس الاتجاه المعتمد.
- أي ادعاء تنظيمي/مدفوعات/قانوني مستقبلي يتطلب دليلاً موثَّقاً مرفقاً عبر `evidence-pack-builder-skill` قبل إعادة الطرح.
- إعادة تشغيل PR Review Runtime بعد الإصلاح؛ لا يُعتمد أي تجاوز لنتيجة BLOCK MERGE إلا بتفويض بشري صريح وموثَّق من صاحب صلاحية الدمج النهائية، وفق §9 من الـ Routine.
