import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/utils";

export default async function GlobalLayout({
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
      <main className="mx-auto max-w-4xl p-4 pt-8 lg:p-8">{children}</main>
    </div>
  );
}
