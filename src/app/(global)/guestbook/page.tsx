import { getGuestbookEntries } from "@/lib/actions/guestbook";
import { GuestbookGuard } from "./guestbook-guard";

export default async function GuestbookPage() {
  const entries = await getGuestbookEntries();
  return <GuestbookGuard entries={entries} />;
}
