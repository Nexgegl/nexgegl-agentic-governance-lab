import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { BoundaryFooter } from "@/components/BoundaryFooter";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Every page in this group reads the signed-in user's session (directly or
// via this layout's own auth check), so none of it can be statically
// prerendered — always render per-request, matching this project's existing
// non-static-export Next.js configuration.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-x-hidden px-8 py-8">{children}</main>
        <BoundaryFooter />
      </div>
    </div>
  );
}
