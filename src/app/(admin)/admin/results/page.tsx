"use client";

import { useState, useTransition } from "react";
import { exportResults } from "@/lib/actions/admin";
import { GradientButton } from "@/components/ui/gradient-button";

export default function AdminResultsPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    setError(null);
    startTransition(async () => {
      try {
        const base64 = await exportResults();
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
    <div className="space-y-8">
      <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
        Eksport wyników
      </h1>

      <div className="rounded-xl border border-outline bg-surface-low/60 p-8 backdrop-blur-md">
        <p className="mb-6 text-sm text-on-surface-muted">
          Pobierz wszystkie wyniki hackathonu, głosy i dane projektów jako arkusz
          Excel. Plik zawiera trzy arkusze: Wyniki (ranking wg kategorii),
          Wszystkie głosy (pojedyncze głosy) i Projekty (pełne dane).
        </p>

        <GradientButton onClick={handleExport} disabled={isPending}>
          {isPending ? "Generowanie..." : "Pobierz raport Excel"}
        </GradientButton>

        {error && (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
