import { notFound } from "next/navigation";
import { getHackathonBySlug, getFaqForHackathon } from "@/lib/utils";
import { FaqView } from "@/components/faq/faq-view";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function FaqPage({ params }: Props) {
  const { slug } = await params;
  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const sections = await getFaqForHackathon(hackathon.id);
  return <FaqView sections={sections} />;
}
