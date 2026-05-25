export interface DefaultUsefulPrompt {
  number: number;
  title: string;
  description: string;
  prompt: string;
}

export const DEFAULT_PROMPTS: DefaultUsefulPrompt[] = [
  {
    number: 1,
    title: "Discovery",
    description: "Zrozum co budujesz, zanim zaczniesz kodować",
    prompt:
      "Chcę zbudować aplikację: [krótki opis]\n\nZadaj mi pytania, które pomogą doprecyzować:\n- cel aplikacji\n- użytkowników\n- główne funkcjonalności\n- ograniczenia techniczne\n\nNie proponuj jeszcze rozwiązania — tylko pytania i doprecyzowanie.",
  },
  {
    number: 2,
    title: "Scope + MVP",
    description: "Żeby nie zrobić overengineeringu",
    prompt:
      'Na podstawie tego opisu:\n[opis projektu]\n\nZdefiniuj:\n- MVP (co MUSI być)\n- rzeczy "nice to have"\n- czego NIE robić na początku\n\nUzasadnij krótko decyzje.',
  },
  {
    number: 3,
    title: "Plan techniczny",
    description: "Zapisz go do pliku, żeby AI miało kontekst",
    prompt:
      "Na podstawie projektu:\n[opis]\n\nZaproponuj:\n- architekturę (frontend, backend, baza danych)\n- stack technologiczny (z uzasadnieniem)\n- strukturę projektu\n- kolejność implementacji krok po kroku\n\nTraktuj mnie jak juniora — wyjaśniaj decyzje.\n\nZapisz plan do pliku PLAN.md w katalogu projektu.",
  },
  {
    number: 4,
    title: "Implementacja",
    description:
      "NIE wszystko naraz. Po każdym etapie zacznij nową rozmowę — mniej tokenów, szybsze odpowiedzi",
    prompt:
      "Chcę zbudować:\n[feature]\n\nPodziel to na małe kroki i prowadź mnie:\n- jeden krok = jedno zadanie\n- po każdym kroku poczekaj na moją odpowiedź\n\nDodawaj kod + krótkie wyjaśnienie.",
  },
  {
    number: 5,
    title: "Debug / Code Review",
    description: "Znajdź błędy i naucz mnie",
    prompt:
      "Mam taki kod:\n[kod]\n\nZrób:\n- code review\n- znajdź błędy\n- zaproponuj poprawki\n- wyjaśnij DLACZEGO coś jest problemem\n\nNie tylko popraw — naucz mnie.",
  },
];
