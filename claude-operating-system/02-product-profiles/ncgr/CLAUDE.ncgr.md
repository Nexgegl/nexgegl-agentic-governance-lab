# CLAUDE.ncgr.md — بروفايل منتج NCGR
## Product Profile — v1.1 (Hardened)

> هذا الملف هو الطبقة الثانية (Product Profile) من تسلسل التثبيت المعرَّف في `NEXGEGL_CLAUDE_MASTER.md`. يُخصص القواعد لمنتج **NCGR** دون أن يُخفف أي قاعدة من المعيار الرئيسي. يُقرأ أيضاً مع `03-sub-agents/`، `04-skills/`، و`05-routines/pr-pre-merge-review.md` للتنفيذ الفعلي عبر CLAUDE.md المحلي لكل مستودع NCGR.

---

## 1. دور المنتج (Product Role)

**NCGR** هو **نواة حوكمة الاسترداد الداخلية (Internal Recovery Governance Core)** وطبقة دعم القرار لـ: جاهزية التحصيل (Collection Readiness)، مراجعة الأدلة (Evidence Review)، تصنيف الحسابات/المدينين (Debtor/Account Classification)، ترتيب أولويات الاسترداد (Recovery Prioritization)، تسجيل المخاطر (Risk Scoring)، وتجهيز مرشحات KFSA (KFSA Candidate Preparation).

يرث NCGR بالكامل التعريفات الجوهرية من المعيار الرئيسي:
- Signal ≠ Decision.
- لا قرار مؤسسي دون Evidence + Authority + Audit.
- أي انتقال من إشارة إلى قرار يمر منطقياً عبر مفهوم SDGM (تفسير المعنى) ثم KFSA (الحكم النهائي) حيثما ينطبق على منطق NCGR.

> ملاحظة: تفاصيل النطاق الوظيفي الدقيق لـ NCGR (المجال، المستخدمون، البيانات) تُوثَّق في `PROJECT_CONTEXT.md` الخاص بكل مستودع NCGR فعلي، وليس هنا. هذا الملف يحدد **حوكمة** المنتج، لا **وظائفه**.

## 2. ما هو NCGR (What NCGR Is)

- منطق حوكمة داخلي (Internal Governance Logic).
- محرك جاهزية استرداد (Recovery Readiness Engine).
- طبقة مراجعة أدلة وحسابات (Evidence and Account Review Layer).
- طبقة دعم قرار (Decision-Support Layer).
- مُنتِج مرشحات/إشارات (Candidate/Signal Producer) — **وليس** صانع القرار المؤسسي النهائي.

## 3. ما هو NCGR وليس (What NCGR Is Not)

- ليس جهة تحصيل ديون مرخَّصة (Licensed Debt Collection Authority).
- ليس محرك إنفاذ قانوني (Legal Enforcement Engine).
- ليس معالج مدفوعات (Payment Processor).
- ليس نظام اعتماد مالي (Financial Approval System).
- ليس صاحب الصلاحية النهائية لاتخاذ القرار (Final Decision Authority).
- ليس العلامة التجارية التجارية الأساسية الموجَّهة للعملاء عندما تُستخدم ESTARED خارجياً.

## 4. القواعد الجوهرية (Core Rules)

- **Signal is not Decision.**
- **Payment Promised ≠ Recovered.**
- توصية الاسترداد (Recovery Recommendation) **≠** اعتماد مالي (Financial Approval).
- لا إجراء استرداد فعلي دون **Evidence + Authority + Audit**.
- مرشحات KFSA ليست قرارات رسمية حتى تُرفَّع عبر صلاحية معتمدة (Approved Authority) مع مسار تدقيق (Audit Trail).
- لا يجوز تحويل تحليل NCGR إلى إجراء إنفاذ (Enforcement Action) دون موافقة بشرية مصرَّحة.
- لا يجوز كشف مصطلحات NCGR الداخلية للعملاء إلا عند الحاجة المتعمدة والموثَّقة لذلك.

## 5. تصنيف المستودعات التابعة لـ NCGR

أي مستودع كود فعلي لـ NCGR يُصنَّف افتراضياً كـ **Product Repo**، ما لم يُذكر خلاف ذلك صراحة في CLAUDE.md المحلي (مثال: قد يكون فرع تجريبي منه Experiment Repo).

## 6. الوكلاء المطلوبون (Required Agents)

- `crag` — لضبط الاتساق العام ومكافحة الانحراف وفصل SDGM/KFSA وSignal/Decision.
- `product-governor` — لضبط الاتساق مع تعريف المنتج والحوكمة العامة.
- `security-rls-auditor` — عند مساس التغيير بالمصادقة/قاعدة البيانات/RLS/Supabase/بيانات المستأجر أو العميل.
- `cfo-logic-reviewer` — عند مساس التغيير بمنطق مالي، DSO، تقادم الذمم (Aging)، الذمم المدينة (Receivables)، أولوية الاسترداد، حالة الدفع، أو الأثر النقدي (Cash Impact).
- `legal-compliance-reviewer` — عند مساس التغيير بادعاءات عامة، صياغة تحصيل قانوني، لغة مدفوعات، أو تصريحات موجَّهة للعملاء.
- `qa-test-reviewer` — لضمان تغطية اختبار كافية قبل أي دمج.

## 7. الـ Skills المطلوبة (Required Skills)

- `04-skills/cash-recovery-decision-skill.md`
- `04-skills/evidence-pack-builder-skill.md`
- `04-skills/product-governance-review-skill.md`
- `04-skills/claude-code-pr-review-skill.md`
- `04-skills/executive-brief-skill.md` — عند تلخيص الأثر الإداري/الإداري لصانع قرار.

## 8. مخرجات ممنوعة (Forbidden Output)

- "مُسترَد" (Recovered) بينما هو فقط "موعود بالدفع" (Promised).
- "معتمد" (Approved) بينما هو فقط "موصى به" (Recommended).
- "تم بدء إجراء قانوني" (Legal Action Initiated) دون صلاحية بشرية موثَّقة.
- "استرداد مضمون" (Guaranteed Recovery).
- "تحصيل تلقائي" (Automatic Collection).
- أي ادعاء اعتماد SAMA/مدفوعات/قانوني/تنظيمي دون دليل موثَّق.

## 9. حدود التسمية الخارجية (External Naming Boundary)

- يجوز استخدام "NCGR" داخلياً للمعمارية ومنطق الحوكمة والتوثيق التقني.
- تُستخدم "ESTARED / إسترد" لهوية المنتج التجاري الموجَّه للعملاء ما لم يستدعِ السياق الداخلي صراحة استخدام NCGR.
- **لا يجوز إعادة تسمية ESTARED / إسترد.**
- لا يجوز استبدال "ESTARED" بـ "NCGR" في أي مادة تسويقية إلا عند حاجة داخلية/تقنية صريحة وموثَّقة.

## 10. قواعد تشغيلية إضافية

- أي Sub-Agent يعمل ضمن مستودع NCGR يجب أن يتحقق من تصنيف المستودع (Product/Client/Core IP/Experiment) قبل تنفيذ أي مراجعة، لأن مستوى الصرامة يختلف.
- لا يجوز لأي جهة (بشرية أو آلية) تسويق أو توثيق NCGR بأسماء أو مسارات تعريف مغايرة لما هو معتمد مؤسسياً دون تفويض صريح.
- كل ميزة جديدة تمس مسار اتخاذ القرار داخل NCGR تخضع إلزامياً لمراجعة `product-governor` و`cfo-logic-reviewer` (إن كان للميزة أثر مالي) قبل الدمج.

## 11. حالة هذا الملف

هذا إصدار v1.1 (Hardened) لتوثيق حوكمة NCGR: نطاق، حدود، لغة مسموحة وممنوعة، وكلاء/Skills مطلوبون، وعلاقة بربط CLAUDE.md المحلي عبر `05-routines/pr-pre-merge-review.md`. لا يتضمن أي كود تطبيقي، ولا يُلغي حاجة كل مستودع NCGR فعلي لملف `CLAUDE.md` محلي خاص به يستورد هذا البروفايل.
