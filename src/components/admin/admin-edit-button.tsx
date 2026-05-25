import Link from "next/link";
import { getCurrentUser } from "@/lib/utils";

interface AdminEditButtonProps {
  href: string;
  label?: string;
}

export async function AdminEditButton({ href, label = "Edytuj treść" }: AdminEditButtonProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;

  return (
    <Link
      href={href}
      className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-4 py-2.5 font-space-grotesk text-sm font-semibold text-primary-dim backdrop-blur-md shadow-lg transition-all hover:bg-primary/25 hover:shadow-[0_0_20px_rgba(70,70,204,0.35)]"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
      </svg>
      ✏️ {label}
    </Link>
  );
}
