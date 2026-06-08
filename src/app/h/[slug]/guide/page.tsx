import { notFound } from "next/navigation";
import { getHackathonBySlug, assertStartPageVisible, getGuideStepsForHackathon } from "@/lib/utils";
import { GuideView } from "@/components/guide/guide-view";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function HackathonGuidePage({ params }: Props) {
  const { slug } = await params;
  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();
  await assertStartPageVisible(hackathon, "guide");

  const customSteps = await getGuideStepsForHackathon(hackathon.id);

  return <GuideView supportChannel={hackathon.support_channel} customSteps={customSteps} />;
}
