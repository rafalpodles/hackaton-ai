import { redirect, notFound } from "next/navigation";
import { getCurrentUser, getHackathonBySlug, getParticipant } from "@/lib/utils";
import { getQuestionsForSurvey } from "@/lib/actions/survey";
import { SurveyForm } from "@/components/survey/survey-form";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SurveyPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const participant = await getParticipant(hackathon.id, user.id);
  if (!participant) redirect(`/h/${slug}`);

  if (!hackathon.survey_open) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">Ankieta</h1>
        <p className="text-on-surface-muted">Ankieta nie jest jeszcze dostępna.</p>
      </div>
    );
  }

  const { questions, hasResponded } = await getQuestionsForSurvey(hackathon.id);

  if (hasResponded) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <div className="text-5xl">🙏</div>
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
          Dziękujemy za wypełnienie ankiety!
        </h1>
        <p className="text-on-surface-muted">Twoje odpowiedzi zostały zapisane.</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">Ankieta</h1>
        <p className="text-on-surface-muted">Brak pytań w ankiecie.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-12">
        <h1 className="font-space-grotesk text-5xl font-extrabold tracking-tighter text-on-surface">
          ANKIETA
        </h1>
        <p className="mt-2 text-lg font-light text-on-surface-muted">
          Podziel się swoją opinią o hackathonie.
        </p>
      </header>
      <SurveyForm questions={questions} hackathonId={hackathon.id} />
    </div>
  );
}
