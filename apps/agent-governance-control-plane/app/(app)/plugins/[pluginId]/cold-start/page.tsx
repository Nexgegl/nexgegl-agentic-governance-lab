import { Topbar } from "@/components/Topbar";
import { ColdStartForm } from "./ColdStartForm";

export default function ColdStartPage() {
  return (
    <div className="space-y-6">
      <Topbar
        titleAr="الإعداد الأولي لحوكمة الذكاء الاصطناعي"
        titleEn="AI Governance Cold Start"
        subtitleAr="يُنشئ سجلات بنيوية في قاعدة البيانات — لا يُنشئ قرارًا رسميًا ولا يمنح موافقة إنتاج"
      />
      <ColdStartForm />
    </div>
  );
}
