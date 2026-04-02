export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqSection {
  id: string;
  title: string;
  icon: string;
  items: FaqItem[];
}

export const faqSections: FaqSection[] = [
  {
    id: "tokens",
    title: "Tokeny i narzędzia AI",
    icon: "key",
    items: [
      {
        question: "Czym są tokeny?",
        answer:
          'Tokeny to "waluta" narzędzi AI — każde słowo, które wysyłasz i otrzymujesz, kosztuje tokeny. Jedno słowo to mniej więcej 1–3 tokeny. Kiedy prowadzisz długą rozmowę z AI albo wysyłasz duże pliki z kodem, zużywasz ich więcej. Limit tokenów masz zarówno na kluczu API od organizatorów (widoczny w profilu), jak i na własnej subskrypcji. Jak się wyczerpie — narzędzie przestanie odpowiadać. Dlatego warto oszczędzać (patrz: "Jak oszczędzać tokeny?").',
      },
      {
        question: "Jak dostać klucz API?",
        answer:
          'Wejdź w swój Profil i kliknij "Poproś o klucz API". Następnie poinformuj prowadzących (np. na kanale Teams) — wygenerują klucz, który pojawi się w Twoim profilu razem z limitem wydatków.',
      },
      {
        question: "Skończyły mi się tokeny / limit na API key. Co robić?",
        answer:
          'Daj znać prowadzącym na kanale Teams — wygenerują nowy klucz. Po otrzymaniu nowego klucza musisz go podmienić w swoim narzędziu:\n\n**Claude Code** — zamknij sesję, a jeśli byłeś zalogowany kontem Claude, wpisz najpierw /logout. Potem ustaw nowy klucz:\nexport OPENROUTER_API_KEY=nowy-klucz\nexport ANTHROPIC_BASE_URL=https://openrouter.ai/api\nexport ANTHROPIC_AUTH_TOKEN=$OPENROUTER_API_KEY\nexport ANTHROPIC_API_KEY=""\nWażne: ANTHROPIC_API_KEY musi być puste.\n\n**Codex CLI** — wystarczy podmienić zmienną:\nexport OPENROUTER_API_KEY=nowy-klucz\n(plik ~/.codex/config.toml nie wymaga zmian)\n\n**Gemini CLI** — korzysta z konta Google (za darmo), nie używa OpenRouter. Jeśli skończył Ci się limit na innych narzędziach, Gemini CLI to dobra alternatywa na poczekanie.\n\n**Inne opcje:** ChatGPT Free (chat.openai.com), Gemini (gemini.google.com), Cursor (darmowy plan), GitHub Copilot (jeśli masz dostęp).',
      },
      {
        question: "Jak oszczędzać tokeny?",
        answer:
          "Nie wskakuj od razu w kodowanie — to pali tokeny najszybciej. Pracuj etapami:\n\n**1. Burza mózgów** — użyj darmowego czatu (ChatGPT, Gemini, Claude.ai free). Doprecyzuj pomysł, wymyśl MVP, przedyskutuj technologie. To nic nie kosztuje.\n\n**2. Plan implementacji** — nadal w darmowym czacie. Poproś AI o rozpisanie struktury projektu, plików, kroków. Zapisz plan do pliku (np. PLAN.md).\n\n**3. Implementacja** — dopiero teraz odpal Claude Code / Codex z kluczem API. Masz gotowy plan, więc AI nie marnuje tokenów na myślenie — od razu pisze kod.\n\n**4. Debugowanie** — zamiast wklejać cały projekt do czatu, podawaj konkretny plik i błąd. Im mniej kontekstu wysyłasz, tym mniej tokenów zużywasz.\n\nZłota zasada: **darmowe narzędzia do myślenia, płatne do budowania.**",
      },
      {
        question: "Jakich narzędzi AI mogę używać?",
        answer:
          "Wszystkich! Claude Code, Cursor, Windsurf, GitHub Copilot, ChatGPT, Gemini — cokolwiek Ci pomaga. Klucz API od organizatorów działa z OpenRouter, który daje dostęp do wielu modeli. Możesz też użyć własnych subskrypcji (Claude Pro, ChatGPT Plus).",
      },
      {
        question: "Czy mogę używać kilku narzędzi na raz?",
        answer:
          "Tak, i nawet to polecamy. Np. Claude Code do generowania kodu + ChatGPT do burzy mózgów + Midjourney do grafik. Mix & match — nie ma limitu narzędzi.",
      },
      {
        question: "Klucz API nie działa / dostaję błąd autoryzacji.",
        answer:
          "Sprawdź czy klucz nie wygasł (widoczne w profilu). Upewnij się, że kopiujesz pełny klucz bez spacji. Jeśli dalej nie działa — napisz na Teams, prowadzący wygenerują nowy.",
      },
    ],
  },
  {
    id: "video",
    title: "Nagrywanie video demo",
    icon: "video",
    items: [
      {
        question: "Czym nagrać demo?",
        answer:
          "Najprościej wbudowanymi narzędziami — na Macu: QuickTime Player (Plik → Nowe nagranie ekranu), na Windowsie: Win+G (Xbox Game Bar) lub narzędzie Wycinanie. Bardziej zaawansowani mogą użyć OBS Studio (darmowy).",
      },
      {
        question: "Co powinno być na nagraniu?",
        answer:
          "Pokaż działającą aplikację — przejdź przez główny flow, pokaż co robi i dlaczego jest użyteczna. Nie musisz pokazywać kodu. Możesz nagrać z narracją głosową albo bez — jak wolisz. 60 sekund to dużo — nie próbuj pokazywać wszystkiego, skup się na tym co najciekawsze.",
      },
      {
        question: "Moje video jest za duże / nie przechodzi upload.",
        answer:
          "Limit to 50 MB, format MP4 lub MOV, max 60 sekund. Jeśli plik jest za duży, zmniejsz rozdzielczość (720p wystarczy) lub użyj HandBrake (darmowy) do kompresji. Nagrywaj w orientacji poziomej (landscape).",
      },
    ],
  },
  {
    id: "rules",
    title: "Zasady i co się liczy",
    icon: "rules",
    items: [
      {
        question: "Nie umiem programować. Czy mogę wziąć udział?",
        answer:
          'Tak! Ten hackathon jest dla każdego — QA, PM, backoffice, HR, wszyscy. "Vibecoduj" oznacza, że AI pisze kod za Ciebie, a Ty sterujesz pomysłem. Liczy się idea i to jak ją zrealizujesz z AI, nie umiejętności programistyczne.',
      },
      {
        question: "Czy mogę użyć narzędzi no-code (Bubble, Bolt, Lovable)?",
        answer:
          "Tak, jak najbardziej. Jeśli AI + no-code pozwoli Ci zbudować działającą rzecz — super. Nie oceniamy czystości kodu, oceniamy efekt końcowy.",
      },
      {
        question: "Czy mogę kontynuować stary projekt?",
        answer:
          "Nie — musisz zacząć od zera. To jedna z głównych zasad. Chodzi o to, żeby zobaczyć co da się zbudować od pomysłu do działającego prototypu w kilka godzin.",
      },
      {
        question: "Ile kodu powinienem napisać sam vs wygenerować przez AI?",
        answer:
          "Nie ma limitu — 100% AI-generated jest OK. Sędziowie oceniają pomysł, drogę do realizacji i przydatność, nie proporcję ręcznego kodu. Im sprytniej wykorzystasz AI, tym lepiej.",
      },
      {
        question: "Czy mogę zdeployować projekt na żywo?",
        answer:
          "Nie musisz, ale to duży plus! Działający link robi wrażenie. Darmowe opcje: Vercel (świetny do Next.js/React), Railway (backend, bazy danych), Netlify, Cloudflare Pages. Większość ma darmowe plany wystarczające na prototyp.",
      },
    ],
  },
  {
    id: "voting",
    title: "Głosowanie i ocenianie",
    icon: "vote",
    items: [
      {
        question: "Kto głosuje?",
        answer:
          'Wszyscy uczestnicy. Po zakończeniu fazy zgłaszania admin otworzy głosowanie — dostaniesz przycisk "Głosuj" w menu.',
      },
      {
        question: "Na co mogę głosować?",
        answer:
          "W trzech kategoriach: (1) Droga od koncepcji do realizacji — jak dobrze przeszli od pomysłu do działającego efektu, (2) Kreatywność pomysłu — oryginalność i inwencja, (3) Przydatność — czy to naprawdę rozwiązuje realny problem.",
      },
      {
        question: "Mogę zagłosować na swój projekt?",
        answer:
          "Nie — system automatycznie to blokuje. Głosujesz tylko na projekty innych.",
      },
      {
        question: "Czy mogę zmienić głos?",
        answer:
          "Nie — po oddaniu głosu jest on ostateczny. Przejrzyj spokojnie wszystkie projekty przed głosowaniem.",
      },
    ],
  },
  {
    id: "submission",
    title: "Zgłaszanie projektu",
    icon: "submit",
    items: [
      {
        question: "Do kiedy muszę zgłosić projekt?",
        answer:
          "Dokładny deadline widoczny jest w apce jako odliczanie. Zazwyczaj masz jeszcze ~3 dni po hackatonie na dopracowanie i zgłoszenie.",
      },
      {
        question: "Czy mogę edytować projekt po zgłoszeniu?",
        answer:
          'Nie — po kliknięciu "Zatwierdź projekt" nie ma odwrotu. Upewnij się, że video, opis i wszystko jest gotowe zanim zatwierdzisz.',
      },
      {
        question: "Kto z zespołu zgłasza projekt?",
        answer:
          'Tylko lider zespołu może kliknąć "Zatwierdź". Reszta zespołu widzi podgląd, ale nie ma przycisku zatwierdzenia.',
      },
      {
        question: "Jakie pliki mogę załączyć?",
        answer:
          "Video demo (MP4/MOV, max 50 MB, max 60s) — wymagane. Opcjonalnie: miniatura projektu (max 5 MB), prezentacja PDF (max 20 MB), link do repozytorium GitHub.",
      },
    ],
  },
  {
    id: "team",
    title: "Zespół i organizacja",
    icon: "team",
    items: [
      {
        question: "Mogę pracować solo?",
        answer:
          'Tak — podczas onboardingu wybierasz "Pracuję solo". Projekty solo są oceniane na równi z zespołowymi.',
      },
      {
        question: "Ile osób może być w zespole?",
        answer: "Od 1 do 5 osób.",
      },
      {
        question: "Czy mogę zmienić zespół po onboardingu?",
        answer:
          'Tak — możesz opuścić zespół na stronie "Zespół" i dołączyć do innego. Jeśli jesteś liderem i opuścisz zespół, zespół zostanie rozwiązany.',
      },
      {
        question: "Jak dołączyć do istniejącego zespołu?",
        answer:
          'Na stronie "Zespół" zobaczysz listę otwartych zespołów. Kliknij "Dołącz" — lider dostanie prośbę do akceptacji.',
      },
    ],
  },
  {
    id: "tech",
    title: "Stack technologiczny",
    icon: "tech",
    items: [
      {
        question: "Jakiego stacku muszę użyć?",
        answer:
          "Dowolnego! React, Vue, Svelte, Python Flask, Node, Go, PHP — cokolwiek. Nie ma ograniczeń. Możesz nawet zrobić arkusz Google z makrami, jeśli rozwiązuje problem.",
      },
      {
        question: "Czy muszę deployować na serwer?",
        answer:
          "Nie — wystarczy, że działa na Twoim komputerze i pokażesz to na video. Deployment to bonus, nie wymóg.",
      },
      {
        question: "Czy mogę użyć zewnętrznych API?",
        answer:
          "Tak — Slack API, Google Sheets, Strava, jakiekolwiek. Pamiętaj tylko, żeby na video pokazać jak to działa (nie każdy juror będzie miał dostęp do tych API).",
      },
    ],
  },
  {
    id: "support",
    title: "Pomoc i support",
    icon: "support",
    items: [
      {
        question: "Coś nie działa / mam problem techniczny. Gdzie pisać?",
        answer:
          'Na kanale Teams "AI Enablement Hackathon". Organizatorzy monitorują kanał na bieżąco w trakcie hackatonu.',
      },
      {
        question: "Nie mogę się zalogować do aplikacji.",
        answer:
          "Sprawdź czy używasz tego samego emaila na który dostałeś zaproszenie. Jeśli nie pomaga — napisz na Teams.",
      },
      {
        question: "Mam problem z setupem narzędzi AI.",
        answer:
          'Przejdź krok po kroku przez stronę "Poradnik" w menu — jest tam instrukcja dla każdego systemu. Jeśli dalej nie działa, daj znać na Teams z opisem błędu.',
      },
    ],
  },
  {
    id: "after",
    title: "Po hackatonie",
    icon: "after",
    items: [
      {
        question: "Co się dzieje z projektami po wydarzeniu?",
        answer:
          "Projekty zostają w aplikacji jako galeria. Możesz pokazywać swój projekt innym. Kod na GitHubie jest Twój.",
      },
      {
        question: "Czy są nagrody?",
        answer:
          "Zwycięzcy w każdej kategorii zostaną ogłoszeni i wyróżnieni. Szczegóły nagród poznasz na samym wydarzeniu.",
      },
    ],
  },
  {
    id: "logistics",
    title: "Logistyka dnia",
    icon: "logistics",
    items: [
      {
        question: "Jak wygląda harmonogram?",
        answer:
          "~15 min intro i wyjaśnienie zasad → 2.5–3h hackowanie → ~30 min na dopięcie i zamknięcie. Dokładne godziny podane w zaproszeniu.",
      },
      {
        question: "Co zabrać ze sobą?",
        answer:
          'Laptop firmowy (nie prywatny), ładowarkę, słuchawki (opcjonalnie). Upewnij się PRZED hackathnem, że masz zainstalowane narzędzia (zobacz "Poradnik" w menu).',
      },
      {
        question: "Czy mogę pracować zdalnie?",
        answer:
          "Hackathon jest stacjonarny — chodzi o energię wspólnego budowania. Jeśli masz problem z obecnością, skontaktuj się z organizatorami.",
      },
    ],
  },
];
