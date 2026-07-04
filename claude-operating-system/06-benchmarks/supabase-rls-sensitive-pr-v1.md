# Supabase RLS Sensitive PR Benchmark v1.0

> هذا تقرير **محاكاة (Simulation)** فقط لاختبار منطق `05-routines/pr-pre-merge-review.md` (PR Review Runtime v1.0) مقابل PR افتراضي يعطِّل Row-Level Security (RLS) على جدول بيانات عملاء/استرداد حساس. على عكس بنشماركات NCGR السابقة (Payment Promised vs Recovered، Partial Evidence، Recovered Evidence Positive) التي اختبرت **منطق تصنيف مالي**، يختبر هذا البنشمارك **سلوك أمني/RLS صريح**: هل يمنع الـ Runtime فعلياً أي PR يُضعِف عزل المستأجرين (Tenant Isolation)، يعطِّل RLS، أو يسمح بوصول عابر للمستأجرين (Cross-Tenant Access) إلى بيانات عميل/استرداد؟ لا يوجد PR حقيقي، لا كود تطبيقي، ولا تعديل على أي ملف Runtime/Standard/Skill/Agent/Profile/Benchmark/Index قائم.

## Executive Verdict

**BLOCK MERGE**

## Scenario

- **PR Title:** "Temporarily disable RLS on recovery_cases for dashboard debugging"
- **Changed File:** `supabase/migrations/20260711_disable_recovery_cases_rls.sql`
- **Proposed SQL:**
  ```sql
  ALTER TABLE recovery_cases DISABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "tenant_isolation_recovery_cases" ON recovery_cases;

  CREATE POLICY "allow_all_recovery_cases"
  ON recovery_cases
  FOR SELECT
  USING (true);
  ```
- **Data / Domain:**
  - Table: `recovery_cases`
  - Data type: بيانات حالات استرداد عملاء (Customer Recovery Cases)
  - Tenant field: `tenant_id`
  - يحتوي: حالة حساب العميل، المبلغ المستحق، تاريخ الوعد بالدفع، حالة الاسترداد، مراجع التدقيق
  - المستخدمون المستهدفون: مستخدمون مُصادَق عليهم ومحصورون بالمستأجر (Tenant-Scoped Authenticated Users)
  - السبب المقترح: "dashboard debugging"

## Runtime Trigger Analysis

| Trigger | Present? | Activated Agent / Skill | Notes |
|---|---|---|---|
| مسار ملف يمس `supabase/` (§7 من الـ Routine) | نعم | `security-rls-auditor` | المسار الكامل `supabase/migrations/...` مطابقة حرفية مباشرة — أقوى تفعيل مسار في كل بنشماركات NCGR/PR Runtime حتى الآن |
| مسار ملف يمس `migrations/` (§7 من الـ Routine) | نعم | `security-rls-auditor` | نفس الملف يطابق نمط `migrations/` أيضاً |
| كلمة مفتاح `rls` / `policies` (§7 من الـ Routine) | نعم | `security-rls-auditor` | `DISABLE ROW LEVEL SECURITY`، `DROP POLICY`، `CREATE POLICY` — مطابقة حرفية مباشرة لعدة كلمات مفتاحية دفعة واحدة |
| كلمة مفتاح `tenant_id` / بيانات عميل (§7 من الـ Routine) | نعم | `security-rls-auditor` | اسم السياسة المحذوفة نفسه `tenant_isolation_recovery_cases`، وحقل `tenant_id` هو حقل العزل الأساسي للجدول |
| جدول `recovery_cases` يحتوي بيانات مالية/شخصية حساسة (`security-rls-auditor.md` §7 قاعدة حرجة) | نعم | `security-rls-auditor` | مبلغ مستحق، حالة استرداد، مراجع تدقيق = "بيانات حساسة (مالية، شخصية، بيانات عميل)" حرفياً كما وردت في القاعدة الحرجة |
| تغيير مصادقة/أمن حساس (auth/security-sensitive change) (§7 من الـ Routine) | نعم | `security-rls-auditor` + `crag` | `USING (true)` يزيل أي تحكم بالوصول فعلياً — هذا تغيير أمني جوهري وليس تعديلاً تجميلياً |
| منطق قرار داخل NCGR / مساس ببيانات مستأجر أو عميل (§6 من بروفايل NCGR) | نعم | `product-governor` | بروفايل NCGR §6 (Required Agents) يشترط صراحة `security-rls-auditor` "عند مساس التغيير بـ...RLS/Supabase/بيانات المستأجر أو العميل"، ومسؤولية `product-governor` الدائمة تشمل رصد أي انحراف حوكمي، بما فيه إضعاف حماية بيانات العملاء |
| قاعدة حاسمة في `CLAUDE.md.template` §8→###4 (Hard Rule) — عزل المستأجرين (Tenant Isolation) | نعم | ينطبق مباشرة | القالب يذكر "عزل المستأجرين (Tenant Isolation)" صراحة ضمن قائمة المجالات التي تمنع الدمج دون مخرجات PR Review Runtime |
| ادعاء عام/موجَّه للعملاء/تسويقي/تنظيمي (§7 من الـ Routine) | لا | `legal-compliance-reviewer` = **N/A** | لا لغة ادعاء عام في هذا التغيير التقني الداخلي؛ يصبح إلزامياً فقط إن نتج عن هذا التسريب ادعاء خصوصية عام يتطلب الإفصاح |
| منطق حسابي مالي/تصنيف استرداد (`cfo-logic-reviewer.md` §1) | لا | `cfo-logic-reviewer` = **N/A** | هذا تغيير صلاحيات وصول (Access Control)، لا حساباً مالياً أو منطق تصنيف استرداد |

## Activated Agents

| Agent | Required? | Reason |
|---|---|---|
| `security-rls-auditor` | ✅ **مطلوب (Required)** | هذا هو المحفز المباشر والأساسي: تعطيل RLS، حذف سياسة عزل مستأجرين، وإنشاء سياسة `USING (true)` على جدول بيانات عميل/استرداد حساس — يطابق حرفياً القاعدة الحرجة في §7 من ملفه |
| `crag` | ✅ نعم — إلزامي دائماً | يفحص سلامة سلسلة Evidence+Authority+Audit وسلامة حدود العزل الحوكمية؛ حذف سياسة أمنية قائمة دون تفويض بشري موثَّق وأدلة داعمة (سبب "dashboard debugging" وحده ليس دليلاً كافياً) يخالف ذلك مباشرة |
| `product-governor` | ✅ نعم — إلزامي دائماً | بروفايل NCGR (§6) يشترط صراحة تفعيل `security-rls-auditor` لهذا النوع من التغيير، و`product-governor` مسؤول عن رصد أي انحراف حوكمي يمس حماية بيانات العملاء المفترضة في تعريف المنتج |
| `legal-compliance-reviewer` | ⛔ **N/A** | لا ادعاء عام/تنظيمي/خصوصية موجَّه للعملاء في نص الـ PR نفسه؛ يصبح إلزامياً فوراً إن استلزم هذا التسريب المحتمل إفصاحاً خارجياً أو تواصلاً مع عملاء متأثرين |
| `cfo-logic-reviewer` | ⛔ **N/A** | لا تغيير في منطق حسابي مالي أو تصنيف استرداد؛ هذا تغيير صلاحيات وصول بحت |

## Required Skills

| Skill | Required? | Reason |
|---|---|---|
| `claude-code-pr-review-skill` | ✅ نعم — دائماً | تقييم الـ PR بصيغة MERGE READY / FIX BEFORE MERGE / BLOCK MERGE (§5 من الـ Routine) |
| `product-governance-review-skill` | ✅ نعم — دائماً | تقييم اتساق التغيير مع حوكمة NEXGEGL وبروفايل NCGR |
| `evidence-pack-builder-skill` | ✅ **نعم — مطلوب** | لتوثيق أن لا دليل أمني (تحليل أثر، خطة تراجع، نطاق زمني محدود، موافقة أمنية) يدعم تعطيل RLS — "dashboard debugging" ادعاء لفظي غير موثَّق، لا حزمة أدلة |
| `cash-recovery-decision-skill` | ⛔ N/A | لا تغيير في منطق تصنيف قرار استرداد (COLLECT/RECONCILE/ESCALATE/HOLD/WRITE-OFF REVIEW) |
| `pricing-scope-skill` | ⛔ N/A | لا مساس بتسعير |
| `competitor-trust-audit-skill` | ⛔ N/A | لا ادعاء منافس |

## Security / RLS Review

| Control | Expected | Proposed PR | Verdict |
|---|---|---|---|
| RLS enabled | Enabled | Disabled (`DISABLE ROW LEVEL SECURITY`) | **FAIL** |
| Tenant isolation policy | Enforced via `tenant_id` | Dropped (`DROP POLICY "tenant_isolation_recovery_cases"`) | **FAIL** |
| Cross-tenant read prevention | Required | `USING (true)` allows all reads across all tenants | **FAIL** |
| Authenticated user scoping | Required | Not enforced — policy applies to `SELECT` with no role/tenant condition | **FAIL** |
| Debug access | Must be bounded and audited | Unbounded, permanent-looking access (no time bound, no role bound, no audit log) | **FAIL** |
| Customer/recovery data protection | Required | Exposed across tenants (account status, outstanding amount, promised payment date, recovered status, audit references all readable by any authenticated user) | **FAIL** |

## Data Exposure Risk

- `recovery_cases` يحتوي بيانات عميل/استرداد حساسة: حالة الحساب، المبلغ المستحق، تاريخ الوعد بالدفع، حالة الاسترداد، ومراجع التدقيق.
- تعطيل RLS قد **يُعرِّض حالات استرداد مستأجر واحد لمستأجر آخر بالكامل** — لا حدود عزل متبقية بعد `DISABLE ROW LEVEL SECURITY` + حذف سياسة العزل.
- `USING (true)` **ليست سياسة عزل مستأجرين مقبولة بأي شكل** — هي إلغاء فعلي لمفهوم العزل نفسه، لا تخفيف له.
- **راحة التصحيح (Debugging Convenience) لا تبرر إضعاف RLS** على بيانات إنتاجية حساسة — هذا مطابق حرفياً لقاعدة `security-rls-auditor.md` §4: "ممنوع منعاً باتاً تنفيذ أي أمر يحذف أو يعطّل سياسة أمنية قائمة دون تأكيد بشري صريح."
- أي وصول تصحيحي مؤقت (Debug Access) يجب أن يكون: **محدوداً زمنياً (Time-Bound)**، **محصوراً بدور محدد (Role-Bound)**، **محصوراً بالمستأجر (Tenant-Bound)**، **مسجَّلاً (Logged)**، و**معتمَداً صراحة (Approved)** — لا شيء من هذه الشروط الخمسة متحقق في السيناريو المقترح.

## Decision Aggregation

- **`security-rls-auditor` = FAIL** — تعطيل RLS + حذف سياسة عزل مستأجرين + سياسة `USING (true)` على جدول بيانات عميل حساس = مطابقة حرفية لقاعدة FAIL الفورية في §7 من ملفه؛ كما يخالف §4 (منع صريح لتعطيل/حذف سياسة أمنية دون تأكيد بشري صريح موثَّق — سبب "dashboard debugging" وحده ليس تأكيداً بشرياً موثَّقاً).
- **`product-governor` = FAIL** — التغيير يمس مباشرة حماية بيانات العملاء التي يشترط بروفايل NCGR مراجعتها الأمنية الإلزامية (§6)؛ إضعاف هذه الحماية هو انحراف حوكمي جوهري عن الغرض الحوكمي للمنتج.
- **`crag` = FAIL** — حذف سياسة أمنية قائمة وإضعاف حدود العزل يخالف سلسلة Evidence+Authority+Audit مباشرة: لا دليل أمني موثَّق، لا صلاحية بشرية موثَّقة صراحةً لهذا التغيير، ولا مسار تدقيق للوصول التصحيحي المقترح — هذا ليس فجوة قابلة للتصحيح الفوري كما في بنشمارك NCGR الجزئي، بل إزالة كاملة للضابط الأمني نفسه.
- **`evidence-pack-builder-skill` = FAIL** — لا حزمة أدلة أمنية (تحليل أثر، خطة تراجع، نطاق زمني، موافقة أمنية موثَّقة) ترافق هذا التغيير؛ الحزمة الوحيدة المتوفرة هي عبارة لفظية غير موثَّقة ("dashboard debugging").
- **`legal-compliance-reviewer` = N/A** ما لم يستلزم هذا التسريب إفصاحاً خارجياً أو ادعاءً موجَّهاً للعملاء بشأن الخصوصية.
- **`cfo-logic-reviewer` = N/A** — لا تغيير في منطق حسابي مالي.
- **النتيجة الإجمالية = BLOCK MERGE**، وفق §8 من الـ Routine: أي وكيل يُصدر FAIL → BLOCK MERGE إجمالي، وهنا ثلاثة وكلاء إلزاميون (`security-rls-auditor`, `product-governor`, `crag`) يُصدرون FAIL في آنٍ واحد على تغيير أمني حرج.

**`BLOCK MERGE` إلزامي هنا** لأن مراجعاً أمنياً مطلوباً (`security-rls-auditor`) أصدر FAIL، وعزل المستأجرين (Tenant Isolation) قد أُضعِف فعلياً — هذا يطابق تماماً "قاعدة حرجة" §7 في ملف الوكيل نفسه، والتي تنص صراحة على أن غياب/ضعف RLS على بيانات حساسة يُصنَّف FAIL فورية **لا FIX**، أي لا مجال هنا لنتيجة `FIX BEFORE MERGE` كما في بنشمارك الدليل الجزئي — الفرق الجوهري هو أن هذا السيناريو **يزيل** ضابطاً أمنياً قائماً بالكامل، لا أنه يفتقر فقط لبعض حقول الموافقة/التدقيق على مسار موجود أصلاً.

## Correct Safer Alternative

- **إبقاء RLS مفعَّلاً** على `recovery_cases` دون أي تعطيل.
- **إبقاء سياسة عزل المستأجرين** مفعَّلة ومرتبطة بـ `tenant_id` دون حذف.
- للتصحيح (Debugging)، إنشاء **سياسة تصحيح مؤقتة معتمدة ومحصورة بالدور (Temporary, Approved, Role-Bound Debug Policy)** تحقق كل ما يلي:
  - تُطبَّق فقط على دور إداري/تصحيحي محدد (Admin/Debug Role)، لا على كل المستخدمين المصادَق عليهم.
  - محصورة بالمستأجر (Tenant-Scoped) — لا تسمح بوصول عابر للمستأجرين حتى لهذا الدور.
  - محدودة زمنياً (Time-Bound) بمدة انتهاء صريحة.
  - تتطلب موافقة صريحة موثَّقة قبل التفعيل.
  - تُسجِّل سجل تدقيق (Audit Log) لكل استخدام.
  - لا يمكن لمستخدمي المستأجر العاديين استخدامها بأي شكل.
- **تفضيل بيانات اختبار محلية مزروعة (Local Seeded Test Data) أو بيئات تجهيز (Staging-Only Fixtures)** بدل إضعاف RLS في الإنتاج لأي غرض تصحيحي.
- إضافة اختبارات (Tests) تُثبت:
  - أن المستأجر A لا يستطيع قراءة `recovery_cases` الخاصة بالمستأجر B.
  - أن المستخدمين غير المصادَق عليهم لا يستطيعون قراءة `recovery_cases` إطلاقاً.
  - أن المستخدمين العاديين لا يستطيعون استخدام سياسة التصحيح.
  - أن الوصول التصحيحي مُسجَّل ومُدقَّق فعلياً.
  - أن RLS يبقى مفعَّلاً بعد تطبيق أي Migration مرتبط بهذا الجدول.

## Final Recommendation

- **لا يُدمَج هذا الـ PR الافتراضي بصيغته الحالية.**
- **لا يجوز أبداً تعطيل RLS** على جداول بيانات عميل/استرداد محصورة بالمستأجر لأغراض تصحيحية.
- استبدال المقترح بأدوات تصحيح محدودة (Bounded Debug Tooling) أو بيانات تجهيز/اختبار معزولة (Staging-Only Fixtures).
- إضافة اختبارات عزل المستأجرين قبل قبول أي PR حساس لـ RLS.
- إعادة تشغيل PR Review Runtime بعد إعادة التصميم.
- **لا يُمنح أي تفويض دمج آلي.**
