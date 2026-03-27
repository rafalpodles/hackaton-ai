# Design System Document: The Neon-Glass Directive

## 1. Overview & Creative North Star
**Creative North Star: "The Kinetic Observatory"**

This design system is engineered to break the stagnation of corporate "SaaS-blue" interfaces. It leans into a high-octane, gaming-inspired aesthetic that treats the screen as a luminous, multi-layered cockpit. We achieve a premium, editorial feel by rejecting the standard grid in favor of **Intentional Asymmetry** and **Tonal Depth**.

The goal is not to present information flatly, but to immerse the user in a "techy" environment where information is discovered through light and transparency. We prioritize breathability (`Spacing 16`) alongside high-intensity focal points (`Secondary` accent) to create a rhythmic user experience that feels both experimental and authoritative.

---

## 2. Colors: The Chromatic Engine
Our palette is rooted in deep space visuals, utilizing a high-contrast relationship between a foundational dark violet and a kinetic red-orange.

*   **Primary (`#a4a5ff` / `#4646CC`):** The core "energy" of the system. Use `primary_dim` for large interactive surfaces and `primary` for high-visibility highlights.
*   **Secondary (`#ff7255` / `#FF4D29`):** The "Ignition" color. Reserved strictly for conversion points, critical alerts, or "Active" states.
*   **Neutral/Surface:** A range from `surface_container_lowest` (#000000) to `surface_bright` (#2c2b33).

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts. 
*   *Correct:* A `surface_container_low` card sitting on a `surface` background.
*   *Incorrect:* A grey border separating two sections.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
1.  **Base:** `surface` (#0e0e13).
2.  **Sectioning:** `surface_container_low` (#131318) for large groupings.
3.  **Active Elements:** `surface_container_high` (#1f1f26) for cards or inputs.

### The "Glass & Gradient" Rule
To achieve the "Gaming/Creative" soul, use **Glassmorphism** for floating elements (Modals, Navigation bars). Use `surface_variant` at 40% opacity with a `20px` backdrop-blur. 
*   **Signature Texture:** Main CTAs must use a linear gradient: `primary_dim` to `secondary_dim` at a 135-degree angle to provide a sense of motion.

---

## 3. Typography: The Editorial Edge
We move away from standard sans-serifs to create a "Tech-Editorial" personality.

*   **Display & Headlines (Space Grotesk):** This is our "Tech" voice. It’s wide, geometric, and authoritative. Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) for hero moments.
*   **Body & Titles (Manrope):** This is our "Human" voice. It provides high legibility against dark backgrounds. Use `body-lg` (1rem) for all long-form descriptions to ensure the interface doesn't feel cramped.
*   **Labels (Space Grotesk):** Small caps or high-tracking labels (`label-sm`) should be used for metadata to reinforce the "instrument panel" aesthetic.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are too "soft" for this system. We use **Light Radiation** and **Layering**.

### The Layering Principle
Depth is achieved by "stacking" surface tiers. Place a `surface_container_highest` object on a `surface_container_low` background to create a "lift" effect without a single pixel of shadow.

### Ambient Glows
When a "floating" effect is required, use a shadow with a blur value of `40px`, but instead of black, use a 10% opacity version of the `primary` color. This mimics the glow of a neon light against a dark wall.

### The "Ghost Border" Fallback
If accessibility requires a border, it must be a **Ghost Border**: 
*   Token: `outline_variant` at 15% opacity.
*   Effect: It should look like a faint light catch on the edge of a glass pane, not a structural line.

---

## 5. Components: Precision Implements

### Gradient Buttons
*   **Primary:** Gradient from `primary` to `tertiary`. Radius: `md` (0.375rem). Text: `label-md` bold.
*   **Secondary:** Ghost style. Transparent background with a `primary` Ghost Border and `primary` text.
*   **States:** On hover, apply a `primary` outer glow (8px blur).

### Card Layouts with Glow
Cards should use `surface_container_low`. On hover, the border (Ghost Border) should transition to 50% opacity `primary`, and a subtle `secondary` glow should appear at the top-right corner of the card to indicate interactivity.

### The Tech-Stepper (Form Navigation)
Instead of standard circles, use thin horizontal bars. 
*   **Active:** `secondary` glow.
*   **Inactive:** `surface_container_highest`.
*   **Spacing:** Use `1.5` (0.375rem) between bars for a "digital readout" look.

### Input Fields
*   **Background:** `surface_container_lowest` (pure black).
*   **Focus State:** The bottom edge animates a 2px line from `primary` to `secondary`.
*   **No Dividers:** In lists or menus, use `Spacing 4` vertical gaps instead of lines.

---

## 6. Do's and Don'ts

### Do:
*   **Use Asymmetry:** Offset your headline from your body text by one grid column to create visual tension.
*   **Embrace Large Type:** Use `display-lg` for single-word impacts.
*   **Layer with Blur:** Use backdrop filters to keep the background colors bleeding through your cards.

### Don't:
*   **No Pure White:** Never use #FFFFFF for text. Use `on_surface` (#f8f5fd) to prevent "retina burn" in dark mode.
*   **No Solid Borders:** Never use an opaque 1px line to separate "User Profile" from "Settings." Use a shift from `surface` to `surface_container_low`.
*   **No Standard Shadows:** Avoid "Drop Shadow: 0 4px 4px Black." It kills the glass effect. Use tinted glows or tonal shifts instead.