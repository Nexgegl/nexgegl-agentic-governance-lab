# Product Governance Review Skill

## 1. Purpose
يراجع تغييراً مقترحاً في منتج NEXGEGL (كود، تصميم، ميزة) للتحقق من اتساقه مع بنية الحوكمة الأساسية (SDGM/KFSA، Evidence/Authority/Audit، حدود الهوية التجارية)، وينتج حكماً PASS/FIX/FAIL.

## 2. When to Use
- قبل اعتماد أي ميزة منتج جديدة تمس مسار اتخاذ قرار.
- عند إضافة منطق جديد يعتمد على مُخرج نموذج ذكاء اصطناعي.
- عند مراجعة دورية (غير مرتبطة بـ PR بعينه) لاتساق منتج قائم مع المعيار الرئيسي.
- **ليس بديلاً** عن `claude-code-pr-review-skill.md` — هذا الـ Skill يراجع **الحوكمة المفاهيمية للمنتج**، ذاك يراجع **جاهزية كود PR بعينه للدمج**.

## 3. Inputs Required

**Required:**
- وصف التغيير/الميزة المقترحة (أو الكود المعني إن توفر).
- تصنيف المستودع (Core IP / Product / Client / Experiment) من CLAUDE.md المحلي.
- Product Profile ذي الصلة من `02-product-profiles/` إن وُجد.

**Optional:**
- تاريخ مراجعات حوكمية سابقة لنفس المنتج.
- سياق العميل إن كان المستودع Client Repo.

**Missing Input Handling:**
إن كان تصنيف المستودع غير معلن، يُفترض أعلى مستوى حماية ممكن (Core IP Repo) حتى يُؤكَّد خلاف ذلك — لا يُفترض التصنيف الأخف.

## 4. Operating Rules
- Do not invent facts. لا تُفترض ممارسة أمنية أو حوكمية غير ظاهرة فعلياً في الكود/الوصف المقدَّم.
- افصل بين ما هو **مطابق فعلياً في الكود** وما هو **موثَّق في التصميم لكن غير مُتحقَّق منه في الكود**.
- إن كان الدليل على أي محور غير كافٍ للحكم، صرّح بذلك ولا تفترض PASS تلقائياً.
- **Signal is not Decision.** تحقق أن أي مُخرج نموذج ضمن التغيير يُعامَل كإشارة، لا كفعل مؤسسي نافذ مباشر.
- **لا قرار مؤسسي بلا Evidence + Authority + Audit.** أي مسار في التغيير يمنح فعلاً مؤسسياً نافذاً دون الأركان الثلاثة هو **FAIL** فوري، بلا استثناء.
- استخدم PASS/FIX/FAIL حصراً كنتيجة نهائية — لا نتائج وسيطة غامضة.

## 5. Execution Workflow
1. حدد تصنيف المستودع ومستوى الصرامة المطلوب.
2. افحص **فصل SDGM/KFSA**: هل يوجد فصل معماري واضح بين تفسير المعنى وإصدار الحكم النهائي، أم مدمجان في وحدة واحدة غامضة؟
3. افحص **فصل Signal عن Decision**: هل أي مُخرج نموذج يُصنَّف بوضوح كإشارة قبل أي فعل نافذ؟
4. افحص **طبقة الصلاحية (Authority)**: هل يوجد تحقق واضح من هوية/دور الجهة المنفِّذة قبل أي فعل حساس؟
5. افحص **طبقة الدليل (Evidence)**: هل كل فعل نافذ مرتبط بمصدر بيانات يمكن التحقق منه؟
6. افحص **مسار التدقيق (Audit Trail)**: هل يُسجَّل من فعل ماذا ومتى بشكل قابل للمراجعة لاحقاً؟
7. افحص **عزل المستأجرين (Tenant Isolation)**: إن كان النظام متعدد العملاء، هل بيانات كل عميل معزولة منطقياً؟
8. افحص **حدود الذكاء الاصطناعي (AI Boundary)**: هل يحترم التغيير `NEXGEGL_AI_USAGE_BOUNDARIES.md`؟
9. افحص **انحراف المصطلحات (Terminology Drift)**: هل استُخدمت مصطلحات حاكمة (SDGM/KFSA/Signal/Decision) أو أسماء تجارية (ESTARED/إسترد) بشكل صحيح وثابت؟
10. اجمع النتائج وأصدر حكماً إجمالياً واحداً: PASS/FIX/FAIL.

## 6. Output Format

```
PRODUCT GOVERNANCE REVIEW — [اسم المنتج/التغيير] — [التاريخ]
التصنيف: [Core IP/Product/Client/Experiment]

SDGM/KFSA Separation: [PASS/FIX/FAIL] — [ملاحظة]
Signal vs Decision Separation: [PASS/FIX/FAIL] — [ملاحظة]
Authority Layer: [PASS/FIX/FAIL] — [ملاحظة]
Evidence Layer: [PASS/FIX/FAIL] — [ملاحظة]
Audit Trail: [PASS/FIX/FAIL] — [ملاحظة]
Tenant Isolation: [PASS/FIX/FAIL/N-A] — [ملاحظة]
AI Boundary: [PASS/FIX/FAIL] — [ملاحظة]
Terminology Drift: [PASS/FIX/FAIL] — [ملاحظة]

OVERALL: PASS / FIX / FAIL
الإجراء المطلوب: [لا إجراء / قائمة إصلاحات محددة / منع فوري وتصعيد]
```

## 7. Quality Gates

| الحالة | معيار قابل للملاحظة |
|---|---|
| **PASS** | كل محور من الثمانية PASS، أو N/A مبرر بوضوح (مثال: Tenant Isolation لا ينطبق على نظام أحادي المستأجر). |
| **FIX** | محور واحد أو أكثر FIX (قابل للتصحيح دون رفض كامل)، ولا يوجد أي FAIL. |
| **FAIL** | أي محور واحد على الأقل FAIL — خصوصاً غياب فصل Signal/Decision، غياب طبقة صلاحية أو دليل أو تدقيق لفعل نافذ، أو انحراف في اسم تجاري معتمد. |

## 8. Anti-Patterns
- إصدار PASS إجمالي رغم وجود FIX متعدد متراكم في نفس المنطقة (مؤشر انحراف بنيوي يستحق تصعيداً لا مجرد FIX).
- تجاهل فحص Tenant Isolation بحجة "النظام صغير حالياً".
- الحكم على Terminology Drift بالمرور السريع دون فحص فعلي لنصوص الواجهة/التوثيق.
- خلط نتيجة هذا الـ Skill مع نتيجة `claude-code-pr-review-skill.md` في تقرير واحد غير مائز.

## 9. Example Prompt
"استخدم Product Governance Review Skill لمراجعة ميزة جديدة في NCGR تسمح بموافقة تلقائية على طلب بناءً على تصنيف نموذج ذكاء اصطناعي، وحدد إن كانت تحترم فصل Signal/Decision."

## 10. Example Output Skeleton

```
PRODUCT GOVERNANCE REVIEW — [المنتج] — [YYYY-MM-DD]
التصنيف: [التصنيف]
SDGM/KFSA Separation: [حكم + ملاحظة]
Signal vs Decision Separation: [حكم + ملاحظة]
Authority Layer: [حكم + ملاحظة]
Evidence Layer: [حكم + ملاحظة]
Audit Trail: [حكم + ملاحظة]
Tenant Isolation: [حكم + ملاحظة]
AI Boundary: [حكم + ملاحظة]
Terminology Drift: [حكم + ملاحظة]
OVERALL: [PASS/FIX/FAIL]
الإجراء المطلوب: [التفاصيل]
```
