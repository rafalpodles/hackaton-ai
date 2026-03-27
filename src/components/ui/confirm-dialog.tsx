"use client";

import { GradientButton } from "@/components/ui/gradient-button";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-outline bg-surface-low p-6 shadow-2xl">
        <h3 className="font-space-grotesk text-lg font-bold text-on-surface">
          {title}
        </h3>
        <p className="mt-2 text-sm text-on-surface-muted">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <GradientButton variant="ghost" onClick={onCancel}>
            Cancel
          </GradientButton>
          <GradientButton onClick={onConfirm}>{confirmLabel}</GradientButton>
        </div>
      </div>
    </div>
  );
}
