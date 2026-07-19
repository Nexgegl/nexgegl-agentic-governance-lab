"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function InstallToggle({ pluginId, installed }: { pluginId: string; installed: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    try {
      await fetch(`/api/plugins/${pluginId}/${installed ? "disable" : "install"}`, { method: "POST" });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60 ${
        installed ? "border border-red-200 text-red-700 hover:bg-red-50" : "bg-navy-950 text-gold-400 hover:bg-navy-900"
      }`}
    >
      {pending ? "جارٍ التنفيذ…" : installed ? "تعطيل الإضافة" : "تثبيت الإضافة"}
    </button>
  );
}
