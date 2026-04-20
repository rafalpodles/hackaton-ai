"use client";

export function StarRating({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          className={`text-4xl transition-transform hover:scale-110 disabled:cursor-default ${
            star <= value ? "text-primary-dim" : "text-on-surface-muted/50"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
