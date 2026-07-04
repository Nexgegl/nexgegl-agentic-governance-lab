# NCGR Payment Promised vs Recovered Benchmark v1.0

> هذا تقرير **محاكاة (Simulation)** فقط لاختبار منطق `05-routines/pr-pre-merge-review.md` (PR Review Runtime v1.0) مقابل PR افتراضي يمس منطق تصنيف حالة الاسترداد داخل NCGR. لا يوجد PR حقيقي، لا كود تطبيقي، ولا تعديل على أي ملف Runtime/Standard/Skill/Agent/Profile/Benchmark قائم. الغرض التحقق من أن قاعدة **Payment Promised ≠ Recovered** (المعرَّفة في `04-skills/cash-recovery-decision-skill.md` §4 وفي `02-product-profiles/ncgr/CLAUDE.ncgr.md` §4) تُطبَّق فعلياً ولا يمكن الالتفاف عليها عبر منطق كود.

## Executive Verdict

**BLOCK MERGE**

## Scenario

- **PR Title:** "Mark promised payments as recovered in NCGR dashboard"
- **Changed File:** `apps/ncgr/src/recovery/status.ts`
- **Proposed Logic:**
  > If `customer_status = "PROMISED_TO_PAY"` and `promised_payment_date` is present, set `recovery_status = "RECOVERED"` and include amount in `recovered_cash_total`.
- **Simulated Data:**
  - Account: `ACME-001`
  - Outstanding amount: SAR 60,000
  - Customer status: `PROMISED_TO_PAY`
  - Promised payment date: `2026-07-10`
  - Bank receipt: missing
  - Bank statement match: missing
  - Accounting entry: missing
  - Settlement confirmation: missing
  - Human approval: missing
  - Audit note: "Customer promised to pay next week"

## Runtime Trigger Analysis

| Trigger | Present? | Activated Agent / Skill | Notes |
|---|---|---|---|
| منطق يمس حسابات مالية/تدفقات إيراد/قيمة رقمية يُبنى عليها قرار مالي (`cfo-logic-reviewer.md` §1) | نعم | `cfo-logic-reviewer` | التغيير يحدد مباشرة قيمة `recovered_cash_total`، وهو رقم يُبنى عليه قرار مالي/تقرير |
| منطق يقرأ أو يكتب بيانات مستأجر أو عميل (§7 من الـ Routine) | نعم | `security-rls-auditor` | `status.ts` يكتب حالة استرداد مستمرة (Persisted) على مستوى حساب عميل (`ACME-001`) — بيانات عميل محفوظة، ولو لم يمس المسار حرفياً `supabase/`/`rls`/`auth` |
| محتوى يمس `02-product-profiles/` أو منطق قرار داخل NCGR (§10 من `CLAUDE.ncgr.md`) | نعم | `product-governor` — أعلى مستوى صرامة | الميزة تمس مباشرة "مسار اتخاذ القرار داخل NCGR"، مما يُلزم مراجعة `product-governor` و`cfo-logic-reviewer` صراحة وفق §10 من بروفايل NCGR |
| خرق فصل SDGM/KFSA أو Signal/Decision أو سلسلة Evidence+Authority+Audit (§6 من الـ Routine) | نعم | `crag` | المنطق يُرقّي إشارة ("وعد بالدفع") إلى حالة نهائية ("مُسترَد") آلياً دون صلاحية بشرية أو دليل — خرق مباشر لـ "لا ترقية تلقائية للإشارة إلى قرار" |
| ادعاء عام/موجَّه للعملاء/تسويقي/تنظيمي (§7 من الـ Routine، محفزات `legal-compliance-reviewer`) | **لا (في نطاق هذا الـ PR تحديداً)** | `legal-compliance-reviewer` = **N/A مشروط** | لوحة NCGR داخلية افتراضياً (Product Repo داخلي وفق §5 من بروفايل NCGR)، لا لغة SAMA/PDPL/تسعير/شهادات في هذا التغيير — **لكن** إن كانت هذه الحالة تُعرَض لاحقاً في تقرير/لوحة موجَّهة للعملاء (ESTARED) يصبح التفعيل إلزامياً فوراً |
| تصنيف المستودع غير مذكور صراحة في السيناريو (§4 Missing Input Rule من الـ Routine) | نعم (غياب) | — | يُعامَل المستودع مؤقتاً كأعلى درجة صرامة حتى يثبت خلاف ذلك؛ هذا لا يُخفّف النتيجة، بل يُشدِّدها إن كان هناك شك |

## Activated Agents

| Agent | Required? | Reason |
|---|---|---|
| `crag` | ✅ نعم — إلزامي دائماً | يفحص خرق فصل Signal/Decision وسلسلة Evidence+Authority+Audit؛ هذا المنطق يحوّل إشارة (وعد بالدفع) إلى واقع مالي نهائي (مُسترَد) دون أي بوابة صلاحية |
| `product-governor` | ✅ نعم — إلزامي دائماً + إلزام صريح إضافي وفق §10 من بروفايل NCGR | الميزة تمس "مسار اتخاذ القرار داخل NCGR"، وتخالف Core Rule صريح: **Payment Promised ≠ Recovered** (§4 من `CLAUDE.ncgr.md`) |
| `cfo-logic-reviewer` | ✅ **نعم — مطلوب** | التغيير يمس حساب `recovered_cash_total` مباشرة؛ ينطبق عليه حرفياً "القاعدة الحرجة" في §5 من ملفه: تنفيذ فعل مالي نافذ دون Evidence/Authority/Audit = FAIL فورية |
| `legal-compliance-reviewer` | ⛔ **N/A لهذا الـ PR تحديداً (مشروط)** | لا لغة ادعاء عام/تنظيمي/تسويقي في هذا التغيير الداخلي؛ يصبح **إلزامياً** إن أثّرت هذه الحالة على تقارير/لوحات موجَّهة للعملاء أو مستثمرين |
| `security-rls-auditor` | ✅ **مطلوب (Required)** | `status.ts` يكتب حالة استرداد محفوظة على مستوى حساب عميل — بيانات عميل/مستأجر يُكتَب إليها، وفق معيار "أي منطق يقرأ أو يكتب بيانات مستأجر أو عميل" في §7 من الـ Routine وبروفايل NCGR §6 |

## Required Skills

| Skill | Required? | Reason |
|---|---|---|
| `claude-code-pr-review-skill` | ✅ نعم — دائماً | تقييم الـ PR بصيغة MERGE READY / FIX BEFORE MERGE / BLOCK MERGE (§5 من الـ Routine) |
| `product-governance-review-skill` | ✅ نعم — دائماً | تقييم اتساق التغيير مع حوكمة NEXGEGL وبروفايل NCGR |
| `cash-recovery-decision-skill` | ✅ **نعم — مطلوب مباشرة** | هذا الـ Skill هو المرجع التنفيذي لتصنيف "موعود" مقابل "مُسترَد فعلياً"؛ شرط FAIL الصريح فيه ("التحليل يعامل مبلغاً موعوداً كمُسترَد فعلياً" §7) يُطابق هذا السيناريو حرفياً |
| `evidence-pack-builder-skill` | ✅ **نعم — مطلوب** | لتوثيق فجوات الدليل (Evidence Gaps) قبل الحكم بجاهزية أي حالة "مُسترَد" للاعتماد |
| `executive-brief-skill` | ⛔ N/A | لا يُنتَج ملخص إداري في نطاق هذا الـ PR |
| `pricing-scope-skill` | ⛔ N/A | لا مساس بتسعير |
| `competitor-trust-audit-skill` | ⛔ N/A | لا ادعاء منافس |

## Evidence Review

| Evidence Item | Present? | Required For RECOVERED? | Finding |
|---|---|---|---|
| Bank receipt | No | Yes | Missing |
| Bank statement match | No | Yes | Missing |
| Accounting entry | No | Yes | Missing |
| Settlement confirmation | No | Yes | Missing |
| Human approval | No | Yes | Missing |
| Audit note | Partial ("Customer promised to pay next week") | No, insufficient alone | Promise note is not recovery evidence — it documents a *signal*, not a *settlement* |

**Evidence Pack Builder — محاكاة موجزة:**
- **Evidence Required:** إيصال بنكي أو مطابقة كشف حساب، قيد محاسبي، تأكيد تسوية، موافقة/تفويض بشري موثَّق، سجل تدقيق.
- **Evidence Received:** لا شيء من القائمة أعلاه — فقط ملاحظة لفظية غير موثَّقة ("وعد العميل بالدفع").
- **Evidence Gaps:** جميع البنود الخمسة الحاسمة (إيصال/مطابقة/قيد/تسوية/موافقة).
- **Decision Readiness:** **غير جاهز إطلاقاً (Not Ready)** — فجوة حرجة كاملة، لا يجوز تصنيف الحالة "جاهزة للاعتماد".

## Status Classification

| Input Status | Proposed Output | Correct Output | Verdict |
|---|---|---|---|
| `PROMISED_TO_PAY` | `RECOVERED` | `PROMISED` / `PENDING_PAYMENT` / `FOLLOW_UP_REQUIRED` | **FAIL** |

`PROMISED_TO_PAY` هي حالة إشارة/متابعة (Signal/Follow-up State) بطبيعتها، وليست حالة نقد مُسترَد. ترقيتها آلياً إلى `RECOVERED` هي بالتحديد ما تحظره قاعدة **Payment Promised ≠ Recovered**.

## Financial Impact Review

- مبلغ SAR 60,000 المستحق **يجب ألا يُدرَج** في `recovered_cash_total`.
- إدراجه يُنتج **تضخيماً مادياً (Material Overstatement)** لرقم النقد المُسترَد فعلياً — رقم يُحتمل أن يُبنى عليه تقرير إداري أو مالي.
- المعالجة المالية الصحيحة: يبقى المبلغ **مستحقاً (Outstanding)** حتى يتوفر دليل فعلي على التسوية (Settlement).
- تاريخ الوعد بالدفع (`promised_payment_date`) يصلح فقط كأساس لجدولة متابعة (`follow_up_due_date`)، لا كأساس للاعتراف بإيراد أو نقد.

## Legal / Compliance Review

- إن ظُهِرت هذه الحالة خارجياً كـ"مُسترَدة"، فهذا يُنتج **ادعاء استرداد مضلِّلاً** يخالف قواعد الادعاءات في بروفايل ESTARED (§6) وقاعدة Payment Promised ≠ Recovered في بروفايل NCGR (§4).
- وعد الدفع **يجب ألا يُسوَّق أو يُقرَّر أو يُعرَض** كاسترداد فعلي في أي تقرير أو لوحة عميل/مستثمر.
- لا يجوز الإيحاء بأي "ضمان استرداد" (Guaranteed Recovery) استناداً على هذه الحالة.
- **`legal-compliance-reviewer` يصبح إلزامياً** إن أثّرت هذه الحالة على تقارير موجَّهة للعملاء، ادعاءات عامة، تقارير مستثمرين، أو لوحات عميل خارجية (ESTARED-facing) — وهو غير مؤكَّد الحدوث ضمن نطاق هذا الـ PR الداخلي تحديداً، لكنه **خطر تابع (Downstream Risk)** يجب تتبعه إن استُخدمت هذه الحالة خارج لوحة NCGR الداخلية.

## Decision Aggregation

- **`cfo-logic-reviewer` = FAIL** — تنفيذ فعل مالي نافذ (تصنيف مبلغ كمُسترَد وإدراجه في إجمالي مُسترَد فعلي) دون Evidence + Authority + Audit، مطابق حرفياً لـ "القاعدة الحرجة" في §5 من ملفه.
- **`product-governor` = FAIL** — خرق مباشر لـ Core Rule صريح في بروفايل NCGR (§4): **Payment Promised ≠ Recovered**.
- **`crag` = FAIL** (وليس FIX) — الانتهاك جوهري: ترقية آلية لإشارة (وعد) إلى واقع مالي نهائي دون صلاحية بشرية، خرق مباشر لفصل Signal/Decision ولقاعدة "لا ترقية تلقائية للإشارة إلى قرار".
- **`evidence-pack-builder-skill` = FAIL** — الحزمة تفتقر لكل بند حاسم (5/5 فجوات) بينما المنطق المقترح يُعامِلها ضمنياً كـ"جاهزة للاعتماد"؛ هذا يطابق حرفياً شرط FAIL في §7 من الـ Skill.
- **`legal-compliance-reviewer` = N/A** ضمن نطاق هذا الـ PR الداخلي المحدد؛ **يتحول إلى FAIL فوراً** إن استُخدمت هذه الحالة في أي سياق موجَّه للعملاء أو المستثمرين دون تصحيح.
- **`security-rls-auditor` = Required** (مطلوب وليس N/A) — لأن `status.ts` يكتب بيانات حساب/استرداد محفوظة على مستوى عميل؛ نتيجته الفعلية تعتمد على مراجعة سياسات الوصول لهذا الكتابة، لكنه لا يُعفى من التفعيل بصرف النظر عن ذلك.
- **النتيجة الإجمالية = BLOCK MERGE**، وفق §8 من الـ Routine: أي وكيل يُصدر FAIL → BLOCK MERGE إجمالي، وهنا ثلاثة وكلاء إلزاميون (`crag`, `product-governor`, `cfo-logic-reviewer`) يُصدرون FAIL في آنٍ واحد.

**لا يمكن أن يكون هذا الـ PR MERGE READY.** حتى مع توفر موافقة بشرية لاحقة، يبقى الحد الأدنى **FIX BEFORE MERGE** إلى أن يُعاد تصميم المنطق وفق القسم التالي وتصدر كل المراجعات المطلوبة PASS.

## Correct Safer Logic

```
If customer_status = "PROMISED_TO_PAY" and promised_payment_date is present:
  - set recovery_status = "PROMISED" or "FOLLOW_UP_REQUIRED"
  - exclude amount from recovered_cash_total
  - create follow_up_due_date = promised_payment_date
  - require evidence before RECOVERED:
      - bank receipt OR bank statement match
      - accounting entry
      - settlement confirmation
      - authorized review/approval
      - audit log entry

Only set RECOVERED when actual payment evidence is present and approved.
```

هذا المنطق البديل يُبقي الفصل سليماً بين:
- **الإشارة (Signal):** وعد العميل بالدفع → حالة متابعة، لا حالة استرداد.
- **الدليل (Evidence):** إيصال/مطابقة/قيد/تسوية — لا يُفترض أي منها، بل يُتحقَّق فعلياً.
- **الصلاحية (Authority):** لا تتحول الحالة إلى `RECOVERED` إلا بعد مراجعة واعتماد بشري موثَّق.
- **التدقيق (Audit):** كل تحويل إلى `RECOVERED` يُسجَّل بسجل تدقيق مستقل.

## Final Recommendation

- **لا يُدمَج هذا الـ PR الافتراضي بصيغته الحالية.**
- إبقاء `PROMISED_TO_PAY` منفصلاً تماماً عن `RECOVERED` في كل منطق الكود والتقارير.
- إضافة اختبارات (Tests) تمنع دخول أي مبلغ "موعود" إلى `recovered_cash_total` دون دليل تسوية فعلي.
- اشتراط دليل وسجل تدقيق واعتماد بشري صريح قبل السماح بحالة `RECOVERED`.
- إعادة تشغيل PR Review Runtime بعد إعادة التصميم؛ لا يُعتمد أي تجاوز لنتيجة BLOCK MERGE إلا بتفويض بشري صريح وموثَّق من صاحب صلاحية الدمج النهائية، وفق §9 من الـ Routine.
