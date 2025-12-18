# Design System

## Color System Overview

ReplyStack uses a **partial semantic inversion** strategy for dark mode to maintain brand identity while ensuring WCAG contrast compliance. This means shade numbers have different meanings in light vs dark mode for certain ranges.

### ⚠️ Important: Semantic Inversion

**Primary Palette:**
- **Light mode:** Numbers increase = darker shades (standard)
- **Dark mode:** Numbers 50-500 = darker shades (inverted), 600-950 = lighter shades (standard)

**Accent Palette:**
- **Light mode:** Numbers increase = darker shades (standard)
- **Dark mode:** Numbers 50-400 = darker shades (inverted), 500-900 = lighter shades (inverted)

**Key Takeaway:** Don't rely on number semantics. Use the usage guide below instead.

---

## Primary Palette Usage Guide

### Subtle Backgrounds & Cards

Use for backgrounds that need a hint of brand color without overwhelming content.

| Use Case | Light Mode | Dark Mode | Example |
|----------|------------|-----------|---------|
| Card backgrounds | `primary-50` | `primary-50` | Info cards, subtle highlights |
| Slightly emphasized backgrounds | `primary-100` | `primary-100` | Hover states on cards |
| Elevated surfaces | `primary-200` | `primary-200` | Secondary card layers |

**Example:**

```tsx
<div className="bg-primary-50 border border-primary-200">
  {/* Card content */}
</div>
```

### Borders & Dividers

Use for subtle separation and structure.

| Use Case | Light Mode | Dark Mode | Example |
|----------|------------|-----------|---------|
| Subtle borders | `primary-200` | `primary-200` | Card borders, dividers |
| Hover borders | `primary-300` | `primary-300` | Interactive element borders |
| Strong borders | `primary-400` | `primary-400` | Focused input borders |

**Example:**

```tsx
<div className="border border-primary-200 hover:border-primary-300">
  {/* Content */}
</div>
```

### Interactive Elements (Buttons, Links, CTAs)

Use for primary actions and navigation.

| Use Case | Light Mode | Dark Mode | Example |
|----------|------------|-----------|---------|
| Primary buttons | `primary-600` | `primary-600` | Main CTAs, submit buttons |
| Button hover states | `primary-700` | `primary-700` | Hover on primary buttons |
| Links | `primary-600` | `primary-600` | Navigation links, text links |
| Active/visited links | `primary-700` | `primary-700` | Active navigation items |

**Example:**

```tsx
<button className="bg-primary-600 hover:bg-primary-700 text-white">
  Submit
</button>
```

### Text on Light Backgrounds

Use for text that needs to stand out on light surfaces.

| Use Case | Light Mode | Dark Mode | Example |
|----------|------------|-----------|---------|
| Emphasized text | `primary-700` | `primary-800` | Headings, important labels |
| Strong emphasis | `primary-800` | `primary-900` | Critical information |
| Maximum contrast | `primary-900` | `primary-950` | Rare, only for critical text |

**Example:**

```tsx
<h2 className="text-primary-700">Important Heading</h2>
```

### Focus Rings & Accessibility

Use for focus indicators and accessibility features.

| Use Case | Light Mode | Dark Mode | Example |
|----------|------------|-----------|---------|
| Focus rings | `primary-500` | `primary-500` | Keyboard focus indicators |

**Example:**

```tsx
<input className="focus:ring-2 focus:ring-primary-500" />
```

---

## Accent Palette Usage Guide

### Subtle Backgrounds

Use for goldenrod-tinted backgrounds.

| Use Case | Light Mode | Dark Mode | Example |
|----------|------------|-----------|---------|
| Subtle backgrounds | `accent-50` | `accent-50` | Badge backgrounds, highlights |
| Borders | `accent-200` | `accent-200` | Accent borders |

**Example:**

```tsx
<div className="bg-accent-50 border border-accent-200">
  {/* Highlighted content */}
</div>
```

### CTAs & Highlights

Use for attention-grabbing elements.

| Use Case | Light Mode | Dark Mode | Example |
|----------|------------|-----------|---------|
| Primary CTAs | `accent-400` | `accent-600` | Important buttons, badges |
| Star ratings | `accent-400` | `accent-600` | Review star displays |
| Hover states | `accent-500` | `accent-700` | CTA hover effects |

**Example:**

```tsx
<button className="bg-accent-400 dark:bg-accent-600 hover:bg-accent-500 dark:hover:bg-accent-700">
  Get Started
</button>
```

### Text on Dark Backgrounds

Use for readable text in dark contexts.

| Use Case | Light Mode | Dark Mode | Example |
|----------|------------|-----------|---------|
| Text on dark | `accent-800` | `accent-800` | Text on dark surfaces |

**Example:**

```tsx
<div className="bg-gray-900 text-accent-800">
  {/* Text content */}
</div>
```

---

## Common Patterns

### Button Variants

```tsx
// Primary button (works in both modes)
<button className="bg-primary-600 hover:bg-primary-700 text-white">
  Primary Action
</button>

// Accent button (needs mode-specific classes)
<button className="bg-accent-400 dark:bg-accent-600 hover:bg-accent-500 dark:hover:bg-accent-700 text-white">
  CTA
</button>

// Subtle button
<button className="bg-primary-50 dark:bg-primary-50 border border-primary-200 text-primary-700 dark:text-primary-800">
  Secondary Action
</button>
```

### Card Components

```tsx
// Standard card
<div className="bg-surface border border-primary-200 rounded-lg p-4">
  {/* Card content */}
</div>

// Highlighted card
<div className="bg-primary-50 dark:bg-primary-50 border border-primary-200 rounded-lg p-4">
  {/* Important content */}
</div>
```

### Links

```tsx
// Standard link
<a href="#" className="text-primary-600 hover:text-primary-700">
  Link text
</a>

// Link in dark context
<a href="#" className="text-accent-600 dark:text-accent-600 hover:text-accent-700 dark:hover:text-accent-700">
  Link text
</a>
```

### Badges & Labels

```tsx
// Subtle badge
<span className="bg-primary-50 dark:bg-primary-50 text-primary-700 dark:text-primary-800 px-2 py-1 rounded-full">
  Label
</span>

// Accent badge
<span className="bg-accent-50 dark:bg-accent-50 text-accent-800 dark:text-accent-800 px-2 py-1 rounded-full">
  Highlight
</span>
```

---

## Quick Reference: When to Use Which Shade

### Primary Palette

| Shade | Light Mode | Dark Mode | Best For |
|-------|------------|-----------|----------|
| `primary-50` | Very light | Very dark | Subtle backgrounds |
| `primary-200` | Light | Dark | Borders, dividers |
| `primary-500` | Medium | Medium | Focus rings, base brand color |
| `primary-600` | Dark | Light | Primary buttons, links |
| `primary-700` | Darker | Lighter | Button hover, active links |
| `primary-800` | Very dark | Light | Text on light backgrounds |

### Accent Palette

| Shade | Light Mode | Dark Mode | Best For |
|-------|------------|-----------|----------|
| `accent-50` | Very light | Very dark | Subtle backgrounds |
| `accent-200` | Light | Dark | Borders |
| `accent-400` | Medium | Medium-dark | Base brand color (goldenrod) |
| `accent-600` | Dark | Light | CTAs, star ratings |
| `accent-800` | Very dark | Light | Text on dark backgrounds |

---

## Accessibility Guidelines

### Contrast Requirements

- **Text on backgrounds:** Minimum 4.5:1 contrast ratio (WCAG AA)
- **Large text (18pt+):** Minimum 3:1 contrast ratio
- **Interactive elements:** Minimum 3:1 contrast ratio for focus indicators

### Recommended Combinations

✅ **Good contrast:**
- `primary-600` text on white/light backgrounds
- `primary-800` text on `primary-50` backgrounds
- `accent-600` text on dark backgrounds

❌ **Avoid:**
- `primary-400` text on white (too light)
- `primary-50` text on white (insufficient contrast)
- `accent-400` text on light backgrounds (check contrast)

---

## Migration Notes

If you're updating existing code:

1. **Don't change working code** - If a color combination works and has good contrast, leave it
2. **Use this guide for new code** - Reference the usage guide above
3. **Test in both modes** - Always verify appearance in light and dark mode
4. **Check contrast** - Use browser dev tools or contrast checkers

---

## Future Considerations

The partial semantic inversion strategy was chosen to:
- Maintain brand identity (terracotta/goldenrod remain recognizable)
- Ensure WCAG compliance
- Avoid needing separate color names for dark mode

**Potential improvements:**
- Consider a fully semantic approach where numbers always correlate with visual lightness within each mode
- Add design tokens that abstract away the number system (e.g., `color.primary.interactive`, `color.primary.background`)
- Create a component library with pre-styled variants that handle mode differences automatically

