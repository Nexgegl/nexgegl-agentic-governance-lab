# NCGR Partial Evidence Case Benchmark v1.0

> هذا تقرير **محاكاة (Simulation)** فقط لاختبار منطق `05-routines/pr-pre-merge-review.md` (PR Review Runtime v1.0) مقابل PR افتراضي يمس منطق تصنيف حالة الاسترداد داخل NCGR. هذا التقرير هو **الحالة الوسطى (Middle Case)** التي تُكمِل ثالوث حالة الاسترداد في NCGR:
> - **لا دليل** → `BLOCK MERGE` (انظر `ncgr-payment-promised-vs-recovered-v1.md`)
> - **دليل جزئي / صلاحية أو تدقيق ناقص** → `FIX BEFORE MERGE` (هذا التقرير)
> - **دليل + صلاحية + تدقيق كاملة** → `MERGE READY` (انظر `ncgr-recovered-evidence-positive-v1.md`)
>
> لا يوجد PR حقيقي، لا كود تطبيقي، ولا تعديل على أي ملف Runtime/Standard/Skill/Agent/Profile/Benchmark/Index قائم.

## Executive Verdict

**FIX BEFORE MERGE**

## Scenario

- **PR Title:** "Mark bank-matched payments as recovered before approval audit completion"
- **Changed File:** `apps/ncgr/src/recovery/status.ts`
- **Proposed Logic:**
  > If `customer_status = "SETTLED"` and `bank_statement_match = true` and `bank_transaction_reference` exists and `accounting_entry_id` exists, then set `recovery_status = "RECOVERED"` and include amount in `recovered_cash_total`, **even if** `approved_by` is missing and `audit_log_id` is missing.
- **Simulated Data:**
  - Account: `ACME-001`
  - Outstanding amount: SAR 60,000
  - Customer status: `SETTLED`
  - Bank receipt: `receipt-7781.pdf`
  - Bank statement match: `true`
  - Bank transaction reference: `BNK-2026-0710-88921`
  - Accounting entry: `JE-2026-1442`
  - Settlement confirmation: missing
  - Human approval: missing
  - Approval timestamp: missing
  - Audit log: missing
  - Audit note: missing

## Runtime Trigger Analysis

| Trigger | Present? | Activated Agent / Skill | Notes |
|---|---|---|---|
| منطق يمس حسابات مالية/تدفقات إيراد/قيمة رقمية يُبنى عليها قرار مالي (`cfo-logic-reviewer.md` §1) | نعم | `cfo-logic-reviewer` | التغيير يحدد قيمة `recovered_cash_total` بناءً على دليل بنكي/محاسبي جزئي فقط |
| منطق يقرأ أو يكتب بيانات مستأجر أو عميل (§7 من الـ Routine) | نعم | `security-rls-auditor` | `status.ts` يكتب حالة استرداد محفوظة على مستوى حساب عميل (`ACME-001`) — نفس محفز البنشمارك السلبي والإيجابي |
| محتوى يمس `02-product-profiles/` أو منطق قرار داخل NCGR (§10 من `CLAUDE.ncgr.md`) | نعم | `product-governor` — أعلى مستوى صرامة | الميزة تمس مباشرة "مسار اتخاذ القرار داخل NCGR"، ويبقى إلزام §10 قائماً |
| خرق فصل SDGM/KFSA أو Signal/Decision أو سلسلة Evidence+Authority+Audit (§6 من الـ Routine) | **جزئي (Partial)** | `crag` | المنطق يحتوي بوابة دليل حقيقية (4 من 7 شروط محقَّقة)، لكنه يُرقّي إلى `RECOVERED` رغم غياب الصلاحية (`approved_by`) والتدقيق (`audit_log_id`) صراحة — فجوة قابلة للتصحيح، لا تجاهل كامل للسلسلة |
| ادعاء عام/موجَّه للعملاء/تسويقي/تنظيمي (§7 من الـ Routine) | لا | `legal-compliance-reviewer` = **N/A مشروط** | لوحة NCGR داخلية، لا لغة ادعاء عام في هذا التغيير؛ يصبح إلزامياً فقط إن عُرضت هذه الحالة الجزئية خارجياً |
| حالة الاختبار/البناء (Test/Build Status) غير مذكورة صراحة في السيناريو (§4 Missing Input Rule من الـ Routine) | غير مذكورة | — | يُخفِّض هذا وحده النتيجة إلى `FIX BEFORE MERGE` على الأقل بصرف النظر عن أي شيء آخر — وهو متسق مع الحكم النهائي هنا، لا مضاد له |

## Activated Agents

| Agent | Required? | Reason |
|---|---|---|
| `crag` | ✅ نعم — إلزامي دائماً | فجوة **جزئية وقابلة للتصحيح** في سلسلة Evidence+Authority+Audit — دليل حقيقي موجود لكن الصلاحية والتدقيق غائبان صراحة عن شرط الترقية |
| `product-governor` | ✅ نعم — إلزامي دائماً + إلزام صريح إضافي وفق §10 من بروفايل NCGR | لا يخالف Core Rule **Payment Promised ≠ Recovered** بشكل كامل (الدفعة ليست مجرد وعد)، لكن الترقية إلى `RECOVERED` النهائية تسبق اكتمال الحوكمة المطلوبة (صلاحية + تدقيق) |
| `cfo-logic-reviewer` | ✅ **نعم — مطلوب** | التغيير يمس `recovered_cash_total` مباشرة؛ الدليل المالي/البنكي حقيقي وموجود، لكن بوابة الاعتماد (Approval Gate) غير مكتملة — هذا يختلف عن الحالة السلبية التي لم يكن فيها أي دليل أو بوابة إطلاقاً |
| `security-rls-auditor` | ✅ **مطلوب (Required)** | `status.ts` يكتب حالة استرداد محفوظة على مستوى حساب عميل — نفس محفز الكتابة الموجود في كِلا البنشمارك السلبي والإيجابي |
| `legal-compliance-reviewer` | ⛔ **N/A لهذا الـ PR تحديداً (مشروط)** | لا لغة ادعاء عام/تنظيمي/تسويقي في هذا التغيير الداخلي؛ يصبح إلزامياً إن عُرضت هذه الحالة الجزئية في تقرير/لوحة موجَّهة للعملاء كـ"مُسترَدة" رغم نقص الصلاحية/التدقيق |

## Required Skills

| Skill | Required? | Reason |
|---|---|---|
| `claude-code-pr-review-skill` | ✅ نعم — دائماً | تقييم الـ PR بصيغة MERGE READY / FIX BEFORE MERGE / BLOCK MERGE (§5 من الـ Routine) |
| `product-governance-review-skill` | ✅ نعم — دائماً | تقييم اتساق التغيير مع حوكمة NEXGEGL وبروفايل NCGR |
| `cash-recovery-decision-skill` | ✅ **نعم — مطلوب مباشرة** | يفحص التمييز بين "موعود" و"مُسترَد فعلياً"؛ هنا الحالة ليست "موعوداً" (يوجد دليل بنكي حقيقي)، لكنها ليست "مُسترَداً مكتملاً" أيضاً — فجوة توثيق قابلة للتصحيح، تطابق شرط FIX الصريح في §7 من الـ Skill |
| `evidence-pack-builder-skill` | ✅ **نعم — مطلوب** | لتوثيق أن Evidence Received جزئي (4 من 7 بنود) وEvidence Gaps محددة بدقة (تسوية/موافقة/تدقيق) |
| `executive-brief-skill` | ⛔ N/A | لا يُنتَج ملخص إداري في نطاق هذا الـ PR |
| `pricing-scope-skill` | ⛔ N/A | لا مساس بتسعير |
| `competitor-trust-audit-skill` | ⛔ N/A | لا ادعاء منافس |

## Evidence Review

| Evidence Item | Present? | Required For RECOVERED? | Finding |
|---|---|---|---|
| Bank receipt | Yes | Yes | Present (`receipt-7781.pdf`) |
| Bank statement match | Yes | Yes | Present (`bank_statement_match = true`) |
| Bank transaction reference | Yes | Yes | Present (`BNK-2026-0710-88921`) |
| Accounting entry | Yes | Yes | Present (`JE-2026-1442`) |
| Settlement confirmation | No | Yes | Missing |
| Human approval | No | Yes | Missing |
| Audit log | No | Yes | Missing |

**Evidence Pack Builder — محاكاة موجزة:**
- **Evidence Required:** إيصال بنكي أو مطابقة كشف حساب، مرجع معاملة بنكية، قيد محاسبي، تأكيد تسوية، موافقة/تفويض بشري موثَّق، سجل تدقيق.
- **Evidence Received:** 4 من 7 بنود — إيصال بنكي، مطابقة كشف حساب، مرجع معاملة، قيد محاسبي، جميعها من مصدر أولي موثَّق.
- **Evidence Gaps:** تأكيد التسوية (Settlement Confirmation)، الموافقة البشرية (Human Approval)، سجل التدقيق (Audit Log).
- **Source Reliability:** الأدلة المستلمة أولية وموثَّقة (نظام بنكي/محاسبي)؛ لا دليل لفظي بينها.
- **Decision Readiness:** **جاهز جزئياً (Partially Ready)** — دليل مالي حقيقي وقوي، لكن فجوة حوكمية حرجة (صلاحية + تدقيق) تمنع الاعتماد النهائي الآن.
- **Next Evidence Request:** طلب `settlement_confirmation_id`، `approved_by` (من جهة مخوَّلة، مثال: CFO أو مسؤول استرداد معتمد)، و`audit_log_id` قبل إعادة التقييم.

## Status Classification

| Input Status | Proposed Output | Correct Output | Verdict |
|---|---|---|---|
| `SETTLED` with bank/accounting evidence but missing approval + audit | `RECOVERED` | `PENDING_APPROVAL` / `REVIEW_REQUIRED` / `PENDING_AUDIT` | **FIX** |

هذه الحالة **ليست** `PROMISED_TO_PAY` (يوجد دليل بنكي/محاسبي حقيقي وليس مجرد وعد لفظي)، لكنها أيضاً **ليست** `RECOVERED` مكتملة الحوكمة. التصنيف الصحيح هو حالة انتقالية (`PENDING_APPROVAL`/`REVIEW_REQUIRED`/`PENDING_AUDIT`) تعكس دقة الدليل الموجود دون الادعاء بأن القرار النهائي قد اكتمل.

## Financial Impact Review

- مبلغ SAR 60,000 **يجب ألا يُثبَّت نهائياً (Finalized)** في `recovered_cash_total` حتى تتوفر الموافقة والتدقيق.
- الدليل البنكي/المحاسبي يشير إلى احتمال أن الدفعة حقيقية فعلاً، لذا هذه الحالة **مختلفة جوهرياً** عن `PROMISED_TO_PAY` (وعد لفظي بلا أي دليل).
- يجوز الاحتفاظ بالمبلغ في حالة **معلَّقة موثَّقة بدليل دفع (Pending Verified-Payment State)**، لكن ليس كـ`RECOVERED` نهائي.
- التقرير المالي النهائي للنقد المُسترَد يتطلب تأكيد تسوية، موافقة صلاحية، ومسار تدقيق — وهذه الثلاثة غائبة حالياً.

## Security / RLS Review

- `security-rls-auditor` **مطلوب** لأن `status.ts` يكتب حالة استرداد/حساب عميل محفوظة.
- **`FIX BEFORE MERGE` هنا يفترض** أن انتقال الحالة يجب أن يكون محصوراً بالمستأجر (Tenant-Scoped) ومُختبَراً من ناحية التفويض (Authorization-Tested) قبل اعتماده.
- إن كانت اختبارات RLS/تفويض الكتابة **غائبة فعلياً** في PR حقيقي، يبقى الحد الأدنى `FIX BEFORE MERGE`، وقد يرتفع إلى `BLOCK MERGE` إن ضَعُفت حدود الأمان فعلياً (مثال: سماح مستخدم غير مخوَّل بإتمام حالة `RECOVERED`).
- يجب ألا يسمح التغيير المقترح لأي مستخدم غير مخوَّل بإتمام حالة الاسترداد النهائية.

## Legal / Compliance Review

- `legal-compliance-reviewer` = **N/A** لهذا المنطق الداخلي طالما لا يوجد تقرير/ادعاء خارجي يعرض هذه الحالة.
- إن عُرضت هذه الحالة الجزئية خارجياً كـ"مُسترَدة"، يصبح `legal-compliance-reviewer` **إلزامياً** لمنع ادعاء استرداد مضلِّل — **لا يجوز أبداً عرض حالة دليل جزئي كنقد مُسترَد فعلي** لأي جمهور خارجي.

## Decision Aggregation

- **`cfo-logic-reviewer` = FIX** — دليل مالي/بنكي حقيقي موجود (4/7)، لكن بوابة الاعتماد (Evidence+Authority+Audit) غير مكتملة؛ هذا يختلف عن حالة FAIL في البنشمارك السلبي حيث لم يكن هناك أي دليل ولا بوابة إطلاقاً — هنا الفجوة محددة وقابلة للتصحيح مباشرة (إضافة 3 حقول محددة)، لا تجاهل جوهري للقاعدة.
- **`product-governor` = FIX** — لا خرق كامل لـ Payment Promised ≠ Recovered (الدفعة موثَّقة بنكياً)، لكن الترقية النهائية سابقة لأوانها حوكمياً.
- **`crag` = FIX** — السلسلة غير مكتملة لكنها **قابلة للتصحيح** بإضافة حقول محددة (`approved_by`, `audit_log_id`, `settlement_confirmation_id`)؛ هذا يختلف عن FAIL الذي يصف تجاهلاً جوهرياً وغير قابل للترقيع الفوري.
- **`evidence-pack-builder-skill` = FIX** — Evidence Gaps محددة بدقة (3 بنود)، Decision Readiness = جاهز جزئياً، لا "جاهز للاعتماد" زائفاً (وهو ما كان سيُصنَّف FAIL).
- **`security-rls-auditor` = FIX (بافتراض عدم التحقق بعد من اختبارات RLS/التفويض)** — لا دليل على ثغرة أمنية فعلية، لكن لا تأكيد أيضاً على اكتمال اختبارات العزل والتفويض؛ الافتراض الآمن هو FIX حتى يثبت خلاف ذلك.
- **`legal-compliance-reviewer` = N/A** ما لم تُعرَض الحالة خارجياً.
- **النتيجة الإجمالية = FIX BEFORE MERGE**، وفق §8 من الـ Routine: لا يوجد أي وكيل بنتيجة FAIL/BLOCK MERGE، لكن يوجد عدة وكلاء بنتيجة FIX → النتيجة الإجمالية FIX BEFORE MERGE.

**`MERGE READY` غير مسموح** لأن الصلاحية (Authority) والتدقيق (Audit) غير مكتملين — سلسلة Evidence+Authority+Audit تتطلب الأركان الثلاثة معاً، لا الدليل وحده.
**`BLOCK MERGE` غير مطلوب** لأن دليل الدفع الفعلي موجود (ليس مجرد وعد لفظي)، والعيب **قابل للتصحيح** بإضافة حقول محددة، لا يتطلب إعادة تصميم جوهرية أو يعكس محاولة تضليل.

## Correct Required Fixes

قبل استخدام `RECOVERED`، يجب إضافة:
- `settlement_confirmation_id`
- `approved_by`
- طابع زمني للموافقة (Approval Timestamp)
- `audit_log_id`
- `evidence_refs` تربط كل الأدلة المطلوبة ببعضها
- فحص تفويض محصور بالمستأجر (Tenant-Scoped Authorization Check)
- اختبارات تُثبت أن الكتابات غير المصرَّح بها مرفوضة
- اختبارات تُثبت أن الدليل الجزئي لا يمكن أن يدخل `recovered_cash_total` النهائي

**منطق أكثر أماناً مقترح:**

```
If bank_statement_match = true
and bank_transaction_reference exists
and accounting_entry_id exists
but approved_by or audit_log_id or settlement_confirmation_id is missing:
  - do not set RECOVERED
  - do not include amount in final recovered_cash_total
  - set status = PENDING_APPROVAL / PENDING_AUDIT / REVIEW_REQUIRED
  - create required_fix_items
  - require authorized approval and audit log before finalization
```

## Final Recommendation

- **لا يُدمَج هذا الـ PR الافتراضي حتى تُضاف الإصلاحات.**
- إبقاء الدليل الجزئي منفصلاً تماماً عن حالة الاسترداد النهائية.
- إضافة الموافقة، تأكيد التسوية، سجل التدقيق، `evidence_refs`، فحوصات تفويض المستأجر، والاختبارات المذكورة أعلاه.
- إعادة تشغيل PR Review Runtime بعد الإصلاح.
- **لا يُمنح أي تفويض دمج آلي.**
