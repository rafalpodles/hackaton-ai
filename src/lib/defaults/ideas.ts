export interface DefaultProjectIdea {
  name: string;
  description: string;
  tags: string[];
}

export const DEFAULT_IDEAS: DefaultProjectIdea[] = [
  {
    name: "Office Food Alert",
    description: "Powiadomienia o dostawie jedzenia do biura. Subskrybujesz się i dostajesz alert, gdy pizza jest na miejscu.",
    tags: ["powiadomienia", "real-time"],
  },
  {
    name: "Lunch Buddy Finder",
    description: "Kto idzie dziś na obiad? Spontaniczne organizowanie się na lunch w grupach.",
    tags: ["social", "czat"],
  },
  {
    name: "Parking Spot Notifier",
    description: "Rezerwacja miejsc parkingowych lub biurek w stylu hot-desk. Sprawdź dostępność, zarezerwuj, zwolnij.",
    tags: ["rezerwacje", "dashboard"],
  },
  {
    name: "Meeting Room Finder",
    description: "Czatbot do salek konferencyjnych. Napisz \"potrzebuję salki na 6 osób o 14:00\" i gotowe.",
    tags: ["AI czatbot", "rezerwacje"],
  },
  {
    name: "Meeting Room Status",
    description: "Dashboard do salek — która jest wolna, która zajęta i do kiedy. Widok na ekranie przy salce.",
    tags: ["dashboard", "real-time"],
  },
  {
    name: "Weekly Sum-up",
    description: "AI generuje podsumowanie po spotkaniu na podstawie notatek lub transkrypcji. Kluczowe ustalenia i action items.",
    tags: ["AI", "produktywność"],
  },
  {
    name: "Piłeczka ze Spyro",
    description: "Organizowanie meczy piłki nożnej, siatkówki itp. Zgłoszenia, czat, statystyki, kalendarz spotkań.",
    tags: ["social", "sport", "kalendarz"],
  },
  {
    name: "Spyrosoft Event Calendar",
    description: "Kalendarz eventów firmowych — akcje charytatywne, integracje, linki do zbiórek, przypisywanie prezentów.",
    tags: ["kalendarz", "social"],
  },
  {
    name: "Strava Challenge Dashboard",
    description: "Dashboard do wyzwań sportowych. Synchronizacja z aktywnościami, ranking, motywacja zespołowa.",
    tags: ["sport", "dashboard", "API"],
  },
  {
    name: "Campfire App",
    description: "Platforma do wewnętrznych eventów — zgłoszenia, akceptacje, nagrania, podsumowania AI, filtry po tematyce.",
    tags: ["AI", "eventy", "multimedia"],
  },
];
