# Claude Code PR Review Skill

## 1. Purpose
يراجع Pull Request محدد (نطاق الملفات، الكود، الاختبارات، الأمان) وينتج حكماً واحداً من ثلاثة يحدد جاهزية الدمج: MERGE READY / FIX BEFORE MERGE / BLOCK MERGE.

## 2. When to Use
- عند فتح أو تحديث أي PR في مستودع NEXGEGL.
- كجزء تنفيذي من Routine: `05-routines/pr-pre-merge-review.md`.
- عند طلب مراجعة يدوية لتغيير كود قبل الدمج.

## 3. Inputs Required

**Required:**
- الـ diff الكامل للـ PR (الملفات المتغيرة والمحتوى).
- تصنيف المستودع (Core IP/Product/Client/Experiment).
- نتيجة تشغيل الاختبارات (إن كانت متاحة) أو تأكيد أنها لم تُشغَّل.

**Optional:**
- سجل CI/Build إن وُجد.
- وصف PR ورسائل commit.

**Missing Input Handling:**
إن لم تتوفر نتيجة تشغيل اختبارات فعلية، لا يُفترض أنها ناجحة. يُذكر "Tests: not verified" صراحة، ويُعامَل كنقطة ضعف تؤثر على الحكم النهائي.

## 4. Operating Rules
- Do not invent facts. لا يُفترض نجاح بناء (Build) أو اختبار لم يُشاهَد فعلياً في المدخلات.
- افصل بين ما هو **موجود فعلياً في الـ diff** وما هو **مذكور في وصف PR فقط دون ظهور في الكود**.
- إن كان نطاق التغيير غير واضح (Scope) أو يتجاوز ما يصفه العنوان، صرّح بذلك كمخاطرة منفصلة.
- **Signal is not Decision.** نتيجة هذه المراجعة توصية دمج، وليست دمجاً فعلياً — الدمج فعل بشري أو Routine مصرَّح له صراحة.
- **لا دمج لأي منطق يمنح فعلاً مؤسسياً نافذاً بلا Evidence + Authority + Audit** — أي PR يُدخل مساراً كهذا يُحكَم عليه BLOCK MERGE.
- استخدم حصراً: MERGE READY / FIX BEFORE MERGE / BLOCK MERGE.

## 5. Execution Workflow
1. حدد **Scope Control**: هل حجم ونوع الملفات المتغيرة يطابق ما يصفه عنوان/وصف PR؟
2. اسرد **Files Changed** مصنَّفة (كود تطبيقي / اختبارات / توثيق / إعدادات).
3. قيّم **Source-Code Risk**: هل يوجد منطق خطر (حذف بيانات، تغيير صلاحيات، تنفيذ أوامر ديناميكي) في التغيير؟
4. تحقق من **Tests**: هل أُضيفت/عُدِّلت اختبارات تغطي التغيير؟ هل نتائجها معروفة؟
5. تحقق من **Build**: هل يوجد دليل على نجاح البناء (CI) أم غير معروف؟
6. افحص **Security**: أسرار مكشوفة، تبعيات غير موثوقة، مدخلات مستخدم غير مُطهَّرة (Sanitized).
7. افحص **RLS/Supabase Risk**: إن مسّ التغيير طبقة بيانات، هل توجد سياسة RLS مناظرة أو تعديل عليها بلا مراجعة أمنية؟
8. افحص **Naming Drift**: هل ظهر أي تغيير في اسم تجاري معتمد (ESTARED/إسترد) أو مصطلح حاكم؟
9. افحص **Product Logic Drift**: هل يغيّر التغيير سلوك منتج جوهري (مسار قرار، حد صلاحية) دون توثيق مرافق؟
10. اشتق حكماً إجمالياً واحداً واملأ القالب في §6.

## 6. Output Format

```
CLAUDE CODE PR REVIEW — [رقم/عنوان PR] — [التاريخ]
التصنيف: [Core IP/Product/Client/Experiment]

Scope Control: [PASS/FIX/FAIL] — [ملاحظة]
Files Changed: [عدد] — [كود: N | اختبارات: N | توثيق: N | إعدادات: N]
Source-Code Risk: [منخفض/متوسط/مرتفع] — [التفاصيل]
Tests: [موجودة وناجحة / موجودة غير مُتحقَّق منها / غير موجودة]
Build: [ناجح / غير معروف / فاشل]
Security: [PASS/FIX/FAIL] — [التفاصيل]
RLS/Supabase Risk: [PASS/FIX/FAIL/N-A] — [التفاصيل]
Naming Drift: [PASS/FIX/FAIL] — [التفاصيل]
Product Logic Drift: [PASS/FIX/FAIL] — [التفاصيل]

VERDICT: MERGE READY / FIX BEFORE MERGE / BLOCK MERGE
الإصلاحات المطلوبة (إن وُجدت): [قائمة محددة وقابلة للتنفيذ]
```

## 7. Quality Gates

| الحالة | معيار قابل للملاحظة |
|---|---|
| **MERGE READY** | كل محور PASS، الاختبارات موجودة وناجحة فعلياً (لا "غير معروف")، لا مخاطر أمنية أو انحراف تسمية. |
| **FIX BEFORE MERGE** | محور واحد أو أكثر FIX قابل للتصحيح (مثال: اختبارات ناقصة لحالة حدّية، توثيق غير محدَّث)، ولا يوجد أي محور FAIL. |
| **BLOCK MERGE** | أي محور FAIL — خصوصاً: ثغرة أمنية، سياسة RLS غائبة على بيانات حساسة، انحراف اسم تجاري، أو منطق يمنح فعلاً مؤسسياً بلا Evidence/Authority/Audit. |

## 8. Anti-Patterns
- إصدار MERGE READY رغم "Tests: غير موجودة" بحجة أن التغيير "بسيط".
- تجاهل فحص RLS لأن التغيير "لا يبدو" مساساً بالبيانات دون تحقق فعلي من الـ diff.
- خلط عدة أنواع تغييرات غير مترابطة (كود + توثيق + إعدادات بنية تحتية) في PR واحد دون الإشارة لذلك كمخاطرة Scope.
- إصدار حكم دون فحص فعلي لكل الملفات المتغيرة (الاكتفاء بعنوان PR).

## 9. Example Prompt
"استخدم Claude Code PR Review Skill لمراجعة PR رقم 42 الذي يضيف نقطة API جديدة لجلب بيانات عميل في مستودع NCGR، وحدد إن كان جاهزاً للدمج."

## 10. Example Output Skeleton

```
CLAUDE CODE PR REVIEW — [PR] — [YYYY-MM-DD]
التصنيف: [التصنيف]
Scope Control: [حكم + ملاحظة]
Files Changed: [العدد والتصنيف]
Source-Code Risk: [مستوى + تفاصيل]
Tests: [حالة]
Build: [حالة]
Security: [حكم + تفاصيل]
RLS/Supabase Risk: [حكم + تفاصيل]
Naming Drift: [حكم + تفاصيل]
Product Logic Drift: [حكم + تفاصيل]
VERDICT: [MERGE READY/FIX BEFORE MERGE/BLOCK MERGE]
الإصلاحات المطلوبة: [قائمة أو "لا يوجد"]
```
