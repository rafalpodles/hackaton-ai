import { notFound } from "next/navigation";
import { getHackathonBySlug, getIdeasForHackathon, assertStartPageVisible } from "@/lib/utils";
import { AdminEditButton } from "@/components/admin/admin-edit-button";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function HackathonIdeasPage({ params }: Props) {
  const { slug } = await params;
  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();
  await assertStartPageVisible(hackathon, "ideas");

  const ideas = await getIdeasForHackathon(hackathon.id);

  return (
    <>
    <div className="mx-auto max-w-5xl space-y-9">
      <div>
        <h1
          className="font-chakra-petch font-bold leading-[0.95] text-on-surface"
          style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
        >
          Pomysły na projekty
        </h1>
        <p className="mt-4 max-w-[720px] text-[17px] leading-relaxed text-on-surface-muted">
          Nie wiesz co zbudować? Oto kilka inspiracji. Możesz zbudować
          cokolwiek — liczy się realizacja i wykorzystanie AI.
        </p>
      </div>

      {ideas.length === 0 ? (
        <p className="text-on-surface-muted">Brak pomysłów dla tej edycji.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="relative overflow-hidden rounded-[18px] border border-white/10 bg-[rgba(14,14,21,.6)] p-[26px] transition-colors hover:border-[rgba(139,140,245,.45)]"
            >
              <div
                className="absolute inset-y-0 left-0 w-[3px]"
                style={{ background: "linear-gradient(#6366f1, #ff5a4d)" }}
              />
              <h3 className="mb-[10px] font-chakra-petch text-[21px] font-bold text-on-surface">
                {idea.name}
              </h3>
              <p className="text-[15px] leading-relaxed text-on-surface-muted">
                {idea.description}
              </p>
              {idea.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {idea.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[rgba(139,140,245,.13)] px-[11px] py-[5px] font-jetbrains-mono text-[11px] tracking-[0.08em] text-[#b6b7ff]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    <AdminEditButton href={`/h/${slug}/admin/content/ideas`} />
    </>
  );
}
