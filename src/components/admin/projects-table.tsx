"use client";

import { useState, useTransition } from "react";
import type { ProjectWithTeam } from "@/lib/types";
import { deleteProject } from "@/lib/actions/admin";
import ConfirmDialog from "@/components/ui/confirm-dialog";

interface ProjectsTableProps {
  projects: ProjectWithTeam[];
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
                Project Title
              </th>
              <th className="px-5 py-3 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
                Status
              </th>
              <th className="px-5 py-3 text-left font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
                Team
              </th>
              <th className="px-5 py-3 text-right font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
                Actions
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
                    {project.is_submitted ? "Submitted" : "Draft"}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-on-surface-muted">
                  {project.team.map((m) => m.display_name).join(", ")}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    disabled={isPending}
                    onClick={() =>
                      setDeleteTarget({ id: project.id, name: project.name })
                    }
                    className="rounded-md px-3 py-1.5 font-space-grotesk text-xs font-semibold uppercase tracking-wider text-red-400 transition-colors hover:bg-red-500/15 disabled:opacity-50"
                  >
                    Delete
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
                  No projects yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Project"
          message={`Are you sure you want to delete "${deleteTarget.name}"? All associated files and votes will be permanently removed.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
