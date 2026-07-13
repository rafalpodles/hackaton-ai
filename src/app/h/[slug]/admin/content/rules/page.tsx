import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getHackathonBySlug, getRulesContent } from "@/lib/utils";
import { DEFAULT_RULES } from "@/lib/defaults/rules";
import RulesEditor from "@/components/admin/rules-editor";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminRulesPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const rules = (await getRulesContent(hackathon.id)) ?? DEFAULT_RULES;

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-chakra-petch text-2xl font-bold text-on-surface">
          Garage Rules — {hackathon.name}
        </h1>
        <Link
          href={`/h/${slug}/rules`}
          className="text-sm text-on-surface-muted hover:text-on-surface"
        >
          ← podgląd publiczny
        </Link>
      </div>
      <RulesEditor hackathonId={hackathon.id} initial={rules} />
    </div>
  );
}
