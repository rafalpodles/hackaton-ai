import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/sidebar";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("app_settings")
    .select("voting_open")
    .eq("id", 1)
    .single();

  return (
    <div className="min-h-screen">
      <Sidebar user={user} votingOpen={settings?.voting_open ?? false} />
      <main className="p-4 pt-16 lg:ml-60 lg:p-8">{children}</main>
    </div>
  );
}
