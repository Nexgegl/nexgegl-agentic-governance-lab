"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError("بيانات الدخول غير صحيحة أو الحساب غير موجود.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("تعذّر الاتصال بخدمة المصادقة. تحقق من إعدادات Supabase في .env.local.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-4 rounded-xl border border-navy-100 bg-white p-6 shadow-card"
    >
      <div>
        <h1 className="text-lg font-semibold text-navy-950">تسجيل الدخول</h1>
        <p className="text-xs text-navy-400">NEXGEGL AI Governance Operating System</p>
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-xs font-medium text-navy-600">
          البريد الإلكتروني
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-900"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-xs font-medium text-navy-600">
          كلمة المرور
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-900"
        />
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {submitting ? "جارٍ الدخول…" : "دخول"}
      </button>
    </form>
  );
}
