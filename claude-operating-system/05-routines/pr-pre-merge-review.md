# Routine: مراجعة ما قبل الدمج (PR Pre-Merge Review)
## PR Review Runtime — v1.0

> يُقرأ مع `00-master-standards/NEXGEGL_CLAUDE_MASTER.md` و`03-sub-agents/` و`04-skills/README.md`.

---

## 1. الغرض (Purpose)

ضمان أن أي Pull Request يُدمَج في أي مستودع NEXGEGL يمر عبر مراجعة حوكمية موحدة قبل الدمج، بحيث لا يدخل انحراف (Drift) أو خطر أمني أو مالي أو تصميمي دون رصد. هذا القسم يجعل الـ Routine **قابلاً للتشغيل الفعلي (Executable)**: مدخلات محددة، Skills محددة، وكلاء محددون، وقاعدة تجميع حاسمة.

## 2. التفعيل (Trigger)

- كل Pull Request قبل الدمج (Merge)، عند فتحه أو عند أي تحديث (push) لاحق عليه.
- عند طلب مراجعة يدوية صريحة من مساهم بشري.

## 3. المدخلات المطلوبة (Required Inputs)

يجب أن تتوفر جميعها قبل تشغيل الـ Routine؛ أي مدخل ناقص يُسجَّل صراحة في تقرير المخرجات كـ "مدخل ناقص" ولا يُفترَض:

- عنوان الـ PR (PR title)
- وصف الـ PR (PR description)
- قائمة الملفات المتغيرة (Changed files)
- الفرق الفعلي (Diff)
- حالة الاختبار/البناء (Test/Build status)
- تصنيف المستودع (Repo classification: Core IP/Product/Client/Experiment) من CLAUDE.md المحلي

## 4. قاعدة المدخل الناقص (Missing Input Rule)

أي مدخل من القائمة في القسم 3 يكون غائباً وقت التشغيل يُسجَّل صراحة باسمه في Audit Notes، ولا يُفترَض أو يُختلَق بديل عنه. **لا يجوز إصدار `MERGE READY`** في وجود أي مدخل ناقص من القائمة أدناه:

- غياب الفرق الفعلي (Diff) → **`BLOCK MERGE`**.
- غياب قائمة الملفات المتغيرة (Changed files) → **`BLOCK MERGE`** (لأن غيابها يمنع أيضاً تحديد نطاق `security-rls-auditor` بدقة؛ يُستدعى احترازياً في هذه الحالة).
- غياب حالة الاختبار/البناء (Test/Build status) → **`FIX BEFORE MERGE`** على الأقل، وترتفع إلى **`BLOCK MERGE`** إذا كان التغيير يمس auth/database/RLS/security.
- غياب تصنيف المستودع (Repo classification) → يُعامل المستودع مؤقتاً كـ **Core IP Repo** (أعلى درجة صرامة) حتى يثبت خلاف ذلك.
- غياب عنوان أو وصف الـ PR وحده → لا يمنع المتابعة، لكنه يُخفّض وضوح التقييم لدى `product-governor` ويُذكر كملاحظة **FIX**.

## 5. الـ Skills المستخدمة (Skills Used)

- `claude-operating-system/04-skills/claude-code-pr-review-skill.md` — دائماً، لتقييم الـ PR بصيغة MERGE READY / FIX BEFORE MERGE / BLOCK MERGE.
- `claude-operating-system/04-skills/product-governance-review-skill.md` — دائماً، لتقييم اتساق التغيير مع حوكمة NEXGEGL.
- `claude-operating-system/04-skills/evidence-pack-builder-skill.md` — عند غياب الأدلة الكافية (Evidence) لدعم أي ادعاء أو قرار وارد في الـ PR.

## 6. الوكلاء المشاركون (Agents Involved)

- **`crag`** — إلزامي دائماً. فحص الاتساق العام ومكافحة الانحراف، بما في ذلك فصل SDGM/KFSA وفصل Signal/Decision وسلسلة Evidence+Authority+Audit.
- **`product-governor`** — إلزامي دائماً. فحص اتساق الهوية والنطاق التجاري ورصد أي انحراف في المصطلحات أو المنطق أو أي وعد منتج غير مصرَّح به.
- **`security-rls-auditor`** — إلزامي عند تغيّر ملفات قاعدة بيانات/مصادقة/RLS/Supabase (انظر القسم 7).

## 7. تحديد نطاق الفرق (Diff Scope Detection)

يجب تفعيل `security-rls-auditor` إذا شمل الـ PR أي ملف أو مسار أو تغيير متعلق بـ:

- `supabase/`
- `migrations/`
- `policies`
- `rls`
- `auth`
- `session`
- `tenant_id`
- `organization_id`
- `user_id`
- `api`
- `database`
- `schema`
- `.env`
- secrets/configuration
- أي منطق يقرأ أو يكتب بيانات مستأجر أو عميل

بالإضافة إلى ذلك:

- أي ملف يمس `00-master-standards/`، `03-sub-agents/`، أو تعريف SDGM/KFSA/Signal/Decision → يُفعَّل أعلى مستوى صرامة لدى `crag`.
- أي ملف يمس `02-product-profiles/` أو محتوى تسويقي/واجهة عميل → يُفعَّل أعلى مستوى صرامة لدى `product-governor`.
- تحديد النطاق لا يُقلّل أبداً من إلزامية `crag` أو `product-governor` (كلاهما إلزامي دائماً بصرف النظر عن النطاق) — يُستخدم فقط لتحديد استدعاء `security-rls-auditor` وأي تشديد إضافي.
- عند غموض التصنيف (ملف يقع في أكثر من نطاق، أو نمط مسار غير معروف)، يُستدعى الوكيل الأكثر تحفظاً (Fail-safe) بدل افتراض عدم الانطباق.

## 8. قاعدة تجميع القرار (Decision Aggregation)

- أي وكيل يُصدر **FAIL** أو **BLOCK MERGE** → النتيجة الإجمالية **BLOCK MERGE**.
- لا يوجد ما سبق، لكن أي وكيل يُصدر **FIX** أو **FIX BEFORE MERGE** → النتيجة الإجمالية **FIX BEFORE MERGE**.
- فقط عندما تُصدر كل المراجعات المطلوبة نتيجة PASS/MERGE READY → النتيجة الإجمالية **MERGE READY**.

## 9. صلاحية الدمج النهائية (Final Merge Authority)

مخرج هذا الـ Routine (Overall Verdict وMerge Recommendation) هو **توصية مراجعة (Signal)**، وليس قرار دمج مؤسسي نهائي بحد ذاته، اتساقاً مع مبدأ فصل Signal/Decision في `00-master-standards/NEXGEGL_CLAUDE_MASTER.md`.

- **`MERGE READY`** يعني أن المراجعة التشغيلية لا ترى مانعاً معروفاً، لكنه لا يلغي أي متطلب موافقة بشرية إضافية (مثال: Code Owner Approval) معمول به في المستودع.
- **`BLOCK MERGE`** يمنع الدمج فعلياً، ولا يجوز تجاوزه إلا بتفويض بشري صريح وموثَّق من صاحب صلاحية الدمج النهائية للمستودع، مع تسجيل سبب التجاوز في Audit Notes.
- **`FIX BEFORE MERGE`** يمنع الدمج حتى تُعاد المراجعة وتصدر `MERGE READY`، أو حتى يصدر صاحب صلاحية الدمج تجاوزاً موثَّقاً بنفس شرط `BLOCK MERGE` أعلاه.
- الدمج الفعلي يتطلب صاحب صلاحية بشري، أو Automation مصرَّح له صراحة في CLAUDE.md المحلي للمستودع. لا يجوز لأي وكيل AI أو لهذا الـ Routine تنفيذ الدمج تلقائياً بذاته ما لم يكن ذلك مذكوراً صراحة في سياسة المستودع.

## 10. صيغة المخرجات (Output Format)

```
PR REVIEW RUNTIME REPORT

Overall Verdict: [MERGE READY / FIX BEFORE MERGE / BLOCK MERGE]

Agent Findings:
- CRAG: [PASS/FIX/FAIL] — [ملاحظة موجزة]
- Product Governor: [PASS/FIX/FAIL] — [ملاحظة موجزة]
- Security/RLS Auditor: [PASS/FIX/FAIL/N/A] — [ملاحظة موجزة]

Skill Findings:
- claude-code-pr-review-skill: [MERGE READY/FIX BEFORE MERGE/BLOCK MERGE]
- product-governance-review-skill: [PASS/FIX/FAIL]
- evidence-pack-builder-skill: [PASS/FIX/FAIL/N/A — تُستخدم فقط عند غياب الأدلة]

Blocking Issues:
- [قائمة أي مشكلة تسبب BLOCK MERGE، أو "لا يوجد"]

Required Fixes:
- [قائمة الإصلاحات المطلوبة قبل الدمج، أو "لا يوجد"]

Merge Recommendation: [يُسمح بالدمج / يُعاد للإصلاح / يُمنع الدمج ويُصعَّد]

Audit Notes:
- [أي مدخل ناقص، افتراض تم اتخاذه، أو ملاحظة تتبع لازمة للتدقيق لاحقاً]
```

## 11. ملاحظة على النطاق

هذا Routine يوثّق **آلية** المراجعة كطبقة توثيق تشغيلية. تفعيله الفعلي (كـ GitHub Action أو Hook) يتم عند دمج هذا الإطار في مستودع منتج فعلي، ولا يُنفَّذ آلياً من هذا المستودع التجريبي وحده.
