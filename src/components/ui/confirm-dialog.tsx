"use client";

import { useEffect, useRef } from "react";
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
  confirmLabel = "Potwierdź",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus confirm button on mount
    confirmBtnRef.current?.focus();

    // Handle Escape key
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }

    // Prevent body scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  // Trap focus within dialog
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Tab" || !dialogRef.current) return;

    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      "button, [tabindex]:not([tabindex='-1'])"
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        className="mx-4 w-full max-w-md rounded-xl border border-outline bg-surface-low p-6 shadow-2xl"
      >
        <h3
          id="confirm-dialog-title"
          className="font-space-grotesk text-lg font-bold text-on-surface"
        >
          {title}
        </h3>
        <p id="confirm-dialog-message" className="mt-2 text-sm text-on-surface-muted">
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <GradientButton variant="ghost" onClick={onCancel}>
            Anuluj
          </GradientButton>
          <GradientButton ref={confirmBtnRef} onClick={onConfirm}>
            {confirmLabel}
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
