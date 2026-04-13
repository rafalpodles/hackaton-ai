import { getGuestbookEntries } from "@/lib/actions/guestbook";
import { GuestbookGuard } from "@/app/(global)/guestbook/guestbook-guard";

export default async function HackathonGuestbookPage() {
  const entries = await getGuestbookEntries();
  return <GuestbookGuard entries={entries} />;
}
