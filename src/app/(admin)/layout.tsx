import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("app_settings")
    .select("voting_open")
    .eq("id", 1)
    .single();

  return (
    <div className="min-h-screen">
      <Sidebar user={user} votingOpen={settings?.voting_open ?? false} />
      <main className="ml-60 p-8">{children}</main>
    </div>
  );
}
