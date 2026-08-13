import { redirect } from "next/navigation";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UrgentAlertBanner } from "@/components/layout/urgent-alert-banner";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-braces alongside middleware's session check.
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1">
      <SidebarNav />
      <div className="flex flex-1 flex-col overflow-hidden">
        <UrgentAlertBanner />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
