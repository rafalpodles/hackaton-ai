// src/app/h/[slug]/admin/content/faq/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getHackathonBySlug, getFaqForHackathon } from "@/lib/utils";
import FaqEditor from "@/components/admin/faq-editor";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminFaqPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const faq = await getFaqForHackathon(hackathon.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-chakra-petch text-2xl font-bold text-on-surface">
          FAQ — {hackathon.name}
        </h1>
        <Link
          href={`/h/${slug}/faq`}
          className="text-sm text-on-surface-muted hover:text-on-surface"
        >
          ← podgląd publiczny
        </Link>
      </div>
      <FaqEditor hackathonId={hackathon.id} initial={faq} />
    </div>
  );
}
