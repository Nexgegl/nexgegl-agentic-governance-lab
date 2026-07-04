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

## 4. الـ Skills المستخدمة (Skills Used)

- `claude-operating-system/04-skills/claude-code-pr-review-skill.md` — دائماً، لتقييم الـ PR بصيغة MERGE READY / FIX BEFORE MERGE / BLOCK MERGE.
- `claude-operating-system/04-skills/product-governance-review-skill.md` — دائماً، لتقييم اتساق التغيير مع حوكمة NEXGEGL.
- `claude-operating-system/04-skills/evidence-pack-builder-skill.md` — عند غياب الأدلة الكافية (Evidence) لدعم أي ادعاء أو قرار وارد في الـ PR.

## 5. الوكلاء المشاركون (Agents Involved)

- **`crag`** — إلزامي دائماً. فحص الاتساق العام ومكافحة الانحراف، بما في ذلك فصل SDGM/KFSA وفصل Signal/Decision وسلسلة Evidence+Authority+Audit.
- **`product-governor`** — إلزامي دائماً. فحص اتساق الهوية والنطاق التجاري ورصد أي انحراف في المصطلحات أو المنطق أو أي وعد منتج غير مصرَّح به.
- **`security-rls-auditor`** — إلزامي عند تغيّر ملفات قاعدة بيانات/مصادقة/RLS/Supabase.

> يُحدَّد أي وكيل ينطبق فعلياً بناءً على نوع الملفات المتغيرة في الـ PR (diff scope detection)، ولا حاجة لتشغيل وكلاء خارج نطاقهم.

## 6. قاعدة تجميع القرار (Decision Aggregation)

- أي وكيل يُصدر **FAIL** أو **BLOCK MERGE** → النتيجة الإجمالية **BLOCK MERGE**.
- لا يوجد ما سبق، لكن أي وكيل يُصدر **FIX** أو **FIX BEFORE MERGE** → النتيجة الإجمالية **FIX BEFORE MERGE**.
- فقط عندما تُصدر كل المراجعات المطلوبة نتيجة PASS/MERGE READY → النتيجة الإجمالية **MERGE READY**.

## 7. صيغة المخرجات (Output Format)

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

## 8. ملاحظة على النطاق

هذا Routine يوثّق **آلية** المراجعة كطبقة توثيق تشغيلية. تفعيله الفعلي (كـ GitHub Action أو Hook) يتم عند دمج هذا الإطار في مستودع منتج فعلي، ولا يُنفَّذ آلياً من هذا المستودع التجريبي وحده.
