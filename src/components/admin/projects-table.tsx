"use client";

import { useState, useTransition } from "react";
import type { Project } from "@/lib/types";
import { deleteProject } from "@/lib/actions/admin";
import ConfirmDialog from "@/components/ui/confirm-dialog";

interface ProjectsTableProps {
  projects: Project[];
}

export default function ProjectsTable({ projects }: ProjectsTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteProject(deleteTarget.id);
      setDeleteTarget(null);
    });
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-outline bg-surface-low/60 backdrop-blur-md">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline">
              <th className="px-5 py-3 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
                Nazwa projektu
              </th>
              <th className="px-5 py-3 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
                Status
              </th>
              <th className="px-5 py-3 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
                Zespół
              </th>
              <th className="px-5 py-3 text-right font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
                Akcje
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr
                key={project.id}
                className="border-b border-outline/50 last:border-b-0"
              >
                <td className="px-5 py-4 font-space-grotesk text-sm font-semibold text-on-surface">
                  {project.name}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      project.is_submitted
                        ? "bg-green-500/15 text-green-400"
                        : "bg-yellow-500/15 text-yellow-400"
                    }`}
                  >
                    {project.is_submitted ? "Zgłoszony" : "Szkic"}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-on-surface-muted">
                  —
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    disabled={isPending}
                    onClick={() =>
                      setDeleteTarget({ id: project.id, name: project.name })
                    }
                    className="rounded-md px-3 py-1.5 font-space-grotesk text-xs font-semibold uppercase tracking-wider text-red-400 transition-colors hover:bg-red-500/15 disabled:opacity-50"
                  >
                    Usuń
                  </button>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-8 text-center text-sm text-on-surface-muted"
                >
                  Brak projektów
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Usuń projekt"
          message={`Czy na pewno chcesz usunąć "${deleteTarget.name}"? Wszystkie powiązane pliki i głosy zostaną trwale usunięte.`}
          confirmLabel="Usuń"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
