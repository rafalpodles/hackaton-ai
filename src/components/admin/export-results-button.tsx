"use client";

import { useState, useTransition } from "react";
import { exportResults } from "@/lib/actions/admin";
import { GradientButton } from "@/components/ui/gradient-button";

interface Props {
  hackathonId?: string;
}

export function ExportResultsButton({ hackathonId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    setError(null);
    startTransition(async () => {
      try {
        const base64 = await exportResults(hackathonId);
        const byteCharacters = atob(base64);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteArray], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "hackathon-results.xlsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Eksport nie powiódł się");
      }
    });
  };

  return (
    <div>
      <GradientButton onClick={handleExport} disabled={isPending}>
        {isPending ? "Generowanie..." : "Pobierz Excel"}
      </GradientButton>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
