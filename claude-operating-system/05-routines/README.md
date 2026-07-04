# NEXGEGL Routines — دليل التشغيل
## claude-operating-system/05-routines/ — v1.0

> يُقرأ مع `../00-master-standards/NEXGEGL_CLAUDE_MASTER.md` و`../04-skills/README.md` و`../03-sub-agents/`. لا يناقض أياً منها، ولا يعيد تعريف أي مصطلح حاكم وارد فيها.

---

## 1. ما هو Routine في NEXGEGL؟

**Routine** هنا هو **آلية تفعيل مجدولة أو مبنية على حدث (Event/Schedule-Triggered Mechanism)** توثّق متى وكيف يُستدعى وكيل واحد أو أكثر (Sub-Agent)، وأي Skills يستخدمها هؤلاء الوكلاء، لإنتاج قرار أو تقرير حوكمي موحّد.

Routine **ليس** Skill مستقلاً بذاته، ولا وكيلاً. هو طبقة **تنسيق (Orchestration)** تربط:

```
Trigger (حدث/جدولة) → Agent(s) → Skill(s) → Output محكوم بـ PASS/FIX/FAIL
```

## 2. الفرق بين Skill وRoutine

| المعيار | Skill | Routine |
|---|---|---|
| **الطبيعة** | دليل تنفيذ لمهمة واحدة محددة | آلية تنسيق تُشغِّل وكيلاً/وكلاء عند حدث أو جدولة |
| **من يستخدمه** | أي وكيل يحتاج تنفيذ تلك المهمة | يُشغِّل هو نفسه الوكلاء المطلوبين |
| **التفعيل** | يُستدعى يدوياً ضمن سياق مهمة | له Trigger محدد (PR، جدولة زمنية، طلب صريح) |
| **المخرج** | مخرج Skill واحد (مثال: MERGE READY) | تقرير مُجمَّع من عدة وكلاء/Skills وفق قاعدة تجميع |
| **مكان التعريف** | `04-skills/` | `05-routines/` |

**العلاقة الثابتة:** Routine → Agent → Skill → Output محكوم بـ PASS/FIX/FAIL (كما هو معرَّف في `04-skills/README.md` §2).

## 3. جرد Routines الحالي (Current Routine Inventory)

| # | الملف | الغرض الموجز | التفعيل |
|---|---|---|---|
| 1 | `pr-pre-merge-review.md` | مراجعة حوكمية موحدة لكل Pull Request قبل الدمج | كل PR قبل الدمج |
| 2 | `supabase-rls-audit.md` | تدقيق دوري لسياسات RLS في قواعد بيانات Supabase/PostgreSQL | دوري + فوري عند تغيير Schema/RLS |
| 3 | `weekly-governance-drift-report.md` | رصد انحراف تراكمي عن المعيار الرئيسي والـ Product Profiles | جدولة أسبوعية |

## 4. كيف يستخدم PR Review Runtime الـ Skills والوكلاء

`pr-pre-merge-review.md` (PR Review Runtime v1.0) هو المرجع التنفيذي لهذا الربط:

- **Skills المستخدمة:** `claude-code-pr-review-skill.md` (دائماً)، `product-governance-review-skill.md` (دائماً)، `evidence-pack-builder-skill.md` (عند غياب الأدلة).
- **الوكلاء المشاركون:** `crag` (دائماً)، `product-governor` (دائماً)، `security-rls-auditor` (عند تغيّر ملفات قاعدة بيانات/مصادقة/RLS/Supabase).
- **قاعدة التجميع:** أي FAIL/BLOCK MERGE من أي وكيل → BLOCK MERGE إجمالي. لا FAIL لكن يوجد FIX/FIX BEFORE MERGE → FIX BEFORE MERGE إجمالي. الكل PASS/MERGE READY → MERGE READY.

راجع الملف نفسه لصيغة المدخلات المطلوبة والمخرجات الكاملة.

## 5. بوابات جودة الـ Routine (Routine Quality Gates)

قبل قبول أي Routine جديد أو تحديث Routine قائم في هذا المجلد، يجب أن يحقق:

- [ ] Trigger محدد بوضوح (حدث أو جدولة)، لا صياغة غامضة مثل "عند الحاجة".
- [ ] قائمة صريحة بالوكلاء المشاركين ومتى يُستدعى كل منهم (إلزامي دائماً / إلزامي بشرط).
- [ ] قائمة صريحة بالـ Skills المستخدمة، مع الإشارة إلى الملف الفعلي في `04-skills/`.
- [ ] قاعدة تجميع نتيجة حاسمة وغير قابلة للتأويل (لا "حسب التقدير").
- [ ] صيغة مخرجات ثابتة وقابلة للنسخ والتنفيذ الفوري.
- [ ] لا يعيد تعريف أي مصطلح حاكم (SDGM، KFSA، Signal، Decision، ESTARED) — تلك تعيش حصراً في `00-master-standards/`.

## 6. كيفية إضافة Routine مستقبلي

1. أنشئ ملفاً جديداً باسم `<kebab-case-topic>.md` في `05-routines/`.
2. اتبع بنية الملفات القائمة: الغرض (Purpose) → التفعيل (Trigger) → المدخلات/الوكلاء/الـ Skills → قاعدة التجميع → صيغة المخرجات → أي ملاحظات نطاق.
3. تحقق من بوابات الجودة في القسم 5 أعلاه قبل الطرح للمراجعة.
4. أضف سطراً في جدول جرد Routines (القسم 3 أعلاه).
5. أي Routine جديد يمر عبر مراجعة `crag` أو `product-governor` بنتيجة PASS قبل اعتماده نهائياً في هذا المجلد.
