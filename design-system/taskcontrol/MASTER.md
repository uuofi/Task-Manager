# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** TaskControl
**Generated:** 2026-06-21 13:28:29
**Category:** Productivity Tool

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#0D9488` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#14B8A6` | `--color-secondary` |
| Accent/CTA | `#EA580C` | `--color-accent` |
| Background | `#F0FDFA` | `--color-background` |
| Foreground | `#134E4A` | `--color-foreground` |
| Muted | `#E8F1F4` | `--color-muted` |
| Border | `#99F6E4` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| Ring | `#0D9488` | `--color-ring` |

**Color Notes:** Teal focus + action orange [Accent adjusted from #F97316 for WCAG 3:1]

### Typography

- **Heading Font:** Plus Jakarta Sans
- **Body Font:** Plus Jakarta Sans
- **Mood:** friendly, modern, saas, clean, approachable, professional
- **Google Fonts:** [Plus Jakarta Sans + Plus Jakarta Sans](https://fonts.google.com/share?selection.family=Plus+Jakarta+Sans:wght@300;400;500;600;700)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #EA580C;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */


.btn-secondary {
  background: transparent;
  color: #0D9488;
  border: 2px solid #0D9488;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards
```css
.card {
  background: #F0FDFA;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #0D9488;
  outline: none;
  box-shadow: 0 0 0 3px #0D948820;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Flat Design

**Keywords:** 2D, minimalist, bold colors, no shadows, clean lines, simple shapes, typography-focused, modern, icon-heavy

**Best For:** Web apps, mobile apps, cross-platform, startup MVPs, user-friendly, SaaS, dashboards, corporate

**Key Effects:** No gradients/shadows, simple hover (color/opacity shift), fast loading, clean transitions (150-200ms ease), minimal icons

### Page Pattern

**Pattern Name:** Minimal Single Column

- **Conversion Strategy:** Single CTA focus. Large typography. Lots of whitespace. No nav clutter. Mobile-first.
- **CTA Placement:** Center, large CTA button
- **Section Order:** 1. Hero headline, 2. Short description, 3. Benefit bullets (3 max), 4. CTA, 5. Footer

---

## Anti-Patterns (Do NOT Use)

- ❌ Complex onboarding
- ❌ Slow performance

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile

---

## Implementation Notes (how this is wired in the codebase)

The design system is implemented as **CSS custom properties** in `client/src/index.css`
(Tailwind v4 `@theme inline`) and consumed through **shadcn/ui** components. Use the
semantic Tailwind utilities (`bg-primary`, `text-muted-foreground`, `border`, `bg-cta`),
**never raw hex** in components.

### Token mapping

| Design role | Token / utility | Value (light) |
|-------------|-----------------|---------------|
| Brand action (default buttons, links, active nav, focus ring) | `--primary` / `bg-primary` | teal `#0D9488` |
| High-emphasis CTA (ONE per screen) | `--cta` / `<Button variant="cta">` | orange `#EA580C` |
| Destructive | `--destructive` / `variant="destructive"` | `#DC2626` |
| Surfaces | `--card`, `--background` | white |
| Secondary/muted surfaces | `--secondary`, `--muted` | neutral zinc |

### Deliberate deviations from the raw generator output (rationale)

1. **Teal is the default action color; orange is reserved as the CTA accent.** The
   generator labeled orange as primary-button bg. For a *dense productivity dashboard*
   (not a single-CTA landing page), coloring every button orange violates the
   "one primary CTA per screen" rule. Orange = `variant="cta"` for the single most
   important action; teal = everything else.
2. **White/neutral surfaces instead of teal-tinted (`#F0FDFA`/`#99F6E4`).** Large
   teal-tinted surfaces and teal-200 borders are fatiguing in a data-dense app and
   reduce contrast. Backgrounds are white/near-black; teal appears as accents only.
3. **Colors expressed in `oklch`** (not hex) for perceptually-uniform light/dark tonal
   variants — dark mode uses brighter, slightly desaturated teal/orange per
   `color-dark-mode`.
4. **Subtle shadows retained** (`shadow-sm`) rather than pure-flat, to preserve
   elevation hierarchy for cards/popovers/modals while staying minimal.

Font: **Plus Jakarta Sans** (loaded in `index.html`, set as `--font-sans`).
