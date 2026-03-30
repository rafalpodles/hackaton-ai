"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  guideSteps,
  projectIdeas,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  SUBSCRIPTION_LABELS,
  type OS,
  type Path,
  type Category,
  type Subscription,
  type GuideStep,
  type CodeStep,
} from "@/lib/guide-data";
import { GradientButton } from "@/components/ui/gradient-button";

// ─── State persistence ───────────────────────────────────────────────

const STORAGE_KEY = "guide-state";

interface PersistedState {
  selectedPath: Path | null;
  selectedSubscription: Subscription | null;
  completedSteps: string[];
}

function loadState(): PersistedState {
  if (typeof window === "undefined") return { selectedPath: null, selectedSubscription: null, completedSteps: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { selectedPath: null, selectedSubscription: null, completedSteps: [] };
}

function saveState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function detectOS(): OS {
  if (typeof navigator === "undefined") return "mac";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("linux")) return "linux";
  return "mac";
}

// ─── Main component ──────────────────────────────────────────────────

export function GuideView() {
  const [selectedPath, setSelectedPath] = useState<Path | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [activeOS, setActiveOS] = useState<OS>("mac");
  const [mounted, setMounted] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  // Load persisted state on mount + handle deep links
  useEffect(() => {
    const persisted = loadState();
    setSelectedPath(persisted.selectedPath);
    setSelectedSubscription(persisted.selectedSubscription);
    setCompletedSteps(new Set(persisted.completedSteps));
    setActiveOS(detectOS());
    setMounted(true);
    if (persisted.selectedPath) setShowSteps(true);

    // Deep link: /guide#step-id
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      const step = guideSteps.find((s) => s.id === hash);
      if (step) {
        // Auto-select path if needed
        if (!persisted.selectedPath && step.paths.length > 0) {
          setSelectedPath(step.paths[0]);
          setShowSteps(true);
        }
        setTimeout(() => {
          setExpandedSteps(new Set([hash]));
          document.getElementById(`step-${hash}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 400);
      }
    }
  }, []);

  // Save state on changes
  useEffect(() => {
    if (!mounted) return;
    saveState({ selectedPath, selectedSubscription, completedSteps: Array.from(completedSteps) });
  }, [selectedPath, selectedSubscription, completedSteps, mounted]);

  const handlePathSelect = useCallback((path: Path) => {
    setSelectedPath(path);
    setTimeout(() => setShowSteps(true), 200);
  }, []);

  const toggleStep = useCallback((stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  }, []);

  const toggleComplete = useCallback((stepId: string) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  }, []);

  const handleResetPath = useCallback(() => {
    setSelectedPath(null);
    setShowSteps(false);
    setExpandedSteps(new Set());
    setCompletedSteps(new Set());
  }, []);

  // Filter steps for selected path
  const filteredSteps = selectedPath
    ? guideSteps.filter((s) => s.paths.includes(selectedPath))
    : [];

  const requiredSteps = filteredSteps.filter((s) => s.required);
  const completedRequired = requiredSteps.filter((s) => completedSteps.has(s.id));
  const progress = requiredSteps.length > 0 ? Math.round((completedRequired.length / requiredSteps.length) * 100) : 0;
  const allDone = requiredSteps.length > 0 && completedRequired.length === requiredSteps.length;

  const totalEstimatedMinutes = filteredSteps.reduce((sum, s) => sum + (s.estimatedMinutes ?? 0), 0);

  // Group steps by category
  const categories: Category[] = ["fundamenty", "ai-tools", "bonus", "weryfikacja"];
  const stepsByCategory = categories
    .map((cat) => ({
      category: cat,
      steps: filteredSteps.filter((s) => s.category === cat),
    }))
    .filter((g) => g.steps.length > 0);

  if (!mounted) {
    return (
      <div className="mx-auto max-w-4xl py-4">
        <div className="h-48 animate-pulse rounded-2xl bg-surface-low/80" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-4 flex flex-col gap-10">
      {/* Hero Header */}
      <HeroHeader
        progress={progress}
        completedCount={completedRequired.length}
        totalCount={requiredSteps.length}
        selectedPath={selectedPath}
        allDone={allDone}
        totalMinutes={totalEstimatedMinutes}
        onResetPath={handleResetPath}
      />

      {/* Path Selector */}
      {!selectedPath && (
        <PathSelector onSelect={handlePathSelect} />
      )}

      {/* Steps */}
      {selectedPath && showSteps && (
        <>
          {stepsByCategory.map((group, gi) => (
            <div key={group.category}>
              <SectionDivider
                label={CATEGORY_LABELS[group.category]}
                description={CATEGORY_DESCRIPTIONS[group.category]}
              />

              {/* Subscription selector — show at top of AI Tools section */}
              {group.category === "ai-tools" && (
                <SubscriptionSelector
                  selected={selectedSubscription}
                  onSelect={setSelectedSubscription}
                />
              )}

              <div className="flex flex-col gap-3">
                {group.steps.map((step, si) => {
                  // Compute dynamic step number within the filtered path
                  const globalIndex = filteredSteps.indexOf(step);
                  return (
                    <StepCard
                      key={step.id}
                      step={step}
                      displayNumber={globalIndex + 1}
                      expanded={expandedSteps.has(step.id)}
                      completed={completedSteps.has(step.id)}
                      activeOS={activeOS}
                      activeSubscription={selectedSubscription}
                      onToggle={() => toggleStep(step.id)}
                      onToggleComplete={() => toggleComplete(step.id)}
                      onOSChange={setActiveOS}
                      delay={(gi * 3 + si) * 50}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Completion Banner */}
          {allDone && <CompletionBanner />}

          {/* Help footer */}
          <div className="text-center text-xs text-on-surface-muted/60 mt-4 flex flex-col gap-1">
            <p>
              Masz problem? Napisz na kanale{" "}
              <span className="font-semibold text-on-surface-muted">AI Enablement Hackaton</span>{" "}
              na Teams — pomożemy!
            </p>
            <p>Ostatnia aktualizacja: marzec 2026</p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Hero Header ─────────────────────────────────────────────────────

function HeroHeader({
  progress,
  completedCount,
  totalCount,
  selectedPath,
  allDone,
  totalMinutes,
  onResetPath,
}: {
  progress: number;
  completedCount: number;
  totalCount: number;
  selectedPath: Path | null;
  allDone: boolean;
  totalMinutes: number;
  onResetPath: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface-low/80 backdrop-blur-[20px] border border-outline p-8 pb-6">
      {/* Ambient glows */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-secondary/15 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10">
        <h1 className="font-space-grotesk text-4xl md:text-5xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-primary-dim to-secondary bg-clip-text text-transparent">
            PRZYGOTUJ
          </span>{" "}
          <span className="text-on-surface">SIĘ</span>
        </h1>

        <p className="text-on-surface-muted text-base mt-2 max-w-xl">
          Przejdź przez wszystkie kroki przed hackathonowym dniem. Nie chcesz
          tracić czasu na instalacje!
        </p>

        {/* Progress */}
        <div className="flex items-center gap-4 mt-6">
          <div
            className="flex-1 h-2 rounded-full bg-surface-high overflow-hidden"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-primary to-secondary ${
                allDone ? "shadow-[0_0_12px_rgba(70,70,204,0.5)]" : ""
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <span className="font-space-grotesk text-sm font-bold text-on-surface tabular-nums">
            {completedCount} / {totalCount}
          </span>

          {selectedPath && totalMinutes > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-on-surface-muted font-space-grotesk">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              ~{totalMinutes} min
            </span>
          )}

          {selectedPath && <PathBadge path={selectedPath} onClick={onResetPath} />}
        </div>
      </div>
    </div>
  );
}

// ─── Path Badge ──────────────────────────────────────────────────────

function PathBadge({ path, onClick }: { path: Path; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Kliknij, żeby zmienić ścieżkę"
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-primary/15 border border-primary/30 font-space-grotesk text-xs font-semibold uppercase tracking-wider text-primary-dim cursor-pointer hover:bg-primary/25 transition-colors"
    >
      {path === "beginner" ? (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 0 1-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
        </svg>
      )}
      {path === "beginner" ? "POCZĄTKUJĄCY" : "ZAAWANSOWANY"}
    </button>
  );
}

// ─── Path Selector ───────────────────────────────────────────────────

function PathSelector({ onSelect }: { onSelect: (path: Path) => void }) {
  const [fading, setFading] = useState(false);

  const handleSelect = (path: Path) => {
    setFading(true);
    setTimeout(() => onSelect(path), 200);
  };

  // Compute stats for each path
  const getPathStats = (path: Path) => {
    const steps = guideSteps.filter((s) => s.paths.includes(path));
    const totalMin = steps.reduce((sum, s) => sum + (s.estimatedMinutes ?? 0), 0);
    return { count: steps.length, minutes: totalMin };
  };

  const beginnerStats = getPathStats("beginner");
  const advancedStats = getPathStats("advanced");

  return (
    <div
      className={`transition-opacity duration-200 ${fading ? "opacity-0" : "opacity-100"}`}
    >
      <h2 className="font-space-grotesk text-lg font-semibold text-on-surface mb-4">
        Wybierz swoją ścieżkę
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Beginner card */}
        <button
          onClick={() => handleSelect("beginner")}
          className="group relative cursor-pointer rounded-xl p-6 bg-surface-high/40 backdrop-blur-[20px] border border-outline transition-all duration-200 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(70,70,204,0.12)] hover:-translate-y-0.5 text-left before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-primary before:to-primary-dim before:rounded-t-xl focus-visible:outline-2 focus-visible:outline-primary-dim focus-visible:outline-offset-2"
        >
          <div className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center bg-primary/15">
            <svg className="w-6 h-6 text-primary-dim" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 0 1-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
            </svg>
          </div>
          <h3 className="font-space-grotesk text-xl font-bold text-on-surface mb-1">
            POCZĄTKUJĄCY
          </h3>
          <p className="text-sm text-on-surface-muted leading-relaxed mb-3">
            Nigdy nie kodowałem — pokaż mi wszystko od zera
          </p>
          <p className="text-xs text-on-surface-muted font-space-grotesk">
            {beginnerStats.count} kroków &middot; ~{beginnerStats.minutes} min
          </p>
        </button>

        {/* Advanced card */}
        <button
          onClick={() => handleSelect("advanced")}
          className="group relative cursor-pointer rounded-xl p-6 bg-surface-high/40 backdrop-blur-[20px] border border-outline transition-all duration-200 hover:border-secondary/40 hover:shadow-[0_0_30px_rgba(255,77,41,0.12)] hover:-translate-y-0.5 text-left before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-secondary before:to-secondary-dim before:rounded-t-xl focus-visible:outline-2 focus-visible:outline-primary-dim focus-visible:outline-offset-2"
        >
          <div className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center bg-secondary/15">
            <svg className="w-6 h-6 text-secondary-dim" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
            </svg>
          </div>
          <h3 className="font-space-grotesk text-xl font-bold text-on-surface mb-1">
            ZAAWANSOWANY
          </h3>
          <p className="text-sm text-on-surface-muted leading-relaxed mb-3">
            Mam doświadczenie z programowaniem — potrzebuję tylko AI tools
          </p>
          <p className="text-xs text-on-surface-muted font-space-grotesk">
            {advancedStats.count} kroków &middot; ~{advancedStats.minutes} min
          </p>
        </button>
      </div>
    </div>
  );
}

// ─── Subscription Selector ──────────────────────────────────────────

function SubscriptionSelector({
  selected,
  onSelect,
}: {
  selected: Subscription | null;
  onSelect: (sub: Subscription) => void;
}) {
  const options: { key: Subscription; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      key: "claude",
      label: "Claude Pro / Max",
      desc: "Mam subskrypcję Anthropic",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.709 15.955l4.397-10.986c.469-1.172 1.259-1.479 2.2-.879l8.228 5.238c.94.6.94 1.344 0 1.944l-8.228 5.238c-.941.6-1.731.293-2.2-.879L4.709 15.955z" />
        </svg>
      ),
    },
    {
      key: "openai",
      label: "ChatGPT Plus / Pro",
      desc: "Mam subskrypcję OpenAI",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
        </svg>
      ),
    },
    {
      key: "openrouter",
      label: "OpenRouter",
      desc: "Dostanę klucz od organizatorów",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mb-6">
      <p className="text-sm text-on-surface-muted mb-3">
        Jaką subskrypcję AI posiadasz? Dostosujemy instrukcje konfiguracji.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onSelect(opt.key)}
            className={`group relative cursor-pointer rounded-lg p-3 text-left transition-all duration-200 border focus-visible:outline-2 focus-visible:outline-primary-dim focus-visible:outline-offset-2 ${
              selected === opt.key
                ? "bg-primary/10 border-primary/40 shadow-[0_0_20px_rgba(70,70,204,0.1)]"
                : "bg-surface-high/40 border-outline hover:border-primary/25 hover:bg-surface-high/60"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                  selected === opt.key
                    ? "bg-primary/20 text-primary-dim"
                    : "bg-surface-high text-on-surface-muted"
                }`}
              >
                {opt.icon}
              </div>
              <div className="min-w-0">
                <div
                  className={`font-space-grotesk text-xs font-bold transition-colors ${
                    selected === opt.key ? "text-primary-dim" : "text-on-surface"
                  }`}
                >
                  {opt.label}
                </div>
                <div className="text-[11px] text-on-surface-muted truncate">
                  {opt.desc}
                </div>
              </div>
            </div>
            {selected === opt.key && (
              <div className="absolute top-1.5 right-1.5">
                <svg className="w-4 h-4 text-primary-dim" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Section Divider ─────────────────────────────────────────────────

function SectionDivider({
  label,
  description,
}: {
  label: string;
  description?: string;
}) {
  return (
    <div className="mt-8 mb-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-outline" />
        <span className="font-space-grotesk text-xs font-bold uppercase tracking-[0.2em] text-on-surface-muted">
          {label}
        </span>
        <div className="flex-1 h-px bg-outline" />
      </div>
      {description && (
        <p className="text-center text-xs text-on-surface-muted mt-1.5">{description}</p>
      )}
    </div>
  );
}

// ─── Step Card (Accordion) ───────────────────────────────────────────

function StepCard({
  step,
  displayNumber,
  expanded,
  completed,
  activeOS,
  activeSubscription,
  onToggle,
  onToggleComplete,
  onOSChange,
  delay,
}: {
  step: GuideStep;
  displayNumber: number;
  expanded: boolean;
  completed: boolean;
  activeOS: OS;
  activeSubscription: Subscription | null;
  onToggle: () => void;
  onToggleComplete: () => void;
  onOSChange: (os: OS) => void;
  delay: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const wasExpanded = useRef(expanded);

  useEffect(() => {
    if (expanded && !wasExpanded.current && cardRef.current) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
    wasExpanded.current = expanded;
  }, [expanded]);

  return (
    <div
      ref={cardRef}
      id={`step-${step.id}`}
      className={`rounded-xl overflow-hidden border transition-all duration-200 animate-fadeIn ${
        completed
          ? "bg-surface-low/60 border-primary/25 border-l-2 border-l-primary-dim"
          : expanded
          ? "bg-surface-low/80 border-primary/20"
          : "bg-surface-low/60 border-outline"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer transition-colors duration-150 hover:bg-surface-high/30"
        onClick={onToggle}
        role="button"
        aria-expanded={expanded}
        aria-controls={`step-body-${step.id}`}
        id={`step-header-${step.id}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        {/* Step number */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-space-grotesk text-xs font-bold ${
            completed || expanded
              ? "bg-primary/20 text-primary-dim"
              : "bg-surface-high text-on-surface-muted"
          }`}
        >
          {displayNumber}
        </div>

        {/* Title + time estimate */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-space-grotesk text-sm font-semibold ${
                completed ? "text-primary-dim" : "text-on-surface"
              }`}
            >
              {step.title}
            </span>
            {!step.required && (
              <span className="text-[10px] text-on-surface-muted/60 font-normal bg-surface-high/60 rounded px-1.5 py-0.5">opcjonalny</span>
            )}
            {step.estimatedMinutes && (
              <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-on-surface-muted/60 font-normal">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                {step.estimatedMinutes} min
              </span>
            )}
          </div>
        </div>

        {/* Checkbox — bigger touch target */}
        <div className="p-1.5 -m-1.5">
          <StepCheckbox
            checked={completed}
            label={`Oznacz ${step.title} jako ukończone`}
            onToggle={(e) => {
              e.stopPropagation();
              onToggleComplete();
            }}
          />
        </div>

        {/* Chevron — bigger touch target */}
        <div className="p-1.5 -m-1.5">
          <svg
            className={`w-5 h-5 text-on-surface-muted transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>

      {/* Body */}
      <div
        id={`step-body-${step.id}`}
        role="region"
        aria-labelledby={`step-header-${step.id}`}
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-0 ml-12">
            {/* Description */}
            <p className="text-sm text-on-surface-muted leading-relaxed mb-4">
              {step.instructions.description}
            </p>

            {/* Links — show early so download links are visible first */}
            {step.instructions.links && step.instructions.links.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {step.instructions.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-dim bg-primary/[0.08] border border-primary/20 rounded-lg px-3 py-1.5 hover:bg-primary/[0.15] transition-colors"
                  >
                    {link.label}
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                ))}
              </div>
            )}

            {/* OS Tabs — only show if step has platform-specific content */}
            {Object.keys(step.instructions.platforms).length > 1 && (
              <OSTabs activeOS={activeOS} onOSChange={onOSChange} platforms={step.instructions.platforms} />
            )}

            {/* Warnings — show before instructions so users see them first */}
            {step.instructions.warnings && step.instructions.warnings.length > 0 && (
              <div className="mb-4 flex flex-col gap-2">
                {step.instructions.warnings.map((warn, i) => (
                  <Callout key={`warn-${i}`} type="warning" text={warn} />
                ))}
              </div>
            )}

            {/* Platform instructions */}
            <PlatformContent
              platforms={step.instructions.platforms}
              activeOS={activeOS}
              activeSubscription={activeSubscription}
            />

            {/* Project ideas grid — special render for this step */}
            {step.id === "project-ideas" && <ProjectIdeasGrid />}

            {/* Tips */}
            {step.instructions.tips && step.instructions.tips.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                {step.instructions.tips.map((tip, i) => (
                  <Callout key={i} type="info" text={tip} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step Checkbox ───────────────────────────────────────────────────

function StepCheckbox({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 cursor-pointer flex-shrink-0 focus-visible:outline-2 focus-visible:outline-primary-dim focus-visible:outline-offset-2 ${
        checked
          ? "bg-gradient-to-br from-primary to-primary-dim border-0 shadow-[0_0_8px_rgba(164,165,255,0.3)]"
          : "border-2 border-outline hover:border-primary-dim/50"
      }`}
    >
      {checked && (
        <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      )}
    </button>
  );
}

// ─── OS Tabs ─────────────────────────────────────────────────────────

function OSTabs({
  activeOS,
  onOSChange,
  platforms,
}: {
  activeOS: OS;
  onOSChange: (os: OS) => void;
  platforms: Record<string, unknown>;
}) {
  const allTabs: { key: OS; label: string }[] = [
    { key: "mac", label: "macOS" },
    { key: "windows", label: "Windows" },
    { key: "linux", label: "Linux" },
  ];
  const tabs = allTabs.filter((t) => t.key in platforms);

  return (
    <div className="flex gap-1 mb-4 p-1 rounded-lg bg-surface-high/60 w-fit" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={activeOS === tab.key}
          onClick={() => onOSChange(tab.key)}
          className={`px-3 py-1.5 rounded-md font-space-grotesk text-xs font-semibold uppercase tracking-wider transition-all duration-150 focus-visible:outline-2 focus-visible:outline-primary-dim focus-visible:outline-offset-2 ${
            activeOS === tab.key
              ? "bg-surface-bright text-on-surface shadow-sm"
              : "text-on-surface-muted hover:text-on-surface hover:bg-surface-high"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Platform Content ────────────────────────────────────────────────

function matchesSubscription(step: CodeStep, activeSub: Subscription | null): boolean {
  if (!step.sub) return true; // no filter = always show
  if (!activeSub) return true; // no selection = show all
  if (Array.isArray(step.sub)) return step.sub.includes(activeSub);
  return step.sub === activeSub;
}

function PlatformContent({
  platforms,
  activeOS,
  activeSubscription,
}: {
  platforms: GuideStep["instructions"]["platforms"];
  activeOS: OS;
  activeSubscription: Subscription | null;
}) {
  // Fallback: if current OS not available, use first available
  const platform =
    platforms[activeOS] ??
    platforms.mac ??
    platforms.windows ??
    platforms.linux;

  if (!platform) return null;

  const visibleSteps = platform.steps.filter((s) => matchesSubscription(s, activeSubscription));

  return (
    <div className="flex flex-col gap-3" role="tabpanel">
      {visibleSteps.map((step, i) => (
        <div key={i}>
          {step.text && (
            <p className="text-sm text-on-surface-muted leading-relaxed mb-2">
              {step.text}
            </p>
          )}
          {step.command && (
            <CodeBlock code={step.command} output={step.output} />
          )}
          {!step.command && step.output && (
            <p className="text-sm text-on-surface-muted font-mono pl-2">
              {step.output}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Code Block ──────────────────────────────────────────────────────

function CodeBlock({ code, output }: { code: string; output?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const lines = code.split("\n");
  const outputLines = output?.split("\n") ?? [];

  return (
    <div className="rounded-lg overflow-hidden bg-[#0a0a0f] border border-outline/50 font-mono text-sm">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0f0f15] border-b border-outline/30">
        {/* Traffic lights */}
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]/60" />
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1 text-[10px] font-space-grotesk uppercase tracking-wider transition-colors duration-150 cursor-pointer ${
            copied
              ? "text-primary-dim"
              : "text-on-surface-muted/60 hover:text-on-surface-muted"
          }`}
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              SKOPIOWANO
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
              </svg>
              KOPIUJ
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="px-4 py-3 text-[13px] leading-relaxed overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] sm:[mask-image:none]">
        {lines.map((line, i) => {
          if (line.startsWith("#")) {
            return (
              <div key={i} className="text-on-surface-muted/60 italic">
                {line}
              </div>
            );
          }
          return (
            <div key={i} className="text-on-surface">
              <span className="text-primary-dim font-bold">$ </span>
              {line}
            </div>
          );
        })}
        {outputLines.length > 0 && (
          <>
            <div className="h-1" />
            {outputLines.map((line, i) => (
              <div key={`out-${i}`} className="text-on-surface-muted">
                {line}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Callout ─────────────────────────────────────────────────────────

function Callout({ type, text }: { type: "info" | "warning"; text: string }) {
  const isInfo = type === "info";
  return (
    <div
      className={`flex gap-3 p-3 rounded-lg text-sm text-on-surface-muted ${
        isInfo
          ? "bg-primary/[0.08] border border-primary/15"
          : "bg-secondary/[0.08] border border-secondary/15"
      }`}
    >
      {isInfo ? (
        <svg className="w-5 h-5 text-primary-dim flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-secondary-dim flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      )}
      <span>{text}</span>
    </div>
  );
}

// ─── Project Ideas Grid ──────────────────────────────────────────────

function ProjectIdeasGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1">
      {projectIdeas.map((idea) => (
        <div
          key={idea.name}
          className="rounded-lg border border-outline/60 bg-surface-high/30 p-3.5 transition-colors hover:border-primary/25 hover:bg-surface-high/50"
        >
          <h4 className="font-space-grotesk text-sm font-bold text-on-surface mb-1">
            {idea.name}
          </h4>
          <p className="text-xs text-on-surface-muted leading-relaxed mb-2.5">
            {idea.description}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {idea.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-space-grotesk font-medium px-2 py-0.5 rounded-full bg-primary/8 text-primary-dim border border-primary/15"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Completion Banner ───────────────────────────────────────────────

function CompletionBanner() {
  // Scattered glow dots positions
  const dots = [
    "top-4 left-8",
    "top-6 right-12",
    "bottom-8 left-16",
    "bottom-4 right-8",
    "top-12 left-1/3",
    "bottom-12 right-1/3",
    "top-3 right-1/4",
    "bottom-6 left-1/4",
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl p-8 text-center bg-surface-low/80 backdrop-blur-[20px] border border-primary/30 animate-bannerIn">
      {/* Ambient gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-primary/15 rounded-full blur-[80px] pointer-events-none" />

      {/* Glow dots */}
      {dots.map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos} w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary-dim to-secondary opacity-40 animate-pulse`}
          style={{ animationDelay: `${i * 200}ms` }}
        />
      ))}

      <div className="relative z-10">
        <h2 className="font-space-grotesk text-3xl font-bold bg-gradient-to-r from-primary-dim to-secondary bg-clip-text text-transparent">
          JESTEŚ GOTOWY!
        </h2>
        <p className="text-on-surface-muted text-base mt-2 mb-6">
          Wszystkie kroki ukończone. Do zobaczenia na hackatonie!
        </p>
        <Link href="/my-project">
          <GradientButton>ZGŁOŚ PROJEKT</GradientButton>
        </Link>
      </div>
    </div>
  );
}
