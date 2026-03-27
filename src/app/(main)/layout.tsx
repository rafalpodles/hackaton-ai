import { redirect } from "next/navigation";
import { getCurrentUser, getAppSettings } from "@/lib/utils";
import Sidebar from "@/components/layout/sidebar";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getAppSettings(),
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <Sidebar user={user} currentPhase={settings.current_phase} />
      <main className="ml-60 p-8">{children}</main>
    </div>
  );
}
