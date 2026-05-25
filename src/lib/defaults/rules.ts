import type { RulesContent } from "@/lib/types";

export const DEFAULT_RULES: RulesContent = {
  tagline: "Nie buduj ładnego. Buduj użytecznego.",
  time_range: "15:00–19:00",
  what_is_md:
    "~3h warsztat budowania **realnych rzeczy z AI**. Nie event teoretyczny. Nie prezentacja slajdów. Zero teorii o modelach. Tylko praktyka.\n\n" +
    "- Solo lub grupy 2–5 osób\n" +
    "- Otwarte dla wszystkich — nie tylko developerzy. QA, PM, Backoffice — każdy mile widziany\n" +
    "- Cel: pokazać, że **każdy może zbudować coś użytecznego** z pomocą AI",
  rules_cards: [
    {
      number: "01",
      title: "Vibecoduj",
      description: "Buduj aplikację bez głębokiego pisania kodu. AI pisze — Ty sterujesz.",
    },
    {
      number: "02",
      title: "Nowy projekt",
      description: "Stwórz coś nowego. Nie kontynuuj starych projektów.",
    },
    {
      number: "03",
      title: "Liczy się pomysł + AI",
      description: "Nie oceniamy jakości kodu. Liczy się pomysł i to, jak wykorzystałeś AI.",
    },
    {
      number: "04",
      title: "Automatyzuj irytacje",
      description: "Jeśli coś Cię irytuje w codziennej pracy — zautomatyzuj to. To jest ten moment.",
    },
  ],
  before_intro:
    "Hackathon to czas na budowanie, nie na konfigurację. Przygotuj się wcześniej.",
  before_checklist: [
    "Firmowy laptop (nie prywatny)",
    "Sieć firmowa (nie hotspot)",
    "Zalogowane narzędzie AI — sprawdź **przed** hackatonem",
    "Możliwość instalowania paczek",
    "Konto GitHub — załóż wcześniej jeśli nie masz",
    "Przyjdź z **pełnym limitem tokenów** — nie zużywaj ich wcześniej tego dnia",
  ],
  tokens_box_md:
    "Każdy uczestnik otrzyma **API key** jeśli nie ma subskrypcji lub skończą mu się limity podczas hackathonu. " +
    "Limit: **$5 na tokeny** per osoba. Klucz znajdziesz w swoim [profilu](/profile).",
  dont_come_if: [
    "Instalować wszystko od zera",
    "Pracować na prywatnym komputerze",
    "Łączyć się przez hotspot",
  ],
  prizes: [
    {
      icon_key: "energy",
      title: "Droga od koncepcji do realizacji",
      description: "Jak doszedłeś od pomysłu do działającego projektu",
    },
    {
      icon_key: "idea",
      title: "Kreatywność pomysłu",
      description: "Oryginalność i nieszablonowe podejście",
    },
    {
      icon_key: "value",
      title: "Przydatność / wartość użytkowa",
      description: "Coś, co realnie rozwiązuje problem w pracy",
    },
  ],
  schedule: [
    {
      time: "15:00 – 15:15",
      title: "Wprowadzenie",
      location: "Sky Garden",
    },
    {
      time: "15:15 – 18:15",
      title: "3h hackowania!",
      location: "Wszystkie przestrzenie wspólne — Sky Garden i Ahoy",
    },
    {
      time: "18:15 – 18:30",
      title: "Zakończenie i rozpoczęcie głosowania",
      location: "Sky Garden",
    },
  ],
  closing_callout_md:
    "Nie możesz być od początku? Spoko — prezentacja z wprowadzenia będzie **dostępna online**, więc możesz dołączyć i zacząć hackować, kiedy tylko będziesz dostępny.\n\n" +
    "Będzie **pizza** 🍕 — zadbamy o to, żebyście nie hackowali na głodniaka. Zależy nam na **luźnej atmosferze** — to ma być frajda, nie korpo-event. Przyjdź, baw się, buduj.",
};
