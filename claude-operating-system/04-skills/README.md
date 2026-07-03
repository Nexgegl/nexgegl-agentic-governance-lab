# NEXGEGL Skills — دليل التشغيل
## claude-operating-system/04-skills/ — Skill Pack v1.0 / README wording v1.1

> يُقرأ مع `../00-master-standards/NEXGEGL_CLAUDE_MASTER.md`. لا يناقضه، ولا يعيد تعريف أي مصطلح حاكم وارد فيه.

---

## 1. ما هو Skill في NEXGEGL؟

**Skill** هنا هو **دليل تنفيذ تشغيلي (Operational Execution Manual)** يمكن لأي وكيل — Claude أو Sub-Agent آخر — اتباعه حرفياً لإنتاج مُخرَج محدد البنية، قابل للتكرار، وقابل للمراجعة بمعايير PASS/FIX/FAIL.

Skill **ليس** وصفاً تسويقياً لما "يمكن أن يفعله" النظام. كل Skill يحتوي إلزامياً:
- مدخلات محددة (Required / Optional / Missing handling)
- قواعد تشغيل صارمة (Operating Rules)
- خطوات تنفيذ فعلية (Execution Workflow)
- قالب مخرجات صارم (Output Format)
- بوابات جودة قابلة للملاحظة (Quality Gates: PASS/FIX/FAIL)
- أنماط ممنوعة (Anti-Patterns)
- مثال جاهز للنسخ (Example Prompt + Output Skeleton)

## 2. الفرق بين Description و Prompt و Skill و Agent و Routine

| المفهوم | التعريف | مثال |
|---|---|---|
| **Description** | جملة تسويقية تصف ما يفعله شيء ما، لا تُنفَّذ. | "يساعد في تحليل الأداء المالي" |
| **Prompt** | طلب لمرة واحدة، غير موثَّق، غير قابل لإعادة الاستخدام المضمونة النتيجة. | "لخّص لي هذا التقرير" |
| **Skill** | دليل تنفيذ موثَّق، بمدخلات وخطوات ومخرجات وبوابات جودة ثابتة، قابل لإعادة الاستخدام من أي وكيل. | `executive-brief-skill.md` |
| **Agent (Sub-Agent)** | كيان له دور، نطاق صلاحية، وهوية ثابتة، وقد يستخدم عدة Skills لأداء دوره. معرَّف في `03-sub-agents/`. | `cfo-logic-reviewer` |
| **Routine** | جدولة تلقائية أو شبه تلقائية تُشغِّل وكيلاً أو Skill بشكل دوري أو عند حدث معيّن. معرَّف في `05-routines/`. | `pr-pre-merge-review.md` |

**العلاقة:** Routine قد يستدعي Agent، وAgent قد يستخدم Skill واحد أو أكثر لتنفيذ جزء من دوره. الاتجاه دائماً: Routine → Agent → Skill → Output محكوم بـ PASS/FIX/FAIL.

## 3. كيفية تثبيت واستخدام Skills في مستودع منتج

1. لا تُنسخ ملفات Skills إلى مستودع المنتج. يُشار إليها مرجعياً من `CLAUDE.md` المحلي للمستودع (الطبقة الثالثة من تسلسل `Master Standard → Product Profile → Local Repo Instructions`).
2. في قسم "Routines المفعّلة" أو "Sub-Agents المفعّلة" ضمن CLAUDE.md المحلي، أضف سطراً يشير إلى مسار الـ Skill المستخدم، مثال:
   ```
   يُستخدم claude-operating-system/04-skills/claude-code-pr-review-skill.md
   عند كل PR يمس هذا المستودع.
   ```
3. أي وكيل يُستدعى لتنفيذ مهمة يجب أن **يقرأ ملف الـ Skill كاملاً أولاً** قبل التنفيذ، ويتبع بنيته حرفياً — لا يرتجل تنسيقاً بديلاً.
4. مخرج أي Skill يُعامَل كإشارة (Signal) أو توصية، وليس قراراً مؤسسياً، ما لم يمر عبر Evidence + Authority + Audit كما هو معرَّف في المعيار الرئيسي.

## 4. اصطلاح تسمية الملفات (Naming Convention)

```
<kebab-case-topic>-skill.md
```

- كل اسم ينتهي إلزامياً بـ `-skill.md`.
- الاسم يصف **المُخرَج** الذي ينتجه الـ Skill، لا الأداة أو التقنية المستخدمة (مثال: `board-response-skill.md` وليس `gpt-board-writer.md`).
- لا مسافات، لا حروف كبيرة، لا رموز غير الشرطة `-`.

## 5. معيار جودة الـ Skill (Quality Standard)

كل Skill يُقاس بالمعيار التالي قبل قبوله في هذا المجلد:

- [ ] يحتوي الأقسام العشرة الكاملة (Purpose → Example Output Skeleton) دون حذف أي قسم.
- [ ] قسم Inputs Required يفصل Required عن Optional عن Missing-input handling بوضوح.
- [ ] قسم Operating Rules يتضمن حرفياً: "Signal is not Decision"، ومبدأ Evidence + Authority + Audit، وقاعدة عدم اختلاق الحقائق.
- [ ] قسم Output Format هو قالب **قابل للنسخ والتنفيذ الفوري** من وكيل آخر، وليس شرحاً نثرياً.
- [ ] قسم Quality Gates يحدد معايير **قابلة للملاحظة (Observable)** لكل من PASS وFIX وFAIL — لا معايير غامضة مثل "جودة جيدة".
- [ ] قسم Anti-Patterns يذكر أخطاءً فعلية متوقعة، لا عموميات.
- [ ] لا يتضمن أي إعادة تعريف لمصطلحات حاكمة (SDGM، KFSA، Signal، Decision) — تلك تعيش حصراً في `00-master-standards/`.

## 6. معيار القبول الحاسم (Acceptance Standard)

> **Skill بلا Inputs + Workflow + Output Format + Quality Gates ليس Skill.**
> هو وصف (Description) أُعيدت تسميته. أي ملف يُقترَح لهذا المجلد ولا يحقق الأقسام الأربعة هذه بشكل تنفيذي فعلي يُرفض بنتيجة **FAIL** من `crag` أو `product-governor` قبل قبوله.

## 7. جرد المهارات الحالي (Current Skill Inventory) — v1.0

| # | الملف | الغرض الموجز | External Output | Internal Quality Gate |
|---|---|---|---|---|
| 1 | `executive-brief-skill.md` | تلخيص تنفيذي لحدث/تقرير لصانع قرار | Executive Brief + Evidence Status | PASS / FIX / FAIL |
| 2 | `competitor-trust-audit-skill.md` | تدقيق مصداقية منافس أو ادعاء تسويقي | TRUST / VERIFY / AVOID | PASS / FIX / FAIL |
| 3 | `cash-recovery-decision-skill.md` | تحديد مسار تحصيل مالي (ESTARED/NCGR) | COLLECT / RECONCILE / ESCALATE / HOLD / WRITE-OFF REVIEW | PASS / FIX / FAIL |
| 4 | `product-governance-review-skill.md` | مراجعة اتساق منتج مع حوكمة NEXGEGL | PASS / FIX / FAIL | PASS / FIX / FAIL |
| 5 | `claude-code-pr-review-skill.md` | مراجعة Pull Request قبل الدمج | MERGE READY / FIX BEFORE MERGE / BLOCK MERGE | PASS / FIX / FAIL |
| 6 | `board-response-skill.md` | صياغة رد على مستوى مجلس إدارة | Final Board-Level Response | PASS / FIX / FAIL |
| 7 | `client-discovery-skill.md` | تحويل طلب عميل خام إلى نطاق مشروع منظَّم | Discovery Scope + Readiness Check | PASS / FIX / FAIL |
| 8 | `pricing-scope-skill.md` | بناء نطاق وتسعير عرض تجاري | Scope + Price Range + Margin Risk Flag | PASS / FIX / FAIL |
| 9 | `evidence-pack-builder-skill.md` | تجميع حزمة أدلة قبل أي قرار | Evidence Pack + Decision Readiness | PASS / FIX / FAIL |

ملاحظة تشغيلية: المخرج الخارجي للـ Skill قد يكون حكماً متخصصاً مثل TRUST/VERIFY/AVOID أو MERGE READY، لكن بوابة الجودة الداخلية لكل Skill تبقى دائماً PASS/FIX/FAIL لضمان قابلية المراجعة والحوكمة.

## 8. حالة هذا الإصدار

هذه v1.0 من حزمة المهارات التشغيلية. كل ملف هنا دليل تنفيذي كامل وليس وصفاً. لا يتضمن هذا الإصدار كوداً تطبيقياً (سكربتات أتمتة فعلية) — تلك تعيش لاحقاً في `07-installers/` إن استُدعيت.

This README includes v1.1 wording normalization for skill inventory verdicts.
