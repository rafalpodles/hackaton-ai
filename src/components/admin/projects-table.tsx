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
  const [search, setSearch] = useState("");

  const filteredProjects = search.trim()
    ? projects.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          (p.tech_stack ?? []).some((t) => t.toLowerCase().includes(q))
        );
      })
    : projects;

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteProject(deleteTarget.id);
      setDeleteTarget(null);
    });
  };

  return (
    <>
      <div className="relative mb-4">
        <svg
          className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-muted/50"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Szukaj po nazwie, opisie, AI toolach..."
          className="w-full rounded-xl border border-outline bg-surface-low/60 py-2.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-muted/40 focus:border-primary/40 focus:outline-none focus:ring-0"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-muted/50 hover:text-on-surface"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

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
            {filteredProjects.map((project) => (
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
            {filteredProjects.length === 0 && (
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
