import { redirect, notFound } from "next/navigation";
import { getCurrentUser, getHackathonBySlug, getParticipant } from "@/lib/utils";
import Sidebar from "@/components/layout/sidebar";
import { CountdownBanner } from "@/components/layout/countdown-banner";
import { HackathonProvider } from "@/components/layout/hackathon-provider";

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function HackathonLayout({ children, params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const participant = await getParticipant(hackathon.id, user.id);

  return (
    <HackathonProvider hackathon={hackathon} participant={participant}>
      <div className="min-h-screen">
        <Sidebar
          user={user}
          votingOpen={hackathon.voting_open}
          hackathonSlug={hackathon.slug}
        />
        <div className="lg:ml-60">
          {hackathon.hackathon_date && (
            <CountdownBanner
              hackathonDate={hackathon.hackathon_date}
              submissionDeadline={hackathon.submission_deadline ?? undefined}
              votingOpen={hackathon.voting_open}
            />
          )}
          <main className="p-4 pt-16 lg:p-8">{children}</main>
        </div>
      </div>
    </HackathonProvider>
  );
}
