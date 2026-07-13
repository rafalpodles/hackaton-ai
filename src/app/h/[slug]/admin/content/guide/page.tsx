import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getHackathonBySlug, getGuideStepsForHackathon } from "@/lib/utils";
import GuideEditor from "@/components/admin/guide-editor";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminGuidePage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const steps = await getGuideStepsForHackathon(hackathon.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-chakra-petch text-2xl font-bold text-on-surface">
          Poradnik — {hackathon.name}
        </h1>
        <Link
          href={`/h/${slug}/guide`}
          className="text-sm text-on-surface-muted hover:text-on-surface"
        >
          ← podgląd publiczny
        </Link>
      </div>
      <p className="text-sm text-on-surface-muted">
        Dodaj własne kroki do poradnika dla tego hackathonu. Pojawią się na końcu odpowiedniej kategorii.
      </p>
      <GuideEditor hackathonId={hackathon.id} initial={steps} />
    </div>
  );
}
