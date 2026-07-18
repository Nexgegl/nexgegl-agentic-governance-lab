import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

// Reads the request's session cookie, so it can never be statically prerendered.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-50 px-4">
      <LoginForm />
    </div>
  );
}
