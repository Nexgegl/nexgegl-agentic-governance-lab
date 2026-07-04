# NCGR Recovered Evidence Positive Case Benchmark v1.0

> هذا تقرير **محاكاة (Simulation)** فقط لاختبار منطق `05-routines/pr-pre-merge-review.md` (PR Review Runtime v1.0) مقابل PR افتراضي يمس منطق تصنيف حالة الاسترداد داخل NCGR. هذا التقرير هو **النظير الإيجابي (Positive Counterpart)** لـ `ncgr-payment-promised-vs-recovered-v1.md`: بينما ذلك التقرير أثبت أن وعداً بالدفع بلا دليل يُحظَر من التصنيف كـ`RECOVERED`، يثبت هذا التقرير أن `RECOVERED` **مسموح به فعلياً** عندما يتوفر دليل تسوية حقيقي + موافقة بشرية + سجل تدقيق كامل. لا يوجد PR حقيقي، لا كود تطبيقي، ولا تعديل على أي ملف Runtime/Standard/Skill/Agent/Profile/Benchmark/Index قائم.

## Executive Verdict

**MERGE READY**

## Scenario

- **PR Title:** "Mark verified settled payments as recovered in NCGR dashboard"
- **Changed File:** `apps/ncgr/src/recovery/status.ts`
- **Proposed Logic:**
  > If `customer_status = "SETTLED"` and `bank_statement_match = true` and `accounting_entry_id` exists and `settlement_confirmation_id` exists and `approved_by` exists and `audit_log_id` exists, then set `recovery_status = "RECOVERED"` and include amount in `recovered_cash_total`.
- **Simulated Data:**
  - Account: `ACME-001`
  - Outstanding amount: SAR 60,000
  - Customer status: `SETTLED`
  - Bank receipt: `receipt-7781.pdf`
  - Bank statement match: `true`
  - Bank transaction reference: `BNK-2026-0710-88921`
  - Accounting entry: `JE-2026-1442`
  - Settlement confirmation: `SETTLE-2026-331`
  - Human approval: `approved_by = CFO_USER_01`
  - Approval timestamp: `2026-07-10T14:22:00+03:00`
  - Audit log: `AUD-2026-9001`
  - Audit note: "Payment matched to bank statement and approved for recovered status."

## Runtime Trigger Analysis

| Trigger | Present? | Activated Agent / Skill | Notes |
|---|---|---|---|
| منطق يمس حسابات مالية/تدفقات إيراد/قيمة رقمية يُبنى عليها قرار مالي (`cfo-logic-reviewer.md` §1) | نعم | `cfo-logic-reviewer` | التغيير يحدد قيمة `recovered_cash_total`، لكن هذه المرة بأدلة تسوية فعلية داعمة |
| منطق يقرأ أو يكتب بيانات مستأجر أو عميل (§7 من الـ Routine) | نعم | `security-rls-auditor` | `status.ts` يكتب حالة استرداد محفوظة على مستوى حساب عميل (`ACME-001`) — نفس محفز السيناريو السلبي |
| محتوى يمس `02-product-profiles/` أو منطق قرار داخل NCGR (§10 من `CLAUDE.ncgr.md`) | نعم | `product-governor` — أعلى مستوى صرامة | يبقى إلزام §10 قائماً بصرف النظر عن كون النتيجة متوقَّعة PASS |
| خرق فصل SDGM/KFSA أو Signal/Decision أو سلسلة Evidence+Authority+Audit (§6 من الـ Routine) | **لا خرق هذه المرة** | `crag` يُفعَّل كالمعتاد (إلزامي دائماً) لكن لا يجد انتهاكاً | الترقية إلى `RECOVERED` هنا مشروطة بدليل + موافقة + تدقيق كاملين — هذا هو بالضبط ما تتطلبه سلسلة Evidence+Authority+Audit، لا التفافاً عليها |
| ادعاء عام/موجَّه للعملاء/تسويقي/تنظيمي (§7 من الـ Routine) | لا | `legal-compliance-reviewer` = **N/A مشروط** | لوحة NCGR داخلية، لا لغة SAMA/PDPL/تسعير/شهادات؛ يصبح إلزامياً فقط إن عُرضت هذه الحالة خارجياً |
| حالة الاختبار/البناء (Test/Build Status) غير مذكورة صراحة في السيناريو (§4 Missing Input Rule من الـ Routine) | غير مذكورة في السيناريو | — | **هذا المعيار يفترض أن الاختبارات موجودة وناجحة (Assumed Present and Passing)** لغرض هذا التمرين فقط. في PR حقيقي، غياب حالة الاختبار/البناء فعلياً يُخفِّض النتيجة إلى `FIX BEFORE MERGE` على الأقل وفق §4 من الـ Routine، بصرف النظر عن سلامة منطق الأدلة نفسه |

## Activated Agents

| Agent | Required? | Reason |
|---|---|---|
| `crag` | ✅ نعم — إلزامي دائماً | لا خرق لفصل Signal/Decision أو سلسلة Evidence+Authority+Audit؛ الترقية إلى `RECOVERED` مشروطة بدليل تسوية فعلي وموافقة بشرية وسجل تدقيق كامل — هذا اتساق تام مع القاعدة، لا التفاف عليها |
| `product-governor` | ✅ نعم — إلزامي دائماً + إلزام صريح إضافي وفق §10 من بروفايل NCGR | لا يوجد خرق لـ Core Rule **Payment Promised ≠ Recovered** — هذه ليست وعداً، بل تسوية موثَّقة فعلياً |
| `cfo-logic-reviewer` | ✅ **نعم — مطلوب** | يفحص أن التغيير في `recovered_cash_total` مدعوم بمسار Evidence/Authority/Audit كامل؛ هنا الأركان الثلاثة مكتملة (دليل بنكي/محاسبي، موافقة `CFO_USER_01`، سجل تدقيق `AUD-2026-9001`) |
| `security-rls-auditor` | ✅ **مطلوب (Required)** | `status.ts` يكتب حالة استرداد محفوظة على مستوى حساب عميل — نفس محفز الكتابة الموجود في السيناريو السلبي، بصرف النظر عن كون البيانات هذه المرة داعمة لـ `RECOVERED` |
| `legal-compliance-reviewer` | ⛔ **N/A لهذا الـ PR تحديداً (مشروط)** | لا لغة ادعاء عام/تنظيمي/تسويقي في هذا التغيير الداخلي؛ يصبح إلزامياً إن عُرضت هذه الحالة في تقرير/لوحة موجَّهة للعملاء أو المستثمرين، لضمان عدم تصويرها كـ"استرداد مضمون" |

## Required Skills

| Skill | Required? | Reason |
|---|---|---|
| `claude-code-pr-review-skill` | ✅ نعم — دائماً | تقييم الـ PR بصيغة MERGE READY / FIX BEFORE MERGE / BLOCK MERGE (§5 من الـ Routine) |
| `product-governance-review-skill` | ✅ نعم — دائماً | تقييم اتساق التغيير مع حوكمة NEXGEGL وبروفايل NCGR |
| `cash-recovery-decision-skill` | ✅ **نعم — مطلوب مباشرة** | يفحص هذا الـ Skill التمييز بين "موعود" و"مُسترَد فعلياً"؛ هنا التمييز واضح وموثَّق — شرط PASS الصريح في §7 من الـ Skill ("التمييز بين موعود ومُسترَد واضح") متحقق |
| `evidence-pack-builder-skill` | ✅ **نعم — مطلوب** | لتوثيق أن Evidence Required وEvidence Received متطابقان تماماً هذه المرة، و Decision Readiness = جاهز فعلاً للاعتماد |
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
| Settlement confirmation | Yes | Yes | Present (`SETTLE-2026-331`) |
| Human approval | Yes | Yes | Present (`approved_by = CFO_USER_01`, `2026-07-10T14:22:00+03:00`) |
| Audit log | Yes | Yes | Present (`AUD-2026-9001`) |

**Evidence Pack Builder — محاكاة موجزة:**
- **Evidence Required:** إيصال بنكي أو مطابقة كشف حساب، مرجع معاملة بنكية، قيد محاسبي، تأكيد تسوية، موافقة/تفويض بشري موثَّق، سجل تدقيق.
- **Evidence Received:** كل بند من القائمة أعلاه متوفر فعلياً ومرتبط بمرجع محدد (Reference ID)، لا ادعاء لفظي.
- **Evidence Gaps:** لا فجوات.
- **Source Reliability:** جميع الأدلة من مصادر أولية موثَّقة (نظام بنكي، نظام محاسبي، سجل موافقة بشرية، سجل تدقيق) — لا دليل لفظي أو ثانوي.
- **Decision Readiness:** **جاهز للاعتماد (Ready)** — لا فجوة حرجة، الحزمة كاملة.

## Status Classification

| Input Status | Proposed Output | Correct Output | Verdict |
|---|---|---|---|
| `SETTLED` with evidence + approval + audit | `RECOVERED` | `RECOVERED` | **PASS** |

`SETTLED` هنا ليست إشارة وعد؛ هي حالة مدعومة بدليل تسوية فعلي مطابَق بنكياً ومحاسبياً وموثَّق بموافقة بشرية وسجل تدقيق. ترقيتها إلى `RECOVERED` **لا تخالف** قاعدة **Payment Promised ≠ Recovered** — بل هي التطبيق الصحيح لها: الفرق الجوهري بين الحالتين هو وجود التسوية الفعلية الموثَّقة، لا مجرد القصد أو الوعد.

## Financial Impact Review

- مبلغ SAR 60,000 **يجوز إدراجه** في `recovered_cash_total` **فقط** لأن دليل تسوية فعلي موجود ومطابَق.
- هذه الحالة **ليست** Payment Promised؛ هذه **تسوية مُتحقَّق منها (Verified Settlement)**.
- القيد المحاسبي (`JE-2026-1442`) والمطابقة البنكية (`bank_statement_match = true` مع مرجع `BNK-2026-0710-88921`) يدعمان الاعتراف بالنقد (Cash Recognition).
- الموافقة البشرية (`approved_by`) وسجل التدقيق (`audit_log_id`) يدعمان جاهزية الحوكمة (Governance Readiness) لهذا التصنيف.
- يجب أن يبقى المبلغ **قابلاً للتتبع (Traceable)** إلى مراجع الأدلة نفسها (`evidence_refs`) في أي تقرير أو استعلام لاحق.

## Security / RLS Review

- `security-rls-auditor` **مطلوب** لأن `status.ts` يكتب حالة استرداد/حساب عميل محفوظة.
- **`MERGE READY` هنا يفترض** أن اختبارات عزل المستأجرين (Tenant Isolation)، سياسات RLS، واختبارات تفويض الكتابة (Write Authorization) **موجودة وناجحة فعلياً**.
- إن كانت اختبارات RLS/تفويض الكتابة **غائبة فعلياً** في PR حقيقي، تصبح النتيجة `FIX BEFORE MERGE` أو `BLOCK MERGE` حسب الخطورة (وفق §4 Missing Input Rule من الـ Routine: غياب حالة الاختبار يرفع الحد الأدنى إلى FIX BEFORE MERGE، ويرتفع إلى BLOCK MERGE إن مسّ التغيير auth/database/RLS/security مباشرة كما هو الحال هنا).
- يجب أن يبقى تغيير الحالة **محصوراً بالمستأجر (Tenant-Scoped)** وموثَّقاً بسجل تدقيق مستقل لكل عملية ترقية إلى `RECOVERED`.

## Legal / Compliance Review

- `legal-compliance-reviewer` = **N/A** لهذا المنطق الداخلي طالما لا يوجد ادعاء/تقرير موجَّه للعملاء يعرض هذه الحالة.
- إن عُرضت حالة `RECOVERED` هذه خارجياً (تقرير عميل، لوحة ESTARED، تقرير مستثمر)، يصبح `legal-compliance-reviewer` **إلزامياً** للتأكد من أنها لا تُصوَّر أو تُبالَغ كـ"استرداد مضمون" (Guaranteed Recovery) أو كنمط متكرر تلقائي، حتى لو كانت هذه الحالة بذاتها موثَّقة وصحيحة.

## Decision Aggregation

- **`cfo-logic-reviewer` = PASS** — الأركان الثلاثة (Evidence + Authority + Audit) مكتملة بالكامل لهذا التحويل المالي المحدد.
- **`product-governor` = PASS** — لا خرق لـ Core Rule؛ الحالة تسوية موثَّقة فعلياً، لا وعداً.
- **`crag` = PASS** — لا خرق لفصل Signal/Decision؛ الترقية مشروطة بدليل وموافقة وتدقيق، لا آلية عمياء.
- **`evidence-pack-builder-skill` = PASS** — لا فجوات دليل، Decision Readiness = جاهز فعلياً.
- **`security-rls-auditor` = PASS (بافتراض نجاح الاختبارات)** — مشروط بنجاح اختبارات عزل المستأجرين وRLS وتفويض الكتابة فعلياً، لا افتراضاً بلا تحقق.
- **`legal-compliance-reviewer` = N/A** ما لم تُعرَض الحالة خارجياً.
- **النتيجة الإجمالية = MERGE READY**، وفق §8 من الـ Routine: كل المراجعات المطلوبة (`crag`, `product-governor`, `cfo-logic-reviewer`) أصدرت PASS، ولا يوجد أي وكيل بنتيجة FAIL/FIX يخفض النتيجة.

> **تنبيه حاسم:** `MERGE READY` هنا يبقى **توصية مراجعة (Recommendation)** فقط، **وليس تفويضاً آلياً للدمج (Automatic Merge Authorization)** — وفق §9 (Final Merge Authority) من `pr-pre-merge-review.md`. الدمج الفعلي يتطلب صاحب صلاحية بشري أو Automation مصرَّح له صراحة في سياسة المستودع المحلية. كما أن هذا الحكم مبني على **افتراض** أن حالة الاختبار/البناء موجودة وناجحة فعلياً — أي PR حقيقي مطابق لهذا السيناريو يجب أن يُثبت ذلك فعلياً قبل اعتبار النتيجة صالحة.

## Correct Accepted Logic

```
If customer_status = "SETTLED"
and bank_statement_match = true
and bank_transaction_reference exists
and accounting_entry_id exists
and settlement_confirmation_id exists
and approved_by exists
and audit_log_id exists:
  - set recovery_status = "RECOVERED"
  - include amount in recovered_cash_total
  - link recovered status to evidence_refs
  - preserve tenant_id
  - write audit log entry
  - require authorization check before state transition

Otherwise:
  - do not set RECOVERED
  - do not include amount in recovered_cash_total
  - classify as PENDING_EVIDENCE / FOLLOW_UP_REQUIRED / REVIEW_REQUIRED based on missing items
```

هذا المنطق يُبقي الفصل سليماً بين:
- **الإشارة (Signal):** أي حالة بلا دليل تسوية كامل تبقى `PENDING_EVIDENCE` / `FOLLOW_UP_REQUIRED` / `REVIEW_REQUIRED`.
- **الدليل (Evidence):** كل بند (بنكي، محاسبي، تسوية) يُتحقَّق منه فعلياً عبر مرجع محدد، لا يُفترض.
- **الصلاحية (Authority):** `approved_by` وفحص تفويض صريح قبل أي انتقال حالة.
- **التدقيق (Audit):** `audit_log_id` إلزامي لكل تحويل إلى `RECOVERED`، مع ربط المبلغ بمراجع الأدلة (`evidence_refs`) للتتبع اللاحق.

## Final Recommendation

- يجوز لهذا الـ PR الافتراضي المضي قدماً نحو الموافقة البشرية/موافقة مالك الكود (Code Owner Approval) الاعتيادية **بشرط نجاح الاختبارات فعلياً**.
- إضافة اختبارات (Tests) تُثبت:
  - أن الدفعات الموعودة (Promised Payments) لا يمكن أن تدخل `recovered_cash_total`.
  - أن حالة `RECOVERED` تتطلب `evidence_refs` فعلية.
  - أن الموافقة (`approved_by`) إلزامية.
  - أن سجل التدقيق (`audit_log_id`) يُكتَب فعلياً.
  - أن عزل المستأجرين (Tenant Isolation) محفوظ.
  - أن أي كتابة غير مصرَّح بها تُمنَع.
- **لا يُمنح أي تفويض دمج آلي.** `MERGE READY` توصية تشغيلية فقط.
- إعادة تشغيل PR Review Runtime إذا تغيّر المنطق لاحقاً، حتى لو كان التغيير طفيفاً في الظاهر.
