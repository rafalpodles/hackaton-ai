import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/utils";
import Sidebar from "@/components/layout/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  return (
    <div className="min-h-screen">
      <Sidebar user={user} votingOpen={false} />
      <main className="p-4 pt-16 lg:ml-60 lg:p-8">{children}</main>
    </div>
  );
}
