# Setup Guide Page — Visual Design Specification

Route: `/guide`
Layout: Inside `(main)` layout group (sidebar + `ml-60 p-8`)

---

## 1. Component Tree

```
GuidePage           (server component — route /guide)
  GuideView         (client component — all interactive state)
    HeroHeader
      ProgressBar
      PathBadge
    PathSelector        (shown only when no path selected)
      PathCard x 2
    GuideSection x N    (category dividers: FUNDAMENTY, AI TOOLS, BONUS)
      GuideStep x N     (accordion items)
        StepHeader      (number + title + checkbox)
        StepBody        (expandable content)
          OSTabs        (Mac / Windows / Linux)
          CodeBlock     (terminal-styled)
    CompletionBanner    (shown when all required steps done)
```

---

## 2. State Management

```
interface GuideState {
  selectedPath: "beginner" | "advanced" | null;
  completedSteps: Set<string>;        // step IDs persisted in localStorage
  expandedStep: string | null;        // accordion — only one open
  activeOSTab: "mac" | "windows" | "linux";  // auto-detected, then manual override
}
```

localStorage key: `guide-state`
OS auto-detection: `navigator.userAgent` → set default tab (mac/windows/linux)

---

## 3. Page Layout

Container: `mx-auto max-w-4xl py-4`
Vertical stack: `flex flex-col gap-10`

---

## 4. Hero Header

### Outer wrapper
```
relative overflow-hidden rounded-2xl
bg-surface-low/80 backdrop-blur-[20px]
border border-outline
p-8 pb-6
```

### Ambient glow (decorative pseudo-element)
Absolutely positioned `div` behind content:
```
absolute -top-24 -right-24 w-64 h-64
bg-primary/20 rounded-full blur-[100px]
pointer-events-none
```
Second glow (secondary color):
```
absolute -bottom-16 -left-16 w-48 h-48
bg-secondary/15 rounded-full blur-[80px]
pointer-events-none
```

### Title
```
font-space-grotesk text-4xl md:text-5xl font-bold tracking-tight
```
Word "PRZYGOTUJ" — gradient text:
```
bg-gradient-to-r from-primary-dim to-secondary bg-clip-text text-transparent
```
Word "SIE" — plain:
```
text-on-surface
```

Full title: **"PRZYGOTUJ SIE"** (or "SETUP GUIDE" as alternative)

### Subtitle
```
text-on-surface-muted text-base mt-2 max-w-xl
font-manrope (default body)
```
Text: "Przejdz przez wszystkie kroki przed hackathonowym dniem. Nie chcesz tracic czasu na instalacje!"

### Progress section (below subtitle, mt-6)

#### Progress bar container
```
flex items-center gap-4
```

#### Progress bar track
```
flex-1 h-2 rounded-full bg-surface-high overflow-hidden
```

#### Progress bar fill
```
h-full rounded-full transition-all duration-500 ease-out
bg-gradient-to-r from-primary to-secondary
```
Width: calculated as percentage `style={{ width: '${percent}%' }}`

When 100%: add glow
```
shadow-[0_0_12px_rgba(70,70,204,0.5)]
```

#### Progress label
```
font-space-grotesk text-sm font-bold text-on-surface tabular-nums
```
Format: `"7 / 13"` or `"54%"`

### Path badge (shown after path selection, right side of progress row)

```
inline-flex items-center gap-1.5
rounded-full px-3 py-1
bg-primary/15 border border-primary/30
font-space-grotesk text-xs font-semibold uppercase tracking-wider text-primary-dim
```
Icon: small rocket (beginner) or lightning (advanced) inline SVG, `w-3.5 h-3.5`
Text: "POCZATKUJACY" or "ZAAWANSOWANY"

---

## 5. Path Selector

Shown only when `selectedPath === null`.
Fade-in animation on mount.

### Section title
```
font-space-grotesk text-lg font-semibold text-on-surface mb-4
```
Text: "Wybierz swoja sciezke"

### Cards container
```
grid grid-cols-1 sm:grid-cols-2 gap-4
```

### PathCard

#### Base state
```
group relative cursor-pointer
rounded-xl p-6
bg-surface-high/40 backdrop-blur-[20px]
border border-outline
transition-all duration-200
hover:border-primary/40
hover:shadow-[0_0_30px_rgba(70,70,204,0.12)]
```

#### Beginner card accent
Top edge: `before:` pseudo with `bg-gradient-to-r from-primary to-primary-dim h-[2px]` at top

#### Advanced card accent
Top edge: `before:` pseudo with `bg-gradient-to-r from-secondary to-secondary-dim h-[2px]` at top

#### Icon container
```
w-12 h-12 rounded-lg mb-4
flex items-center justify-center
```
Beginner: `bg-primary/15` — rocket icon in `text-primary-dim w-6 h-6`
Advanced: `bg-secondary/15` — lightning icon in `text-secondary-dim w-6 h-6`

#### Title
```
font-space-grotesk text-xl font-bold text-on-surface mb-2
```
"POCZATKUJACY" / "ZAAWANSOWANY"

#### Description
```
text-sm text-on-surface-muted leading-relaxed
```
Beginner: "Nigdy nie kodowalem — pokaz mi wszystko od zera"
Advanced: "Mam doswiadczenie z programowaniem — potrzebuje tylko AI tools"

#### Hover state
Border brightens, subtle upward translate:
```
hover:-translate-y-0.5
```

#### Selected state (briefly, before hiding)
```
border-primary ring-2 ring-primary/20
scale-[0.98]
```
Then the entire PathSelector fades out (200ms) and steps appear.

---

## 6. Section Divider (GuideSection)

Visual break between step categories.

### Container
```
flex items-center gap-4 mt-8 mb-4
```

### Line (left)
```
flex-1 h-px bg-outline
```

### Label
```
font-space-grotesk text-xs font-bold uppercase tracking-[0.2em]
text-on-surface-muted
```
Category names: "FUNDAMENTY", "AI TOOLS", "BONUS"

Beginner-only sections: small `(beginner)` badge after label
```
ml-2 text-[10px] rounded-full px-2 py-0.5
bg-primary/10 text-primary-dim border border-primary/20
```

### Line (right)
```
flex-1 h-px bg-outline
```

---

## 7. GuideStep (Accordion Card)

This is the core component. Each step is a collapsible card.

### Outer container
```
rounded-xl overflow-hidden
border border-outline
transition-all duration-200
```

**State variations:**
- Default: `bg-surface-low/60`
- Expanded: `bg-surface-low/80 border-primary/20`
- Completed: `bg-surface-low/60 border-primary/25` + left accent

### Completed left accent
```
border-l-2 border-primary-dim
```

---

### 7a. StepHeader (always visible, clickable)

```
flex items-center gap-4 px-5 py-4 cursor-pointer
transition-colors duration-150
hover:bg-surface-high/30
```

#### Step number
```
flex-shrink-0
w-8 h-8 rounded-lg
flex items-center justify-center
font-space-grotesk text-xs font-bold
```

Default state:
```
bg-surface-high text-on-surface-muted
```

Active/expanded state:
```
bg-primary/20 text-primary-dim
```

Completed state:
```
bg-primary/20 text-primary-dim
```

Format: zero-padded like terminal → `01`, `02`, ... `13`

#### Title
```
flex-1 font-space-grotesk text-sm font-semibold text-on-surface
```

Completed:
```
text-primary-dim
```

#### Custom checkbox
```
w-6 h-6 rounded-md
flex items-center justify-center
transition-all duration-200
cursor-pointer
```

**Unchecked:**
```
border-2 border-outline
hover:border-primary-dim/50
```

**Checked:**
```
bg-gradient-to-br from-primary to-primary-dim
border-0
shadow-[0_0_8px_rgba(164,165,255,0.3)]
```
Inner checkmark: white SVG `w-3.5 h-3.5` with stroke animation (draw-in, 300ms)

**Check animation sequence:**
1. Border collapses inward (scale 0.9 briefly)
2. Fill floods in with gradient
3. Checkmark draws in (stroke-dashoffset animation)
4. Subtle glow pulse (box-shadow expands then contracts)

#### Expand/collapse chevron
```
w-5 h-5 text-on-surface-muted
transition-transform duration-200
```
Expanded: `rotate-180`

---

### 7b. StepBody (expandable content)

Wrapped in animated container:
```
overflow-hidden
transition-[max-height,opacity] duration-300 ease-in-out
```
Collapsed: `max-height: 0; opacity: 0`
Expanded: `max-height: 800px; opacity: 1` (or use grid-rows trick)

Alternative (recommended): use CSS `grid` trick:
```
display: grid
grid-template-rows: 0fr  →  1fr
transition: grid-template-rows 300ms ease
```
Inner div: `overflow: hidden`

#### Content padding
```
px-5 pb-5 pt-0
```

#### Left offset to align with title (past the step number)
```
pl-[52px]
```
(8 gap + 32px number + 12px = 52px offset from left edge)

Actually simpler: wrap body content in `ml-12` to align with title text.

---

### 7c. OS Tabs

```
flex gap-1 mb-4 p-1 rounded-lg bg-surface-high/60 w-fit
```

#### Tab button
```
px-3 py-1.5 rounded-md
font-space-grotesk text-xs font-semibold uppercase tracking-wider
transition-all duration-150
```

**Inactive:**
```
text-on-surface-muted
hover:text-on-surface hover:bg-surface-high
```

**Active:**
```
bg-surface-bright text-on-surface
shadow-sm
```

Tab labels with system icons (small inline SVGs):
- `` macOS (Apple logo or terminal icon)
- `` Windows
- `` Linux (penguin or terminal icon)

---

### 7d. Code Block (Terminal Aesthetic)

```
rounded-lg overflow-hidden
bg-[#0a0a0f] border border-outline/50
font-mono text-sm
```

#### Terminal header bar
```
flex items-center justify-between
px-4 py-2
bg-[#0f0f15] border-b border-outline/30
```

Left side — fake traffic lights:
```
flex gap-1.5
```
Three dots: `w-2.5 h-2.5 rounded-full`
- `bg-[#ff5f57]/60`
- `bg-[#febc2e]/60`
- `bg-[#28c840]/60`

Right side — copy button:
```
flex items-center gap-1
text-[10px] font-space-grotesk uppercase tracking-wider
text-on-surface-muted/60
hover:text-on-surface-muted
transition-colors duration-150
cursor-pointer
```
Icon: clipboard SVG `w-3.5 h-3.5`
Text: "COPY"

After clicking: icon changes to checkmark, text changes to "COPIED", color `text-primary-dim`, reverts after 2s.

#### Code content
```
px-4 py-3
text-[13px] leading-relaxed
overflow-x-auto
```

#### Prompt styling
Lines starting with `$` (commands):
- `$` character: `text-primary-dim font-bold`
- Command text: `text-on-surface`

Comment lines (`#`):
- `text-on-surface-muted/60 italic`

Output lines (no prefix):
- `text-on-surface-muted`

Highlighted/important parts:
- `text-secondary-dim`

Example rendering:
```
# Install Homebrew
$ /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/...)"

# Verify installation
$ brew --version
Homebrew 4.3.x
```

#### Multi-command blocks
Separate logical groups with a blank line in the code block.

---

### 7e. Instructional Text (within StepBody)

Regular paragraphs:
```
text-sm text-on-surface-muted leading-relaxed mb-3
```

Inline code:
```
px-1.5 py-0.5 rounded bg-surface-high
font-mono text-xs text-primary-dim
```

Links:
```
text-primary-dim underline decoration-primary-dim/30
hover:decoration-primary-dim transition-colors
```

Warning/tip callouts:
```
flex gap-3 p-3 rounded-lg
bg-secondary/8 border border-secondary/15
text-sm text-on-surface-muted
```
Icon: warning triangle in `text-secondary-dim w-5 h-5 flex-shrink-0`

Info callouts:
```
flex gap-3 p-3 rounded-lg
bg-primary/8 border border-primary/15
text-sm text-on-surface-muted
```
Icon: info circle in `text-primary-dim w-5 h-5 flex-shrink-0`

---

## 8. Completion Banner

Shown when all required steps for the selected path are completed.
Appears with a fade-in + slight scale-up animation.

### Container
```
relative overflow-hidden rounded-2xl
p-8 text-center
bg-surface-low/80 backdrop-blur-[20px]
border border-primary/30
```

### Ambient glow (stronger than hero)
```
absolute inset-0
bg-gradient-to-br from-primary/10 via-transparent to-secondary/10
pointer-events-none
```

Additional glow spots:
```
absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
w-96 h-32 bg-primary/15 rounded-full blur-[80px]
pointer-events-none
```

### "Confetti" metaphor
Not actual confetti animation — instead, scattered small gradient dots/stars:
```
absolute [various positions]
w-1.5 h-1.5 rounded-full
bg-gradient-to-r from-primary-dim to-secondary
opacity-40
animate-pulse
```
Place 6-8 of these at various positions around the banner.

### Title
```
font-space-grotesk text-3xl font-bold
bg-gradient-to-r from-primary-dim to-secondary bg-clip-text text-transparent
```
Text: "JESTES GOTOWY!"

### Subtitle
```
text-on-surface-muted text-base mt-2 mb-6
```
Text: "Wszystkie kroki ukonczone. Do zobaczenia na hackatonie!"

### CTA Button
Use existing `GradientButton` component:
```
<GradientButton>ZGLOS PROJEKT</GradientButton>
```
Links to `/my-project`.

---

## 9. Animations & Transitions

### Step expand/collapse
- Duration: 300ms
- Easing: `ease-in-out`
- Grid-rows technique for smooth height animation

### Checkbox check
- Duration: 300ms total
- Sequence: scale(0.9) 100ms -> fill 100ms -> checkmark draw 200ms
- Glow pulse: `box-shadow` keyframe, 400ms

### Progress bar
- Width transition: 500ms `ease-out`
- On 100%: glow keyframe animation (pulse 2s infinite)

### Path selector disappear
- Opacity 0 over 200ms, then `display: none` or conditional render

### Step appear (after path selection)
- Staggered fade-in: each step fades in 50ms after the previous
- `opacity: 0 -> 1`, `translateY: 8px -> 0`
- Total stagger: steps * 50ms

### Completion banner appear
- `opacity: 0 -> 1` over 500ms
- `scale: 0.96 -> 1`
- Glow dots start pulsing after banner is visible

---

## 10. Responsive Behavior

### Desktop (default, 1024px+)
- Full layout as described
- `max-w-4xl` content width
- Side-by-side path cards

### Tablet (768px - 1023px)
- Sidebar collapses (handled by main layout)
- Content fills more width
- Path cards still side-by-side

### Mobile (< 768px)
- Path cards stack: `grid-cols-1`
- Hero title: `text-3xl` instead of `text-4xl`
- Step content full-width
- Code blocks: smaller text `text-[12px]`, horizontal scroll
- OS tabs: slightly smaller padding

---

## 11. Step Content Data Structure

```typescript
interface Step {
  id: string;                          // "terminal", "homebrew", etc.
  number: number;                      // 1-13
  title: string;                       // Display title
  category: "fundamenty" | "ai-tools" | "bonus";
  paths: ("beginner" | "advanced")[];  // Which paths include this step
  required: boolean;                   // Counts toward completion?
  instructions: {
    description: string;               // Intro text (markdown-ish)
    platforms: {
      mac?: PlatformInstructions;
      windows?: PlatformInstructions;
      linux?: PlatformInstructions;
    };
    tips?: string[];                   // Callout tips
    links?: { label: string; url: string }[];
  };
}

interface PlatformInstructions {
  steps: {
    text?: string;          // Explanatory text before command
    command?: string;        // Terminal command(s)
    output?: string;         // Expected output (shown dimmed)
  }[];
}
```

### Step definitions

| # | ID | Title | Category | Paths | Required |
|---|-----|-------|----------|-------|----------|
| 01 | terminal | Terminal — twoj nowy przyjaciel | fundamenty | beginner | yes |
| 02 | homebrew | Homebrew / Winget | fundamenty | beginner | yes |
| 03 | git | Git — kontrola wersji | fundamenty | beginner | yes |
| 04 | nodejs | Node.js (nvm) | fundamenty | beginner | yes |
| 05 | python | Python (pyenv) | fundamenty | beginner | yes |
| 06 | docker | Docker Desktop | fundamenty | beginner | no |
| 07 | vscode | VS Code + rozszerzenia | fundamenty | beginner | yes |
| 08 | claude-code | Claude Code | ai-tools | beginner, advanced | yes |
| 09 | gemini-cli | Gemini CLI | ai-tools | beginner, advanced | no |
| 10 | codex | Codex (OpenAI) | ai-tools | beginner, advanced | no |
| 11 | cursor | Cursor / Windsurf | ai-tools | beginner, advanced | no |
| 12 | project-ideas | Pomysly na projekty | bonus | beginner, advanced | no |
| 13 | useful-prompts | Przydatne prompty | bonus | beginner, advanced | no |

Progress calculation: count completed required steps / total required steps for selected path.

---

## 12. Color & Spacing Quick Reference

Used throughout this spec — mapping to the project's `globals.css` theme tokens:

| Token | Value | Tailwind class |
|-------|-------|---------------|
| Surface | #0e0e13 | `bg-surface` |
| Surface Low | #131318 | `bg-surface-low` |
| Surface High | #1f1f26 | `bg-surface-high` |
| Surface Bright | #2c2b33 | `bg-surface-bright` |
| Primary | #4646CC | `bg-primary`, `text-primary` |
| Primary Dim | #a4a5ff | `text-primary-dim` |
| Secondary | #FF4D29 | `bg-secondary` |
| Secondary Dim | #ff7255 | `text-secondary-dim` |
| On Surface | #f8f5fd | `text-on-surface` |
| On Surface Muted | #9896a3 | `text-on-surface-muted` |
| Outline | rgba(166,165,255,0.15) | `border-outline` |

Fonts:
- Headlines/labels/UI: `font-space-grotesk`
- Body text: `font-manrope` (default, no class needed)

---

## 13. Accessibility

### Keyboard Navigation
- `Tab` moves between step headers and checkboxes
- `Enter` / `Space` toggles step expansion
- `Enter` / `Space` on checkbox toggles completion
- Expanded step content is focusable
- OS tabs navigable with arrow keys (roving tabindex)

### ARIA
- Step headers: `role="button"`, `aria-expanded="true|false"`, `aria-controls="step-body-{id}"`
- Step bodies: `id="step-body-{id}"`, `role="region"`, `aria-labelledby="step-header-{id}"`
- Checkboxes: `role="checkbox"`, `aria-checked="true|false"`, `aria-label="Oznacz {title} jako ukonczone"`
- Progress bar: `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`
- OS tabs: `role="tablist"` / `role="tab"` / `role="tabpanel"`

### Focus Indicators
All interactive elements: `focus-visible:outline-2 focus-visible:outline-primary-dim focus-visible:outline-offset-2`

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 14. Sidebar Integration

Add "Guide" to the sidebar navigation in `sidebar.tsx`:

```
navItems = [
  { label: "Live", href: "/feed" },
  { label: "Projekty", href: "/" },
  { label: "Guide", href: "/guide" },   // <-- NEW
  { label: "Zglos", href: "/my-project" },
];
```

Position: between "Projekty" and "Zglos" — participants should see it early.

---

## 15. File Structure

```
src/app/(main)/guide/
  page.tsx                    (server component, minimal — renders GuideView)

src/components/guide/
  guide-view.tsx              (client — state management, localStorage)
  hero-header.tsx             (title, progress bar, path badge)
  path-selector.tsx           (two cards for path choice)
  progress-bar.tsx            (reusable progress bar)
  guide-section.tsx           (category divider)
  guide-step.tsx              (accordion card)
  step-checkbox.tsx           (custom animated checkbox)
  os-tabs.tsx                 (Mac/Win/Linux tab switcher)
  code-block.tsx              (terminal-styled code with copy)
  callout.tsx                 (tip/warning/info boxes)
  completion-banner.tsx       (success state)

src/lib/guide-data.ts         (all step definitions, typed)
```

---

## 16. Visual Mockup — ASCII Wireframe

```
+----------------------------------------------------------+
|                                                          |
|  .*. ambient glow                                        |
|                                                          |
|   PRZYGOTUJ  SIE                                         |
|   (gradient)  (white)                                    |
|                                                          |
|   Przejdz przez kroki przed hackathonowym dniem...       |
|                                                          |
|   [========--------] 7/13    [@ POCZATKUJACY]            |
|   (gradient bar)             (badge)                     |
|                                                          |
+----------------------------------------------------------+

- - - - - - - FUNDAMENTY - - - - - - - -

+----------------------------------------------------------+
| [01]  Terminal — twoj nowy przyjaciel       [ ]    v     |
+----------------------------------------------------------+
| [02]  Homebrew / Winget                     [x]    v     |
|  +------------------------------------------------------+|
|  |  [macOS] [Windows] [Linux]                           ||
|  |                                                      ||
|  |  +--------------------------------------------------+||
|  |  | o o o                                    [COPY]  |||
|  |  |                                                  |||
|  |  |  # Install Homebrew                              |||
|  |  |  $ /bin/bash -c "$(curl -fsSL ...)"              |||
|  |  |                                                  |||
|  |  |  # Verify                                        |||
|  |  |  $ brew --version                                |||
|  |  |  Homebrew 4.3.x                                  |||
|  |  +--------------------------------------------------+||
|  |                                                      ||
|  |  i  Po instalacji zamknij i otworz terminal ponownie ||
|  +------------------------------------------------------+|
+----------------------------------------------------------+
| [03]  Git — kontrola wersji                 [ ]    >     |
+----------------------------------------------------------+

- - - - - - - - AI TOOLS - - - - - - - -

+----------------------------------------------------------+
| [08]  Claude Code                           [ ]    >     |
+----------------------------------------------------------+
| [09]  Gemini CLI                            [ ]    >     |
+----------------------------------------------------------+

            ...when all done...

+----------------------------------------------------------+
|             .  *  .    *   .                              |
|                                                          |
|             JESTES GOTOWY!                                |
|           (gradient text)                                 |
|                                                          |
|    Wszystkie kroki ukonczone. Do zobaczenia!             |
|                                                          |
|          [ ZGLOS PROJEKT ]                               |
|          (GradientButton)                                |
|                                                          |
+----------------------------------------------------------+
```

---

## 17. Interaction Flow Summary

1. User navigates to `/guide`
2. Hero header renders with 0% progress
3. PathSelector is shown — user picks "POCZATKUJACY" or "ZAAWANSOWANY"
4. PathSelector fades out, steps fade in with stagger
5. Steps matching the selected path are shown, others hidden
6. User clicks a step header — it expands (previous one collapses)
7. User reads instructions, switches OS tabs, copies commands
8. User clicks checkbox — satisfying animation, progress updates
9. When all required steps complete: CompletionBanner appears below all steps
10. User clicks "ZGLOS PROJEKT" — navigates to `/my-project`
11. State persists in localStorage — returning user sees their progress
