import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function HackathonResultsPage({ params }: Props) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect(`/h/${slug}`);

  redirect(`/h/${slug}/admin/results`);
}
