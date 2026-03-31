export type OS = "mac" | "windows" | "linux";
export type Path = "beginner" | "advanced";
export type Category = "fundamenty" | "ai-tools" | "weryfikacja";
export type Subscription = "claude" | "openai" | "openrouter";

export interface CodeStep {
  text?: string;
  command?: string;
  output?: string;
  /** If set, only show this step for matching subscription(s) */
  sub?: Subscription | Subscription[];
}

export const SUBSCRIPTION_LABELS: Record<Subscription, string> = {
  claude: "Claude Pro / Max",
  openai: "ChatGPT Plus / Pro",
  openrouter: "Klucz API od organizatorów",
};

export interface PlatformInstructions {
  steps: CodeStep[];
}

export interface GuideStep {
  id: string;
  title: string;
  category: Category;
  paths: Path[];
  /** If set, only show this step when one of these subscriptions is selected */
  showForSubs?: Subscription[];
  instructions: {
    description: string;
    platforms: {
      mac?: PlatformInstructions;
      windows?: PlatformInstructions;
      linux?: PlatformInstructions;
    };
    tips?: string[];
    warnings?: string[];
    links?: { label: string; url: string }[];
  };
}

export const CATEGORY_LABELS: Record<Category, string> = {
  fundamenty: "FUNDAMENTY",
  "ai-tools": "AI TOOLS",
  weryfikacja: "WERYFIKACJA",
};

export const CATEGORY_DESCRIPTIONS: Partial<Record<Category, string>> = {
  fundamenty: "Zainstaluj podstawowe narzędzia — potem przejdź do AI Tools.",
  "ai-tools": "Wybierz i skonfiguruj narzędzia AI do kodowania.",
  weryfikacja: "Ostatni krok — upewnij się, że wszystko działa.",
};

export const guideSteps: GuideStep[] = [
  // ─── FUNDAMENTY ─────────────────────────────────────────────────────
  {
    id: "terminal",
    title: "Terminal — twój nowy przyjaciel",
    category: "fundamenty",
    paths: ["beginner"],
    instructions: {
      description:
        "Terminal to podstawowe narzędzie każdego programisty. Pozwala uruchamiać komendy, instalować narzędzia i zarządzać projektami.",
      platforms: {
        mac: {
          steps: [
            {
              text: 'Otwórz Spotlight (Cmd + Spacja) i wpisz "Terminal", lub znajdź go w Aplikacje > Narzędzia.',
            },
            {
              command: 'echo "Hello from Terminal!"',
              output: "Hello from Terminal!",
            },
          ],
        },
        windows: {
          steps: [
            {
              text: 'Naciśnij Win + X i wybierz "Terminal" (Windows Terminal). Jeśli go nie masz, pobierz z Microsoft Store.',
            },
            {
              command: 'echo "Hello from Terminal!"',
              output: "Hello from Terminal!",
            },
          ],
        },
        linux: {
          steps: [
            {
              text: "Naciśnij Ctrl + Alt + T lub znajdź Terminal w menu aplikacji.",
            },
            {
              command: 'echo "Hello from Terminal!"',
              output: "Hello from Terminal!",
            },
          ],
        },
      },
      tips: [
        "Terminal to nie jest straszne! Większość komend to proste angielskie słowa.",
      ],
    },
  },
  {
    id: "vscode",
    title: "VS Code — edytor kodu",
    category: "fundamenty",
    paths: ["beginner"],
    instructions: {
      description:
        "Visual Studio Code to najpopularniejszy edytor kodu. Ma wbudowany terminal, więc możesz go używać od razu do wpisywania komend.",
      platforms: {
        mac: {
          steps: [
            {
              text: "Pobierz instaler, przeciągnij do folderu Aplikacje i uruchom.",
            },
          ],
        },
        windows: {
          steps: [
            {
              text: "Pobierz instaler, uruchom i przejdź przez instalację (zostaw domyślne ustawienia).",
            },
          ],
        },
        linux: {
          steps: [
            {
              text: "Pobierz paczkę .deb lub .rpm i zainstaluj.",
            },
          ],
        },
      },
      links: [
        { label: "Pobierz VS Code", url: "https://code.visualstudio.com/" },
      ],
      tips: [
        "VS Code ma wbudowany terminal (Ctrl + `) — możesz go używać zamiast osobnej aplikacji terminala.",
        "Do pisania kodu z AI możesz też użyć Cursor, Windsurf lub Antigravity (kroki niżej).",
      ],
    },
  },
  {
    id: "git",
    title: "Git — kontrola wersji",
    category: "fundamenty",
    paths: ["beginner"],
    instructions: {
      description:
        "Git to system kontroli wersji, który pozwala śledzić zmiany w kodzie i współpracować z innymi.",
      platforms: {
        mac: {
          steps: [
            {
              text: "Na macOS Git często jest już zainstalowany — sprawdź w terminalu:",
              command: "git --version",
              output: "git version 2.x.x",
            },
            {
              text: "Jeśli system poprosi o instalację Command Line Tools — zaakceptuj, to zainstaluje Gita.",
            },
            {
              text: 'Po instalacji skonfiguruj swoje dane. Zamień "Jan Kowalski" i email na swoje prawdziwe dane:',
              command:
                'git config --global user.name "Jan Kowalski"\ngit config --global user.email "jan.kowalski@spyrosoft.com"',
            },
          ],
        },
        windows: {
          steps: [
            {
              text: "Pobierz instaler i zainstaluj. Podczas instalacji zostaw domyślne ustawienia.",
            },
            {
              text: 'Skonfiguruj swoje dane. Zamień "Jan Kowalski" i email na swoje prawdziwe dane:',
              command:
                'git config --global user.name "Jan Kowalski"\ngit config --global user.email "jan.kowalski@spyrosoft.com"',
            },
            {
              text: "Sprawdź czy działa:",
              command: "git --version",
              output: "git version 2.x.x",
            },
          ],
        },
        linux: {
          steps: [
            {
              text: "Zainstaluj Git z menedżera pakietów:",
              command: "sudo apt install git -y",
            },
            {
              text: 'Skonfiguruj swoje dane. Zamień "Jan Kowalski" i email na swoje prawdziwe dane:',
              command:
                'git config --global user.name "Jan Kowalski"\ngit config --global user.email "jan.kowalski@spyrosoft.com"',
            },
          ],
        },
      },
      links: [
        { label: "Pobierz Git", url: "https://git-scm.com/downloads" },
      ],
    },
  },
  {
    id: "github-account",
    title: "Konto GitHub",
    category: "fundamenty",
    paths: ["beginner"],
    instructions: {
      description:
        "GitHub to platforma do przechowywania kodu i współpracy. Będziesz go potrzebować, żeby wrzucić swój projekt. Załóż konto i skonfiguruj autoryzację.",
      platforms: {
        mac: {
          steps: [
            {
              text: "Wejdź na github.com i załóż konto (jeśli jeszcze nie masz). Użyj firmowego emaila.",
            },
            {
              text: "Skonfiguruj autoryzację — najłatwiej przez HTTPS z tokenem. Wejdź na GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic) > Generate new token.",
            },
            {
              text: "Przy pierwszym git push system poprosi o login. Jako hasło wklej wygenerowany token.",
            },
          ],
        },
        windows: {
          steps: [
            {
              text: "Wejdź na github.com i załóż konto (jeśli jeszcze nie masz). Użyj firmowego emaila.",
            },
            {
              text: "Skonfiguruj autoryzację — najłatwiej przez HTTPS z tokenem. Wejdź na GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic) > Generate new token.",
            },
            {
              text: "Przy pierwszym git push system poprosi o login. Jako hasło wklej wygenerowany token. Windows zapamięta go automatycznie.",
            },
          ],
        },
        linux: {
          steps: [
            {
              text: "Wejdź na github.com i załóż konto (jeśli jeszcze nie masz). Użyj firmowego emaila.",
            },
            {
              text: "Skonfiguruj autoryzację — najłatwiej przez HTTPS z tokenem. Wejdź na GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic) > Generate new token.",
            },
            {
              text: "Zapisz token w credential store, żeby nie wpisywać go za każdym razem:",
              command: "git config --global credential.helper store",
            },
          ],
        },
      },
      links: [
        { label: "Załóż konto GitHub", url: "https://github.com/signup" },
        {
          label: "Generuj token",
          url: "https://github.com/settings/tokens/new",
        },
      ],
      tips: [
        "Przy generowaniu tokena zaznacz scope 'repo' — to wystarczy na hackathon.",
      ],
    },
  },
  {
    id: "nodejs",
    title: "Node.js",
    category: "fundamenty",
    paths: ["beginner"],
    instructions: {
      description:
        "Node.js to środowisko uruchomieniowe JavaScript. Potrzebujesz go, żeby uruchamiać narzędzia AI (Claude Code, Codex itp.).",
      platforms: {
        mac: {
          steps: [
            {
              text: "Pobierz instaler (.pkg) — wybierz wersję LTS (Long Term Support). Otwórz pobrany plik i przejdź przez instalację.",
            },
            {
              text: "Sprawdź czy działa:",
              command: "node --version && npm --version",
              output: "v22.x.x\n10.x.x",
            },
          ],
        },
        windows: {
          steps: [
            {
              text: "Pobierz instaler (.msi) — wybierz wersję LTS. Uruchom i przejdź przez instalację (zostaw domyślne ustawienia).",
            },
            {
              text: "Sprawdź czy działa:",
              command: "node --version && npm --version",
              output: "v22.x.x\n10.x.x",
            },
          ],
        },
        linux: {
          steps: [
            {
              text: "Zainstaluj Node.js z repozytorium NodeSource:",
              command:
                "curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -\nsudo apt install -y nodejs",
            },
            {
              text: "Sprawdź czy działa:",
              command: "node --version && npm --version",
              output: "v22.x.x\n10.x.x",
            },
          ],
        },
      },
      links: [{ label: "Pobierz Node.js", url: "https://nodejs.org/" }],
      tips: [
        "Zawsze wybieraj wersję LTS — jest stabilniejsza i lepiej wspierana.",
      ],
    },
  },
  {
    id: "python",
    title: "Python",
    category: "fundamenty",
    paths: ["beginner"],
    instructions: {
      description:
        "Python to popularny język programowania, szczególnie w AI/ML. Jeśli planujesz projekt w Pythonie — zainstaluj. Jeśli nie — możesz pominąć.",
      platforms: {
        mac: {
          steps: [
            {
              text: "Pobierz instaler (.pkg) — wybierz najnowszą wersję 3.13. Otwórz pobrany plik i przejdź przez instalację.",
            },
            {
              text: "Sprawdź czy działa:",
              command: "python3 --version",
              output: "Python 3.13.x",
            },
          ],
        },
        windows: {
          steps: [
            {
              text: 'Pobierz instaler (.exe). WAŻNE: podczas instalacji zaznacz checkbox "Add Python to PATH" — bez tego komendy nie zadziałają w terminalu!',
            },
            {
              text: "Sprawdź czy działa:",
              command: "python --version",
              output: "Python 3.13.x",
            },
          ],
        },
        linux: {
          steps: [
            {
              text: "Python jest zazwyczaj preinstalowany. Sprawdź wersję:",
              command: "python3 --version",
              output: "Python 3.x.x",
            },
            {
              text: "Jeśli nie masz lub chcesz nowszą wersję:",
              command: "sudo apt install -y python3 python3-pip",
            },
          ],
        },
      },
      links: [
        {
          label: "Pobierz Python",
          url: "https://www.python.org/downloads/",
        },
      ],
    },
  },
  {
    id: "homebrew",
    title: "Homebrew / Winget",
    category: "fundamenty",
    paths: ["advanced"],
    instructions: {
      description:
        "Menedżer pakietów pozwala łatwo instalować i aktualizować narzędzia programistyczne z poziomu terminala. Jako zaawansowany użytkownik pewnie już go masz.",
      platforms: {
        mac: {
          steps: [
            {
              text: "Zainstaluj Homebrew — menedżer pakietów dla macOS:",
              command:
                '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
            },
            {
              text: "Sprawdź czy działa:",
              command: "brew --version",
              output: "Homebrew 4.x.x",
            },
          ],
        },
        windows: {
          steps: [
            {
              text: "Winget jest wbudowany w Windows 10/11. Sprawdź czy działa:",
              command: "winget --version",
              output: "v1.x.xxxx",
            },
            {
              text: "Jeśli nie masz winget, zaktualizuj App Installer z Microsoft Store.",
            },
          ],
        },
        linux: {
          steps: [
            {
              text: "apt jest domyślnym menedżerem pakietów. Zaktualizuj listę pakietów:",
              command: "sudo apt update && sudo apt upgrade -y",
            },
          ],
        },
      },
      tips: [
        "Po instalacji Homebrew zamknij i otwórz terminal ponownie, żeby komendy zadziałały.",
      ],
    },
  },
  {
    id: "docker",
    title: "Docker Desktop",
    category: "fundamenty",
    paths: ["advanced"],
    instructions: {
      description:
        "Docker pozwala uruchamiać aplikacje w kontenerach — izolowanych środowiskach z wszystkimi zależnościami. Przydatny, ale nie wymagany na hackathon.",
      platforms: {
        mac: {
          steps: [
            {
              text: "Zainstaluj przez Homebrew lub pobierz instaler ze strony:",
              command: "brew install --cask docker",
            },
            {
              text: "Uruchom Docker Desktop z Aplikacji, potem sprawdź:",
              command: "docker --version",
              output: "Docker version 27.x.x",
            },
          ],
        },
        windows: {
          steps: [
            {
              text: "Zainstaluj przez winget lub pobierz instaler ze strony:",
              command: "winget install Docker.DockerDesktop",
            },
            {
              text: "Uruchom Docker Desktop, potem sprawdź w terminalu:",
              command: "docker --version",
              output: "Docker version 27.x.x",
            },
          ],
        },
        linux: {
          steps: [
            {
              text: "Zainstaluj Docker Engine:",
              command:
                "curl -fsSL https://get.docker.com | sh\nsudo usermod -aG docker $USER",
            },
            {
              text: "Wyloguj się i zaloguj ponownie, potem sprawdź:",
              command: "docker --version",
              output: "Docker version 27.x.x",
            },
          ],
        },
      },
      links: [
        {
          label: "Docker Desktop",
          url: "https://www.docker.com/products/docker-desktop/",
        },
      ],
      tips: [
        "Docker Desktop wymaga ok. 4 GB RAM — jeśli masz mało pamięci, możesz pominąć ten krok.",
      ],
    },
  },

  // ─── AI TOOLS ───────────────────────────────────────────────────────
  {
    id: "native-ai-apps",
    title: "Natywne aplikacje AI",
    category: "ai-tools",
    paths: ["beginner", "advanced"],
    instructions: {
      description:
        "Jeśli wolisz pracować w aplikacji desktopowej zamiast terminala — te narzędzia mają graficzny interfejs i są łatwiejsze na start. Idealne do planowania projektu i burzy mózgów.",
      platforms: {
        mac: {
          steps: [
            {
              text: "Claude Desktop — aplikacja desktopowa od Anthropic. Czat z Claude, wgrywanie plików, analiza obrazów.",
            },
            {
              text: "ChatGPT Desktop — aplikacja od OpenAI z dostępem do GPT-4o. Podobne możliwości: czat, analiza kodu, generowanie.",
            },
          ],
        },
        windows: {
          steps: [
            {
              text: "Claude Desktop — aplikacja desktopowa od Anthropic. Czat z Claude, wgrywanie plików, analiza obrazów.",
            },
            {
              text: "ChatGPT Desktop — aplikacja od OpenAI z dostępem do GPT-4o. Podobne możliwości: czat, analiza kodu, generowanie.",
            },
          ],
        },
        linux: {
          steps: [
            {
              text: "Claude Desktop i ChatGPT Desktop nie są oficjalnie dostępne na Linuxa. Użyj wersji webowej: claude.ai lub chatgpt.com.",
            },
          ],
        },
      },
      links: [
        { label: "Claude Desktop", url: "https://claude.ai/download" },
        {
          label: "ChatGPT Desktop",
          url: "https://openai.com/chatgpt/desktop/",
        },
      ],
      tips: [
        "Możesz używać aplikacji desktopowej i narzędzi CLI jednocześnie — np. planuj w Claude Desktop, koduj przez Claude Code.",
      ],
    },
  },
  {
    id: "claude-code",
    title: "Claude Code",
    category: "ai-tools",
    paths: ["beginner", "advanced"],
    showForSubs: ["claude", "openrouter"],
    instructions: {
      description:
        "Claude Code to narzędzie AI od Anthropic, które pomaga pisać i debugować kod bezpośrednio w terminalu. To główne narzędzie na nasz hackathon!",
      platforms: {
        mac: {
          steps: [
            {
              text: "Zainstaluj Claude Code globalnie:",
              command: "npm install -g @anthropic-ai/claude-code",
            },
            {
              text: "Zaloguj się swoim kontem Claude — otworzy się przeglądarka:",
              command: "claude",
              sub: "claude",
            },
            {
              text: "Skonfiguruj klucz OpenRouter i uruchom:",
              command:
                "export ANTHROPIC_BASE_URL=https://openrouter.ai/api/v1\nexport ANTHROPIC_API_KEY=twoj-klucz-openrouter\nclaude",
              sub: ["openai", "openrouter"],
            },
          ],
        },
        windows: {
          steps: [
            {
              text: "Zainstaluj Claude Code globalnie:",
              command: "npm install -g @anthropic-ai/claude-code",
            },
            {
              text: "Zaloguj się swoim kontem Claude — otworzy się przeglądarka:",
              command: "claude",
              sub: "claude",
            },
            {
              text: "Skonfiguruj klucz OpenRouter i uruchom:",
              command:
                "set ANTHROPIC_BASE_URL=https://openrouter.ai/api/v1\nset ANTHROPIC_API_KEY=twoj-klucz-openrouter\nclaude",
              sub: ["openai", "openrouter"],
            },
          ],
        },
        linux: {
          steps: [
            {
              text: "Zainstaluj Claude Code globalnie:",
              command: "npm install -g @anthropic-ai/claude-code",
            },
            {
              text: "Zaloguj się swoim kontem Claude — otworzy się przeglądarka:",
              command: "claude",
              sub: "claude",
            },
            {
              text: "Skonfiguruj klucz OpenRouter i uruchom:",
              command:
                "export ANTHROPIC_BASE_URL=https://openrouter.ai/api/v1\nexport ANTHROPIC_API_KEY=twoj-klucz-openrouter\nclaude",
              sub: ["openai", "openrouter"],
            },
          ],
        },
      },
      links: [
        {
          label: "Dokumentacja Claude Code",
          url: "https://docs.anthropic.com/en/docs/claude-code",
        },
      ],
      tips: [
        "Twoja subskrypcja Claude Pro/Max daje dostęp do Claude Code bez dodatkowych kosztów.",
        "Klucz OpenRouter otrzymasz od organizatorów w dniu hackathonu.",
      ],
      warnings: [
        "Zmienne środowiskowe (export/set) znikają po zamknięciu terminala! Dodaj je do ~/.zshrc (macOS/Linux) lub ustaw w Ustawieniach systemu > Zmienne środowiskowe (Windows), żeby nie wpisywać ich za każdym razem.",
        'Jeśli "npm install -g" nie działa (brak uprawnień), spróbuj: sudo npm install -g ... (macOS/Linux) lub uruchom terminal jako Administrator (Windows).',
      ],
    },
  },
  {
    id: "gemini-cli",
    title: "Gemini CLI",
    category: "ai-tools",
    paths: ["beginner", "advanced"],
    instructions: {
      description:
        "Gemini CLI to narzędzie od Google do interakcji z modelami Gemini z poziomu terminala. Autoryzacja kontem Google jest darmowa!",
      platforms: {
        mac: {
          steps: [
            {
              text: "Zainstaluj Gemini CLI:",
              command: "npm install -g @google/gemini-cli",
            },
            {
              text: "Uruchom i autoryzuj się kontem Google (darmowe):",
              command: "gemini",
            },
          ],
        },
        windows: {
          steps: [
            {
              text: "Zainstaluj Gemini CLI:",
              command: "npm install -g @google/gemini-cli",
            },
            {
              text: "Uruchom i autoryzuj się kontem Google (darmowe):",
              command: "gemini",
            },
          ],
        },
        linux: {
          steps: [
            {
              text: "Zainstaluj Gemini CLI:",
              command: "npm install -g @google/gemini-cli",
            },
            {
              text: "Uruchom i autoryzuj się kontem Google (darmowe):",
              command: "gemini",
            },
          ],
        },
      },
      links: [
        {
          label: "Gemini CLI",
          url: "https://www.npmjs.com/package/@google/gemini-cli",
        },
      ],
      tips: [
        "Gemini CLI z kontem Google daje darmowy dostęp do modeli Gemini — nie potrzebujesz klucza API!",
      ],
    },
  },
  {
    id: "codex",
    title: "Codex (OpenAI)",
    category: "ai-tools",
    paths: ["beginner", "advanced"],
    showForSubs: ["openai", "openrouter"],
    instructions: {
      description:
        "Codex CLI od OpenAI to narzędzie do generowania kodu z poziomu terminala, korzystające z modeli GPT/o-series.",
      platforms: {
        mac: {
          steps: [
            {
              text: "Zainstaluj Codex CLI:",
              command: "npm install -g @openai/codex",
            },
            {
              text: "Zaloguj się swoim kontem OpenAI — otworzy się przeglądarka:",
              command: "codex",
              sub: "openai",
            },
            {
              text: "Skonfiguruj klucz OpenRouter i uruchom:",
              command:
                "export OPENAI_BASE_URL=https://openrouter.ai/api/v1\nexport OPENAI_API_KEY=twoj-klucz-openrouter\ncodex",
              sub: ["claude", "openrouter"],
            },
          ],
        },
        windows: {
          steps: [
            {
              text: "Zainstaluj Codex CLI:",
              command: "npm install -g @openai/codex",
            },
            {
              text: "Zaloguj się swoim kontem OpenAI — otworzy się przeglądarka:",
              command: "codex",
              sub: "openai",
            },
            {
              text: "Skonfiguruj klucz OpenRouter i uruchom:",
              command:
                "set OPENAI_BASE_URL=https://openrouter.ai/api/v1\nset OPENAI_API_KEY=twoj-klucz-openrouter\ncodex",
              sub: ["claude", "openrouter"],
            },
          ],
        },
        linux: {
          steps: [
            {
              text: "Zainstaluj Codex CLI:",
              command: "npm install -g @openai/codex",
            },
            {
              text: "Zaloguj się swoim kontem OpenAI — otworzy się przeglądarka:",
              command: "codex",
              sub: "openai",
            },
            {
              text: "Skonfiguruj klucz OpenRouter i uruchom:",
              command:
                "export OPENAI_BASE_URL=https://openrouter.ai/api/v1\nexport OPENAI_API_KEY=twoj-klucz-openrouter\ncodex",
              sub: ["claude", "openrouter"],
            },
          ],
        },
      },
      links: [
        {
          label: "OpenAI Codex",
          url: "https://github.com/openai/codex",
        },
      ],
    },
  },
  {
    id: "ai-editors",
    title: "AI Edytory — Antigravity / Cursor / Windsurf",
    category: "ai-tools",
    paths: ["beginner", "advanced"],
    instructions: {
      description:
        "Edytory kodu z wbudowanym AI — wyglądają jak VS Code, ale mają zintegrowanych agentów AI. Wystarczy zainstalować jeden z nich.",
      platforms: {
        mac: {
          steps: [
            {
              text: "Google Antigravity — nowe IDE od Google z agentami Gemini. Wspiera też Claude i GPT. Darmowe w preview.",
            },
            {
              text: "Cursor — popularny edytor AI z wbudowanym czatem i autocomplete. Darmowy plan wystarczy na hackathon.",
            },
            {
              text: "Windsurf — edytor AI z agentem Cascade, który rozumie kontekst całego projektu.",
            },
          ],
        },
      },
      links: [
        { label: "Google Antigravity", url: "https://antigravity.google/" },
        { label: "Cursor", url: "https://cursor.sh" },
        { label: "Windsurf", url: "https://windsurf.com" },
      ],
      tips: [
        "Wszystkie trzy to forki VS Code — rozszerzenia i skróty klawiszowe działają tak samo.",
        "Nie musisz instalować wszystkich — wybierz jeden, który Ci pasuje.",
      ],
    },
  },
  {
    id: "claude-md",
    title: "CLAUDE.md — konfiguracja AI pod projekt",
    category: "ai-tools",
    paths: ["advanced"],
    instructions: {
      description:
        "CLAUDE.md to plik konfiguracyjny, który mówi Claude Code jak pracować z Twoim projektem — jakie konwencje stosować, jak uruchamiać testy, jaki stack używasz. Cursor i Windsurf mają odpowiedniki (.cursorrules, .windsurfrules).",
      platforms: {
        mac: {
          steps: [
            {
              text: "Stwórz plik CLAUDE.md w katalogu głównym projektu. Przykładowa zawartość:",
              command:
                '# Project\nNext.js 15 app with TypeScript, Tailwind CSS, Supabase.\n\n# Commands\n- npm run dev — start dev server\n- npm run build — build for production\n- npm run lint — run linter\n\n# Conventions\n- Use TypeScript strict mode\n- Components in src/components/\n- Use "use client" only when needed',
            },
            {
              text: "Dla Cursor stwórz .cursorrules, dla Windsurf .windsurfrules — analogicznie.",
            },
          ],
        },
      },
      tips: [
        "Im lepiej opiszesz swój projekt w CLAUDE.md, tym lepsze wyniki dostaniesz od AI.",
        "Możesz poprosić AI o wygenerowanie CLAUDE.md na podstawie istniejącego projektu.",
      ],
    },
  },

  // ─── WERYFIKACJA ─────────────────────────────────────────────────────
  {
    id: "test-drive",
    title: "Test drive — sprawdź że wszystko działa!",
    category: "weryfikacja",
    paths: ["beginner", "advanced"],
    instructions: {
      description:
        "Ostatni krok — upewnij się, że wszystko jest gotowe do hackatonu. Stwórz testowy folder i sprawdź, czy narzędzia AI działają.",
      platforms: {
        mac: {
          steps: [
            {
              text: "Stwórz folder testowy, zainicjuj Git i uruchom Claude Code (wykonaj wszystko w jednym oknie terminala):",
              command: "mkdir ~/hackathon-test && cd ~/hackathon-test\ngit init\nclaude",
            },
            {
              text: 'W Claude Code wpisz: "Stwórz plik hello.js, który wypisuje Hello Hackathon!". Po zakończeniu wyjdź z Claude Code i sprawdź efekt:',
              command: "node hello.js",
              output: "Hello Hackathon!",
            },
          ],
        },
        windows: {
          steps: [
            {
              text: "Stwórz folder testowy, zainicjuj Git i uruchom Claude Code (wykonaj wszystko w jednym oknie terminala):",
              command: "mkdir %USERPROFILE%\\hackathon-test && cd %USERPROFILE%\\hackathon-test\ngit init\nclaude",
            },
            {
              text: 'W Claude Code wpisz: "Stwórz plik hello.js, który wypisuje Hello Hackathon!". Po zakończeniu wyjdź z Claude Code i sprawdź efekt:',
              command: "node hello.js",
              output: "Hello Hackathon!",
            },
          ],
        },
        linux: {
          steps: [
            {
              text: "Stwórz folder testowy, zainicjuj Git i uruchom Claude Code (wykonaj wszystko w jednym oknie terminala):",
              command: "mkdir ~/hackathon-test && cd ~/hackathon-test\ngit init\nclaude",
            },
            {
              text: 'W Claude Code wpisz: "Stwórz plik hello.js, który wypisuje Hello Hackathon!". Po zakończeniu wyjdź z Claude Code i sprawdź efekt:',
              command: "node hello.js",
              output: "Hello Hackathon!",
            },
          ],
        },
      },
      tips: [
        "Jeśli coś nie działa — nie panikuj! Napisz na kanale hackathonowym, pomożemy.",
        "Po udanym teście możesz usunąć folder hackathon-test.",
      ],
    },
  },
];

// ─── Useful Prompts ───────────────────────────────────────────────────

export interface UsefulPrompt {
  number: number;
  title: string;
  description: string;
  prompt: string;
}

export const usefulPrompts: UsefulPrompt[] = [
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

// ─── Project Ideas ────────────────────────────────────────────────────

export interface ProjectIdea {
  name: string;
  description: string;
  tags: string[];
}

export const projectIdeas: ProjectIdea[] = [
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
