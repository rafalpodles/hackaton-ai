export type OS = "mac" | "windows" | "linux";
export type Path = "beginner" | "advanced";
export type Category = "fundamenty" | "ai-tools" | "bonus";

export interface CodeStep {
  text?: string;
  command?: string;
  output?: string;
}

export interface PlatformInstructions {
  steps: CodeStep[];
}

export interface GuideStep {
  id: string;
  number: number;
  title: string;
  category: Category;
  paths: Path[];
  required: boolean;
  instructions: {
    description: string;
    platforms: {
      mac?: PlatformInstructions;
      windows?: PlatformInstructions;
      linux?: PlatformInstructions;
    };
    tips?: string[];
    links?: { label: string; url: string }[];
  };
}

export const CATEGORY_LABELS: Record<Category, string> = {
  fundamenty: "FUNDAMENTY",
  "ai-tools": "AI TOOLS",
  bonus: "BONUS",
};

export const guideSteps: GuideStep[] = [
  {
    id: "terminal",
    number: 1,
    title: "Terminal — twój nowy przyjaciel",
    category: "fundamenty",
    paths: ["beginner"],
    required: true,
    instructions: {
      description:
        "Terminal to podstawowe narzędzie każdego programisty. Pozwala uruchamiać komendy, instalować narzędzia i zarządzać projektami.",
      platforms: {
        mac: {
          steps: [
            {
              text: 'Otw\u00F3rz Spotlight (Cmd + Spacja) i wpisz "Terminal", lub znajd\u017A go w Aplikacje > Narz\u0119dzia.',
            },
            {
              command: "echo \"Hello from Terminal!\"",
              output: "Hello from Terminal!",
            },
          ],
        },
        windows: {
          steps: [
            {
              text: 'Naci\u015Bnij Win + X i wybierz "Terminal" (Windows Terminal). Je\u015Bli go nie masz, pobierz z Microsoft Store.',
            },
            {
              command: "echo \"Hello from Terminal!\"",
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
              command: "echo \"Hello from Terminal!\"",
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
    id: "homebrew",
    number: 2,
    title: "Homebrew / Winget",
    category: "fundamenty",
    paths: ["beginner"],
    required: true,
    instructions: {
      description:
        "Menedżer pakietów pozwala łatwo instalować i aktualizować narzędzia programistyczne z poziomu terminala.",
      platforms: {
        mac: {
          steps: [
            {
              text: "Zainstaluj Homebrew — menedżer pakietów dla macOS:",
              command:
                '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
            },
            {
              text: "Sprawdź instalację:",
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
    id: "git",
    number: 3,
    title: "Git — kontrola wersji",
    category: "fundamenty",
    paths: ["beginner"],
    required: true,
    instructions: {
      description:
        "Git to system kontroli wersji, który pozwala śledzić zmiany w kodzie i współpracować z innymi.",
      platforms: {
        mac: {
          steps: [
            {
              text: "Zainstaluj Git przez Homebrew:",
              command: "brew install git",
            },
            {
              text: "Skonfiguruj swoje dane:",
              command:
                'git config --global user.name "Twoje Imie"\ngit config --global user.email "twoj@email.com"',
            },
            {
              text: "Sprawdź instalację:",
              command: "git --version",
              output: "git version 2.x.x",
            },
          ],
        },
        windows: {
          steps: [
            {
              text: "Zainstaluj Git przez Winget:",
              command: "winget install Git.Git",
            },
            {
              text: "Zamknij i otwórz terminal, potem skonfiguruj:",
              command:
                'git config --global user.name "Twoje Imie"\ngit config --global user.email "twoj@email.com"',
            },
            {
              text: "Sprawdź instalację:",
              command: "git --version",
              output: "git version 2.x.x",
            },
          ],
        },
        linux: {
          steps: [
            {
              text: "Zainstaluj Git:",
              command: "sudo apt install git -y",
            },
            {
              text: "Skonfiguruj swoje dane:",
              command:
                'git config --global user.name "Twoje Imie"\ngit config --global user.email "twoj@email.com"',
            },
            {
              text: "Sprawdź instalację:",
              command: "git --version",
              output: "git version 2.x.x",
            },
          ],
        },
      },
      tips: [
        "Użyj swojego prawdziwego imienia i emaila — będą widoczne w historii commitów.",
      ],
    },
  },
  {
    id: "nodejs",
    number: 4,
    title: "Node.js (nvm)",
    category: "fundamenty",
    paths: ["beginner"],
    required: true,
    instructions: {
      description:
        "Node.js to środowisko uruchomieniowe JavaScript. Instalujemy go przez nvm (Node Version Manager), który pozwala łatwo przełączać się między wersjami.",
      platforms: {
        mac: {
          steps: [
            {
              text: "Zainstaluj nvm:",
              command:
                'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash',
            },
            {
              text: "Zamknij i otwórz terminal, potem zainstaluj Node.js:",
              command: "nvm install --lts",
            },
            {
              text: "Sprawdź instalację:",
              command: "node --version && npm --version",
              output: "v22.x.x\n10.x.x",
            },
          ],
        },
        windows: {
          steps: [
            {
              text: "Zainstaluj nvm-windows:",
              command: "winget install CoreyButler.NVMforWindows",
            },
            {
              text: "Zamknij i otwórz terminal, potem zainstaluj Node.js:",
              command: "nvm install lts\nnvm use lts",
            },
            {
              text: "Sprawdź instalację:",
              command: "node --version && npm --version",
              output: "v22.x.x\n10.x.x",
            },
          ],
        },
        linux: {
          steps: [
            {
              text: "Zainstaluj nvm:",
              command:
                'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash',
            },
            {
              text: "Zamknij i otwórz terminal, potem zainstaluj Node.js:",
              command: "nvm install --lts",
            },
            {
              text: "Sprawdź instalację:",
              command: "node --version && npm --version",
              output: "v22.x.x\n10.x.x",
            },
          ],
        },
      },
      tips: [
        "nvm pozwala mieć wiele wersji Node.js naraz — przydatne gdy różne projekty wymagają różnych wersji.",
      ],
    },
  },
  {
    id: "python",
    number: 5,
    title: "Python (pyenv)",
    category: "fundamenty",
    paths: ["beginner"],
    required: true,
    instructions: {
      description:
        "Python to popularny język programowania, szczególnie w AI/ML. Używamy pyenv do zarządzania wersjami.",
      platforms: {
        mac: {
          steps: [
            {
              text: "Zainstaluj pyenv przez Homebrew:",
              command: "brew install pyenv",
            },
            {
              text: "Dodaj pyenv do shell (zsh):",
              command:
                'echo \'eval "$(pyenv init -)"\' >> ~/.zshrc\nsource ~/.zshrc',
            },
            {
              text: "Zainstaluj Python 3.12:",
              command: "pyenv install 3.12\npyenv global 3.12",
            },
            {
              text: "Sprawdź instalację:",
              command: "python --version",
              output: "Python 3.12.x",
            },
          ],
        },
        windows: {
          steps: [
            {
              text: "Zainstaluj Python przez winget:",
              command: "winget install Python.Python.3.12",
            },
            {
              text: "Sprawdź instalację:",
              command: "python --version",
              output: "Python 3.12.x",
            },
          ],
        },
        linux: {
          steps: [
            {
              text: "Zainstaluj zależności i pyenv:",
              command:
                "sudo apt install -y build-essential libssl-dev zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev libffi-dev\ncurl https://pyenv.run | bash",
            },
            {
              text: "Dodaj pyenv do shell:",
              command:
                'echo \'export PYENV_ROOT="$HOME/.pyenv"\' >> ~/.bashrc\necho \'export PATH="$PYENV_ROOT/bin:$PATH"\' >> ~/.bashrc\necho \'eval "$(pyenv init -)"\' >> ~/.bashrc\nsource ~/.bashrc',
            },
            {
              text: "Zainstaluj Python 3.12:",
              command: "pyenv install 3.12\npyenv global 3.12",
            },
            {
              text: "Sprawdź instalację:",
              command: "python --version",
              output: "Python 3.12.x",
            },
          ],
        },
      },
    },
  },
  {
    id: "docker",
    number: 6,
    title: "Docker Desktop",
    category: "fundamenty",
    paths: ["beginner"],
    required: false,
    instructions: {
      description:
        "Docker pozwala uruchamiać aplikacje w kontenerach — izolowanych środowiskach z wszystkimi zależnościami. Przydatny, ale nie wymagany na hackathon.",
      platforms: {
        mac: {
          steps: [
            {
              text: "Pobierz Docker Desktop ze strony:",
            },
            {
              text: "Lub zainstaluj przez Homebrew:",
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
              text: "Pobierz Docker Desktop ze strony:",
            },
            {
              text: "Lub zainstaluj przez winget:",
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
      links: [{ label: "Docker Desktop", url: "https://www.docker.com/products/docker-desktop/" }],
      tips: [
        "Docker Desktop wymaga ok. 4 GB RAM — jeśli masz mało pamięci, możesz pominąć ten krok.",
      ],
    },
  },
  {
    id: "vscode",
    number: 7,
    title: "VS Code + rozszerzenia",
    category: "fundamenty",
    paths: ["beginner"],
    required: true,
    instructions: {
      description:
        "Visual Studio Code to najpopularniejszy edytor kodu. Zainstaluj go razem z przydatnymi rozszerzeniami.",
      platforms: {
        mac: {
          steps: [
            {
              text: "Zainstaluj VS Code:",
              command: "brew install --cask visual-studio-code",
            },
            {
              text: "Zainstaluj rozszerzenia:",
              command:
                "code --install-extension MS-CEINTL.vscode-language-pack-pl\ncode --install-extension eamodio.gitlens\ncode --install-extension esbenp.prettier-vscode\ncode --install-extension dbaeumer.vscode-eslint\ncode --install-extension ms-python.python\ncode --install-extension ms-azuretools.vscode-docker",
            },
          ],
        },
        windows: {
          steps: [
            {
              text: "Zainstaluj VS Code:",
              command: "winget install Microsoft.VisualStudioCode",
            },
            {
              text: "Zamknij i otwórz terminal, potem zainstaluj rozszerzenia:",
              command:
                "code --install-extension MS-CEINTL.vscode-language-pack-pl\ncode --install-extension eamodio.gitlens\ncode --install-extension esbenp.prettier-vscode\ncode --install-extension dbaeumer.vscode-eslint\ncode --install-extension ms-python.python\ncode --install-extension ms-azuretools.vscode-docker",
            },
          ],
        },
        linux: {
          steps: [
            {
              text: "Zainstaluj VS Code:",
              command:
                "sudo apt install -y wget gpg\nwget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg\nsudo install -D -o root -g root -m 644 packages.microsoft.gpg /etc/apt/keyrings/packages.microsoft.gpg\necho \"deb [arch=amd64 signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main\" | sudo tee /etc/apt/sources.list.d/vscode.list\nsudo apt update && sudo apt install -y code",
            },
            {
              text: "Zainstaluj rozszerzenia:",
              command:
                "code --install-extension MS-CEINTL.vscode-language-pack-pl\ncode --install-extension eamodio.gitlens\ncode --install-extension esbenp.prettier-vscode\ncode --install-extension dbaeumer.vscode-eslint\ncode --install-extension ms-python.python\ncode --install-extension ms-azuretools.vscode-docker",
            },
          ],
        },
      },
      links: [{ label: "VS Code", url: "https://code.visualstudio.com/" }],
      tips: [
        "Polish Language Pack zmieni interfejs VS Code na polski — łatwiejszy start!",
      ],
    },
  },
  {
    id: "claude-code",
    number: 8,
    title: "Claude Code",
    category: "ai-tools",
    paths: ["beginner", "advanced"],
    required: true,
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
              text: "Uruchom i skonfiguruj klucz API:",
              command: "claude",
              output:
                "Welcome to Claude Code! Please enter your API key...",
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
              text: "Uruchom i skonfiguruj klucz API:",
              command: "claude",
              output:
                "Welcome to Claude Code! Please enter your API key...",
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
              text: "Uruchom i skonfiguruj klucz API:",
              command: "claude",
              output:
                "Welcome to Claude Code! Please enter your API key...",
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
        "Klucz API otrzymasz od organizatorów w dniu hackathonu. Nie musisz go mieć wcześniej!",
      ],
    },
  },
  {
    id: "gemini-cli",
    number: 9,
    title: "Gemini CLI",
    category: "ai-tools",
    paths: ["beginner", "advanced"],
    required: false,
    instructions: {
      description:
        "Gemini CLI to narzędzie od Google do interakcji z modelami Gemini z poziomu terminala.",
      platforms: {
        mac: {
          steps: [
            {
              text: "Zainstaluj Gemini CLI:",
              command: "npm install -g @google/gemini-cli",
            },
            {
              text: "Uruchom i autoryzuj się kontem Google:",
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
              text: "Uruchom i autoryzuj się kontem Google:",
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
              text: "Uruchom i autoryzuj się kontem Google:",
              command: "gemini",
            },
          ],
        },
      },
      links: [
        {
          label: "Gemini CLI na npm",
          url: "https://www.npmjs.com/package/@google/gemini-cli",
        },
      ],
    },
  },
  {
    id: "codex",
    number: 10,
    title: "Codex (OpenAI)",
    category: "ai-tools",
    paths: ["beginner", "advanced"],
    required: false,
    instructions: {
      description:
        "Codex CLI od OpenAI to narzędzie do generowania kodu z poziomu terminala, korzystające z modeli GPT.",
      platforms: {
        mac: {
          steps: [
            {
              text: "Zainstaluj Codex CLI:",
              command: "npm install -g @openai/codex",
            },
            {
              text: "Skonfiguruj klucz API OpenAI:",
              command: "export OPENAI_API_KEY=\"twoj-klucz-api\"",
            },
            {
              text: "Uruchom Codex:",
              command: "codex",
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
              text: "Skonfiguruj klucz API OpenAI:",
              command: "set OPENAI_API_KEY=twoj-klucz-api",
            },
            {
              text: "Uruchom Codex:",
              command: "codex",
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
              text: "Skonfiguruj klucz API OpenAI:",
              command: "export OPENAI_API_KEY=\"twoj-klucz-api\"",
            },
            {
              text: "Uruchom Codex:",
              command: "codex",
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
    id: "cursor",
    number: 11,
    title: "Cursor / Windsurf",
    category: "ai-tools",
    paths: ["beginner", "advanced"],
    required: false,
    instructions: {
      description:
        "Cursor i Windsurf to edytory kodu z wbudowanym AI. Są oparte na VS Code, więc będą wyglądać znajomo. Opcjonalnie — jeśli wolisz korzystać z AI wbudowanego w edytor.",
      platforms: {
        mac: {
          steps: [
            {
              text: "Pobierz Cursor ze strony cursor.sh lub zainstaluj:",
              command: "brew install --cask cursor",
            },
            {
              text: "Lub pobierz Windsurf ze strony windsurf.com:",
              command: "brew install --cask windsurf",
            },
          ],
        },
        windows: {
          steps: [
            {
              text: "Pobierz Cursor ze strony cursor.sh i zainstaluj standardowo.",
            },
            {
              text: "Lub pobierz Windsurf ze strony windsurf.com i zainstaluj.",
            },
          ],
        },
        linux: {
          steps: [
            {
              text: "Pobierz Cursor z cursor.sh — dostępny jako .AppImage.",
            },
            {
              text: "Lub pobierz Windsurf z windsurf.com.",
            },
          ],
        },
      },
      links: [
        { label: "Cursor", url: "https://cursor.sh" },
        { label: "Windsurf", url: "https://windsurf.com" },
      ],
      tips: [
        "Oba edytory mają darmowe plany, które wystarczą na hackathon.",
      ],
    },
  },
  {
    id: "project-ideas",
    number: 12,
    title: "Pomysły na projekty",
    category: "bonus",
    paths: ["beginner", "advanced"],
    required: false,
    instructions: {
      description:
        "Nie wiesz co zbudować? Oto kilka inspiracji na projekty hackathonowe z użyciem AI:",
      platforms: {
        mac: {
          steps: [
            {
              text: "🤖 Automatyzacja raportów — narzędzie, które zbiera dane z API i generuje raporty w PDF/Markdown za pomocą AI.",
            },
            {
              text: "💬 Chatbot do FAQ — bot odpowiadający na pytania na podstawie dokumentacji firmy (RAG pattern).",
            },
            {
              text: "📊 Dashboard analityczny — interaktywny dashboard z wizualizacjami, wygenerowany przez AI na podstawie opisu.",
            },
            {
              text: "🔍 Narzędzie do code review — aplikacja, która analizuje pull requesty i sugeruje poprawki.",
            },
            {
              text: "🎨 Generator UI — narzędzie, które zamienia opis tekstowy w gotowy komponent React/Vue.",
            },
          ],
        },
      },
      tips: [
        "Wybierz coś, co Cię ekscytuje — z AI możesz zbudować MVP w kilka godzin!",
        "Nie musisz wymyślać czegoś oryginalnego. Liczy się realizacja i wykorzystanie AI tools.",
      ],
    },
  },
  {
    id: "useful-prompts",
    number: 13,
    title: "Przydatne prompty",
    category: "bonus",
    paths: ["beginner", "advanced"],
    required: false,
    instructions: {
      description:
        "Dobre prompty to klucz do efektywnej pracy z AI. Oto sprawdzone szablony do vibecoding:",
      platforms: {
        mac: {
          steps: [
            {
              text: "Startowy prompt do nowego projektu:",
              command:
                "Stwórz projekt [typ aplikacji] w [framework]. Potrzebuję:\n- [funkcja 1]\n- [funkcja 2]\n- [funkcja 3]\nUżyj TypeScript, Tailwind CSS. Zacznij od struktury plików.",
            },
            {
              text: "Prompt do debugowania:",
              command:
                "Mam błąd: [treść błędu]. Kod który go powoduje to [wklej kod].\nWyjaśnij co jest nie tak i zaproponuj fix.",
            },
            {
              text: "Prompt do code review:",
              command:
                "Przejrzyj ten kod pod kątem:\n- Wydajności\n- Bezpieczeństwa\n- Czytelności\n- Best practices\nZaproponuj konkretne poprawki.",
            },
            {
              text: "Prompt do nauki:",
              command:
                "Wyjaśnij [koncept] jak dla programisty [junior/mid/senior].\nPokaż przykład w [język]. Podaj analogię z życia codziennego.",
            },
          ],
        },
      },
      tips: [
        "Im bardziej precyzyjny prompt, tym lepszy wynik. Dodawaj kontekst!",
        "Nie bój się iterować — jeśli wynik nie jest idealny, doprecyzuj prompt.",
        "Używaj Claude Code w katalogu projektu — wtedy AI widzi kontekst Twojego kodu.",
      ],
    },
  },
];
