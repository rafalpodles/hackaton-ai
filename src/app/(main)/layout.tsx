import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/utils";
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

  return (
    <div className="min-h-screen">
      <Sidebar user={user} />
      <main className="ml-60 p-8">{children}</main>
    </div>
  );
}
