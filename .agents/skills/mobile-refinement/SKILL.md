---
name: mobile-refinement
description: Refine the Loom Saga mobile experience to feel like a premium native app, inspired by luxury brands like Manish Malhotra. Use this whenever the user mentions mobile layout, responsiveness, touch targets, "app-like" feel, hamburger menu, product grid, section stacking, or anything that looks "broken" or "amateur" on mobile.
---

# Mobile Refinement — Loom Saga

The Loom Saga mobile experience must feel like a luxury native app, not a website.
Inspiration: **manishmalhotra.in** — editorial, spacious, image-first, zero clutter.

---

## 1. The "Native App" Foundation

**Viewport** (all HTML files must have this in `<head>`):
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

**Global overflow lockdown** (in `css/styles.css` under `@media (max-width: 768px)`):
```css
html, body {
  overflow-x: hidden !important;
  width: 100% !important;
  max-width: 100vw !important;
}
```

---

## 2. Product Grid — Clean 2-Column (No "1.5 Cards")

Never show partially-visible cards. It looks amateur. Always show **complete** cards in a clean grid.

```css
@media (max-width: 768px) {
  .products-grid {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 20px 12px !important;  /* 20px vertical, 12px horizontal */
    padding: 0 16px !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
}
```

---

## 3. Discover Section — Editorial Side-by-Side Grid

Replace the "peek carousel" (85% card width) with a clean 2-column portrait grid.

```css
@media (max-width: 768px) {
  .discover-grid {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 10px !important;
    overflow-x: unset !important;
    scroll-snap-type: none !important;
  }
  .discover-card {
    min-width: unset !important;
    width: 100% !important;
  }
  .discover-image-wrapper {
    aspect-ratio: 3 / 4 !important;  /* Portrait — luxury saree feel */
    overflow: hidden !important;
  }
}
```

---

## 4. Story Sections — Vertical Stack (Not Cramped Side-by-Side)

The `story-wrapper` used a 2-column grid that made text unreadably tiny on mobile.
Fix: stack each story block vertically (image → text content).

```css
@media (max-width: 768px) {
  .story-wrapper {
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
  .story-block, #artist-legacy, #craft-matters {
    display: grid !important;
    grid-template-columns: 1fr !important;
    width: 100% !important;
  }
  .story-image {
    max-height: 60vw !important;  /* Cap tall images */
    overflow: hidden !important;
    order: 1 !important;
  }
  .story-content {
    order: 2 !important;
    padding: 28px 20px !important;
    text-align: center !important;
  }
}
```

---
## 8. Strict Hover Cleanup — No "Sticky" Touch States

Luxury apps do not have hover states because touch devices don't have cursors. Hover effects triggered by a tap often "stick" until the user taps elsewhere, making the UI feel broken.

**The Standard**:
- Use `*:hover { transform: none !important; filter: none !important; }` inside the mobile media query.
- Wrap all desktop-only hover effects in `@media (hover: hover) { ... }` whenever possible, or override them with `!important` in the mobile block.
- Explicitly neutralize header background shifts and image zoom effects.

```css
@media screen and (max-width: 768px) {
  *:hover {
    transform: none !important;
    filter: none !important;
  }
}
```

## 5. Hamburger Menu — Organized & Luxury Touch Targets

- **Minimum touch target**: 44×44px on every link/button (Apple & Google standard)
- **Separators**: Use gold-tinted rgba borders, not harsh grey ones
- **Spacing**: At least 20px padding per menu item

```css
@media (max-width: 768px) {
  .mobile-menu__link, .mobile-menu__subgroup-btn {
    padding: 20px 0 !important;
    min-height: 44px !important;
    font-size: 0.8rem !important;
    letter-spacing: 0.16em !important;
  }
  .mobile-menu__item {
    border-bottom: 1px solid rgba(201, 169, 98, 0.18) !important;
  }
  .mobile-menu__secondary {
    border-top: 1px solid rgba(201, 169, 98, 0.12) !important;
    padding: 28px 0 16px !important;
  }
  .icon-btn, .hamburger {
    min-width: 44px !important;
    min-height: 44px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
}
```

---

## 6. Luxury Typography on Mobile

- Body text minimum: **0.88rem / 14px** (with 1.75–1.8 line-height)
- Section titles: **`clamp(0.95rem, 4vw, 1.2rem)`** with wide letter-spacing (`0.18em`)
- Always center-align section headings on mobile
- Never sacrifice legibility for style

---

## 7. Breakpoints Used in This Project

| Breakpoint | Target |
|---|---|
| `max-width: 768px` | Mobile + small tablets (primary) |
| `max-width: 767px` | Mobile only (used in older rules) |
| `min-width: 1024px` | Desktop layout overrides |

---

## Implementation Checklist

When fixing a mobile issue, always:
1. ✅ Check `<meta name="viewport">` in the HTML file's `<head>`
2. ✅ Add/update styles in the **"LOOM SAGA — MOBILE LUXURY REFINEMENTS"** block at the **bottom of `css/styles.css`**
3. ✅ Use `!important` when overriding existing mobile rules (there are many inherited layers)
4. ✅ Test at 375px (iPhone SE) and 390px (iPhone 14) viewport widths
5. ✅ Never introduce new color variables — use `--color-gold`, `--color-bg`, `--color-black`
