export const START_PAGE_KEYS = ["rules", "guide", "faq", "ideas", "prompts"] as const;

export type StartPageKey = (typeof START_PAGE_KEYS)[number];

export const START_PAGE_LABELS: Record<StartPageKey, string> = {
  rules: "Garage Rules",
  guide: "Poradnik",
  faq: "Q&A",
  ideas: "Pomysły na projekty",
  prompts: "Przydatne prompty",
};

export function isStartPageHidden(
  hidden: string[] | null | undefined,
  key: StartPageKey,
): boolean {
  return (hidden ?? []).includes(key);
}
