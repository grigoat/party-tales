# PARTY TALES — Technical Specification for Complete Redesign

**Author:** UX/UI Design Lead  
**Date:** June 2026  
**Status:** Draft v1.0  
**Target Level:** Awwwards / Premium Brand (9/10+)

---

## Table of Contents

1. [Brand & Positioning](#1-brand--positioning)
2. [Visual Identity System](#2-visual-identity-system)
3. [Typography](#3-typography)
4. [Color System](#4-color-system)
5. [Component Library](#5-component-library)
6. [Sitemap & Page Structure](#6-sitemap--page-structure)
7. [Homepage — Detailed Section-by-Section](#7-homepage--detaled-section-by-section)
8. [Services Page](#8-services-page)
9. [Gallery Page](#9-gallery-page)
10. [About Page](#10-about-page)
11. [Contact Page](#11-contact-page)
12. [Animation & Interaction Specifications](#12-animation--interaction-specifications)
13. [Micro-Interactions](#13-micro-interactions)
14. [Copywriting Guidelines](#14-copywriting-guidelines)
15. [Technical Requirements](#15-technical-requirements)
16. [Migration Plan](#16-migration-plan)

---

## 1. Brand & Positioning

### Current State
- Perceived as: "two moms making nice balloons"
- Trust level: local, small business
- Emotional ceiling: sweet, but not aspirational

### Target State
- Perceived as: **"Switzerland's premier boutique celebration design studio"**
- Trust level: luxury, editorial, editorial-grade
- Emotional ceiling: aspiration, wonder, exclusivity

### Brand Pillars
| Pillar | Expression |
|---|---|
| **Wonder** | Every interaction should evoke childlike awe |
| **Craft** | Swiss precision applied to celebration design |
| **Memory** | We don't sell balloons — we sell the moment a child's face lights up |
| **Trust** | Premium materials, white-glove service, punctuality |

### Tone of Voice
- **Warm** but not saccharine
- **Aspirational** but not cold
- **Confident** but not arrogant
- **Editorial** — think Monocle / Cereal Magazine meets Vogue Living

### Tagline Evolution
| Current | Proposed |
|---|---|
| «Сказка из воздуха для вашего праздника» | «Moments that float. Memories that last.» (EN) |
| — | «Momente, die schweben. Erinnerungen, die bleiben.» (DE) |
| — | «Моменты, что парят. Воспоминания, что живут.» (RU) |

---

## 2. Visual Identity System

### Design Philosophy
**«Editorial Minimalism with Emotional Warmth»**

Inspired by:
- Apple's restraint and precision
- Airbnb's warmth and belonging
- Stripe's clarity and trust
- Framer's playfulness and craft
- Cereal Magazine's editorial whitespace
- Aesop's sensory texture

### Logo
- **Preserve** the current logotype (brand recognition)
- Add a **subtle wordmark refinement**: tighter tracking, slightly higher contrast
- Introduce a **monogram variant** (PT) for favicon and watermarks
- **Do not** redesign the balloon icon — keep heritage

### Imagery Philosophy
- All photography must feel **editorial, not commercial**
- No stock photography — ever
- Hero images: shallow DOF, warm golden/rose gold tones
- Detail shots: macro textures of balloons (latex sheen, ribbon质感)
- Candid moments: parents watching child's reaction (not looking at camera)
- Every image tells a story, not a product shot

---

## 3. Typography

### Primary Font: **Instrument Sans** (or **ABC Social** for more editorial feel)

| Usage | Weight | Size (Desktop) | Size (Mobile) | Line Height |
|---|---|---|---|---|
| Hero Headline | 600 / 700 | clamp(2.5rem, 5vw, 4.5rem) | clamp(2rem, 8vw, 2.5rem) | 1.05 |
| Section Title | 500 | clamp(1.8rem, 3vw, 2.8rem) | clamp(1.4rem, 6vw, 1.8rem) | 1.1 |
| Card Title | 600 | 1.25rem | 1.1rem | 1.2 |
| Body | 400 | 1rem | 0.95rem | 1.6 |
| Small / Caption | 400 | 0.85rem | 0.8rem | 1.4 |
| Price | 600 italic | 1.5rem | 1.25rem | 1.2 |
| Button | 500 | 0.9rem | 0.85rem | 1 |

### Secondary Font (for accents): **Instrument Serif** or **Source Serif 4**

| Usage | Weight | Size | Style |
|---|---|---|---|
| Pull quotes | 400 italic | 1.5–2rem | Italic, subtle |
| Price labels | 400 | 0.7rem | Uppercase, letter-spaced |
| Section numbers | 300 | 5–8rem | Faded, editorial |

### Type Scale
```
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
--text-3xl: 2rem;
--text-4xl: 2.5rem;
--text-5xl: 3.5rem;
--text-6xl: 4.5rem;
```

---

## 4. Color System

### Primary Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-bg` | `#FAF8F5` | Page background — warm off-white, like premium paper |
| `--color-bg-alt` | `#F3EDE8` | Alternate sections — subtle warmth |
| `--color-bg-dark` | `#1A1618` | Dark sections (hero overlay, footer) |
| `--color-text` | `#1A1618` | Primary text — almost-black with warmth |
| `--color-text-secondary` | `#7A7270` | Secondary text — warm grey |
| `--color-text-inverse` | `#FAF8F5` | Text on dark backgrounds |
| `--color-accent` | `#D478B0` | Primary accent — dusky rose gold |
| `--color-accent-hover` | `#C05E9A` | Accent hover |
| `--color-accent-light` | `#F0D6E5` | Accent backgrounds, badges |
| `--color-border` | `#E5DDD8` | Subtle borders, dividers |
| `--color-card` | `#FFFFFF` | Card backgrounds |
| `--color-success` | `#4A9D7A` | Success states (toast, form) |

### Gradient System
```css
--gradient-hero: linear-gradient(180deg, rgba(26,22,24,0.85) 0%, rgba(26,22,24,0.4) 40%, rgba(26,22,24,0.2) 100%);
--gradient-accent: linear-gradient(135deg, #D478B0 0%, #E8A0C8 50%, #F0D6E5 100%);
--gradient-card-hover: linear-gradient(180deg, rgba(212,120,176,0.05) 0%, transparent 100%);
```

### Glassmorphism Tokens
```css
--glass-bg: rgba(250, 248, 245, 0.7);
--glass-border: rgba(255, 255, 255, 0.2);
--glass-shadow: 0 8px 32px rgba(26, 22, 24, 0.08);
--glass-blur: 12px;
```

---

## 5. Component Library

### 5.1 Navigation

**Desktop:**
- Fixed top, transparent → `--color-bg` with `backdrop-filter: blur(20px)` on scroll
- Logo left, nav links center, CTA + language switcher right
- Nav links: uppercase, `--text-xs`, letter-spaced 1.5px
- Active state: subtle underline that animates on hover (scale from center)
- CTA button: outlined with accent border, fills on hover

**Mobile:**
- Bottom sheet navigation (not hamburger — more premium, think Aesop/Apple)
- Tap logo top-left to scroll to top
- Full-screen overlay with blur background
- Nav items: large type, staggered entrance animation

### 5.2 Buttons

**Primary Button:**
- Background: `--color-accent`
- Text: `--color-text-inverse`
- Border-radius: 100px (pill)
- Padding: 0.875rem 2rem
- Hover: `--color-accent-hover`, slight scale (1.02)
- Transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)
- Focus: ring 2px offset

**Secondary (Outline) Button:**
- Border: 1px solid `--color-text`
- Text: `--color-text`
- Hover: background fills to `--color-text`, text inverts
- Same border-radius, padding, transitions

**Magnetic Button (Premium Detail):**
- On hover, button follows cursor slightly (max 8px offset)
- Implement via JS: `mousemove` event with transform
- Only on desktop, degrade gracefully

**Text Link:**
- No underline by default
- On hover: underline with `background-image` gradient animation (left to right)

### 5.3 Cards

**Service Card (services page):**
- Square-ish aspect ratio (min-height: 320px on desktop)
- Front: icon + title + price (large, italic)
- Back: description + CTA
- Hover: gentle lift (translateY -6px), subtle shadow deepen, `--gradient-card-hover`

**Testimonial Card:**
- Horizontal scroll snap container
- Card min-width: 380px (desktop), 280px (mobile)
- Featured: large avatar, quote in serif italic, attribution
- Card background: `--color-card` with subtle border

**Gallery Item:**
- Masonry column layout
- Hover: overlay gradient (`--gradient-accent` at 60% opacity) + label slide up
- Click: fullscreen lightbox with swipe support

**Stat Card:**
- Large number (2.5rem, 600 weight)
- Label below (0.8rem, uppercase, letter-spaced)
- Optional subtle icon above

### 5.4 Form Elements

- All inputs: border-bottom only (material design inspired)
- Focus: border animates to accent color, label floats up
- Error: shake animation + border turns `--color-accent` (not red — maintain palette)
- Select: custom styled, same treatment
- Textarea: same as input, auto-grow
- Submit: full-width primary button on mobile, fixed-width on desktop

### 5.5 Footer

- Minimal, editorial
- Logo + tagline
- 3-4 nav links (Services / Gallery / About / Contact)
- Social: only Instagram + WhatsApp + Facebook
- Business hours: subtle, small
- Copyright + Terms
- No excessive links — reduce cognitive load

---

## 6. Sitemap & Page Structure

```
/
├── index.html          (Homepage — full scroll narrative)
├── services.html       (Services — grid pricing)
├── gallery.html        (Portfolio — luxury masonry)
├── about.html          (Brand story — editorial)
├── contact.html        (Contact — form + info)
└── terms.html          (Legal — keep as-is, restyle)
```

### Structural Decisions

- **No separate blog** — content lives within the narrative sections
- **No separate "pricing" page** — prices shown inline on services cards
- **No separate "faq" page** — FAQ is a section on contact page
- **Instagram feed** is embedded on homepage (not a separate page)
- **404 page** — custom, with balloon animation and "let's get you back" CTA

---

## 7. Homepage — Detailed Section-by-Section

### Section 0: Preloader
- Full-screen logo animation
- Balloon inflates in center (SVG animation)
- Duration: 1.5s max
- Then logo fades, page content slides in
- On return visits, skip preloader (sessionStorage flag)

### Section 1: Hero (The «Wow»)

**Layout:**
- Full-viewport height
- Video background (current dual-buffering system — keep)
- Dark gradient overlay at bottom (60% of height)
- Content vertically and horizontally centered

**Content (EN example):**
```html
<h1>
  <span class="hero-eyebrow">Premium celebration design</span>
  Moments that float.<br>
  <span class="hero-emphasis">Memories that last.</span>
</h1>
<p>Switzerland's boutique studio for wonder-filled celebrations.<br>
From intimate family moments to grand corporate affairs.</p>
<div class="hero-ctas">
  <a href="contact.html" class="btn btn-primary magnetic">Begin your celebration</a>
  <a href="gallery.html" class="btn btn-outline magnetic">View our portfolio</a>
</div>
```

**Micro-interactions:**
- Eyebrow: fades in first (0.3s delay), slides down
- Headline: staggered character/word reveal (0.6s)
- Paragraph: fade in (0.9s)
- CTAs: fade in with slight upward slide (1.2s)
- All using `will-change: transform, opacity`

**Scrolling behavior:**
- Content fades out as user scrolls down (opacity → 0 by 40vh scrolled)
- Next section slides in from bottom
- Video continues playing behind (no jump)

### Section 2: The Experience (replaces old «About»)

**Layout:**
- Full-width, centered content
- 3 columns with icons + short emotional hooks
- No long descriptions — just taglines

**Content:**
```
[Icon: child's wonder]          [Icon: parent's peace]        [Icon: Swiss precision]
The moment they see it.         You relax. We deliver.        Crafted, not assembled.
```

- Each column: icon (44px) → short headline (1.25rem) → 1 sentence (0.95rem)
- Reveal: staggered, each column slides in from bottom with 0.15s delay between

### Section 3: Services Preview

**Layout:**
- Section label: «Our craft»
- 3 large cards in a row (on desktop)
- Each card: background image (service example) → overlay → title → price → brief
- Card is clickable → leads to services.html specific anchor

**Card Design:**
- Aspect ratio: 4/5 (portrait)
- Image fills card, dark gradient overlay
- On hover: image scales 1.05, overlay lightens slightly
- Text at bottom of card

### Section 4: Gallery Preview («As seen in our portfolio»)

**Layout:**
- Full-width masonry strip — 4 images in a row, varying heights
- No titles visible — pure visual impact
- On hover: subtle scale + label appears
- Bottom: «View full portfolio» CTA
- Gallery auto-rotates every 8 seconds (subtle, no autoplay on mobile)

### Section 5: Customer Stories (Testimonials)

**Layout:**
- Horizontal scroll with snap points
- `scroll-snap-type: x mandatory`
- Each card: large quote (serif italic) → author → event type
- Navigation dots at bottom
- Mouse wheel scrolls horizontally (keep current implementation)
- On mobile: swipe

**Special Feature — «The Moment»:**
- One featured testimonial with photo
- Layout: left side = photo of client at their event (candid, warm), right side = quote
- Photo has subtle parallax on scroll

### Section 6: Social Proof Strip

**Layout:**
- Full-width horizontal scrolling logo cloud (trusted by...)
- Brands: no brands (not corporate enough) — instead use:
  - «Rated 5.0 on Google» (with stars)
  - «98% would recommend to friends»
  - «200+ celebrations delivered»
- Animated counters on scroll

### Section 7: Instagram Feed

**Layout:**
- Title: «Follow the story» → @partytales.ch
- 4 latest Instagram posts (grid, square)
- Click → opens Instagram
- If Instagram API unavailable: static preview images with hover effect

### Section 8: FAQ (collapsible)

**Layout:**
- Centered, max-width 720px
- Details/summary elements (native, styled)
- Open/close: chevron rotation animation
- Items: 5-6 most common questions

**Questions (draft):**
1. How far in advance should I book?
2. Do you deliver outside Zug?
3. How long do balloons last?
4. Can I see a design before you create it?
5. What if I need to cancel?
6. Do you only do balloons?

### Section 9: Final CTA

**Layout:**
- Full-width section, background: `--color-bg-dark`
- Content centered
- Large headline: «Ready to create something unforgettable?»
- Subheadline: «Describe your vision. We'll bring it to life.»
- Two buttons:
  - Primary: «Start your journey» → contact.html
  - Secondary: «Call us on WhatsApp» → WhatsApp link
- Background: subtle floating particle animation (CSS-only, very subtle — small circles moving slowly up)

### Scroll-triggered Sequence for Full Page

```
Section 0: Preloader (1.5s)
Section 1: Hero (100vh)
  → video bg, content fades in
  → scroll: content fades up and out

Section 2: The Experience (60vh)
  → 3 columns stagger in
  → subtle background parallax

Section 3: Services Preview (80vh)
  → cards slide in from left/right/left
  → background: --color-bg-alt

Section 4: Gallery Preview (100vh)
  → images stagger from bottom
  → no background change — content on --color-bg

Section 5: Customer Stories (80vh)
  → horizontal scroll
  → background: --color-bg-alt

Section 6: Social Proof (40vh)
  → counters animate on scroll
  → full-width

Section 7: Instagram Feed (80vh)
  → grid animation
  → on --color-bg

Section 8: FAQ (60vh)
  → centered, collapsible

Section 9: Final CTA (60vh)
  → dark background, animated particles
```

---

## 8. Services Page

### Layout
- Hero: small (40vh), title + subtitle
- Grid: 3 columns × 2 rows of square cards
- Each card: front/back or expandable

### Card Detail (per the current implementation)
Current implementation is good — front/back per card is fine. Refinements:

**Front:**
- Icon (SVG, inline, currentColor)
- Title (1.15rem, medium weight)
- Price (1.4rem, italic, accent color)
- Subtle CTA peek: «Learn more →»

**Back:**
- Description
- Key features (bullet list, no icons)
- CTA button
- Note (if applicable, like same-day delivery note)

### Hover/Click
- Desktop: hover reveals back smoothly (card flip or slide)
- Mobile: tap toggles

---

## 9. Gallery Page

### Layout
- Hero: small (30vh)
- Filter bar: All / Photo backdrops / Balloons / Celebrations / Newborn (pills, scrollable horizontally)
- Masonry grid: 4 columns on desktop, 3 on tablet, 2 on mobile
- Images loaded with blur-up placeholder (low-res base64 or tinyjpg)

### Lightbox (Full Screen)
- Full viewport, `--color-bg-dark` background
- Image centered, max 90vw / 85vh
- Close: X top-right + Escape key
- Navigation: prev/next arrows (on image edges) + keyboard arrows
- Swipe on mobile
- Caption: event title + brief description, bottom, glassmorphism
- Counter: «3 / 15» bottom-left
- Share button: copies URL to clipboard

### Image Loading
- Lazy loading with `loading="lazy"`
- Placeholder blur effect
- Progressive enhancement: use `<picture>` with WebP + JPEG fallback

---

## 10. About Page

### Layout
- Hero: editorial, large portrait photo of founders (warm, candid, in their workspace)
- Content: split layout — text left, image right (or alternating)

### Sections
1. **The story** — 2 paragraphs max, emotional, not corporate
2. **The philosophy** — «Why balloons?» with a beautiful full-bleed image
3. **The founders** — mini bios with photos (not corporate headshots — warm, lifestyle)
4. **The values** — 3-4 cards (keep current structure but reword to avoid clichés)
5. **The service area** — map (simple SVG or static) + delivery info
6. **CTA** — «Meet us» → contact

### About Copy (Draft)
> «We left our homes, travelled half the world, and found ours in Switzerland. Two mamas who believe that the best moments in life are the ones that make you stop breathing for a second — and then laugh until your cheeks hurt. That's what we design. Not balloons. Moments.»

---

## 11. Contact Page

### Layout
- Split: left form, right info
- Form: name, phone, email, event type (dropdown), date (date picker), message
- Info: address, phone, email, hours
- Map: embedded Google Maps (light mode, no extra UI)
- WhatsApp CTA: prominent, floating, with icon

### Form UX
- Floating labels
- Inline validation on blur
- Submit: loading spinner in button → success toast (current implementation)
- After submit: show confirmation with WhatsApp link to continue conversation there

### FAQ Section (below form)
- Collapsible accordion
- 6 questions as drafted above

---

## 12. Animation & Interaction Specifications

### Scroll-Triggered Animations

**System:** Intersection Observer (keep current, enhance)

**Breakpoints:**
| Animation | Trigger | Duration | Easing |
|---|---|---|---|
| Fade up | Element enters viewport (threshold 0.15) | 0.6s | cubic-bezier(0.34, 1.56, 0.64, 1) |
| Fade in from left | Same | 0.7s | same |
| Fade in from right | Same | 0.7s | same |
| Scale in | Hero elements | 0.8s | same |
| Counter | Number enters viewport | 1.5s | linear (animated from 0 to target) |
| Stagger children | Parent enters viewport | children: 0.15s delay each | same |

**Reveal classes:**
```css
.reveal { opacity: 0; transform: translateY(30px); transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
.reveal.visible { opacity: 1; transform: translateY(0); }
.reveal-left { transform: translateX(-30px); }
.reveal-right { transform: translateX(30px); }
.reveal-scale { transform: scale(0.95); }
.reveal-stagger > * { opacity: 0; transform: translateY(20px); transition: all 0.5s ease-out; }
.reveal-stagger.visible > * { opacity: 1; transform: translateY(0); }
.reveal-stagger.visible > *:nth-child(1) { transition-delay: 0s; }
.reveal-stagger.visible > *:nth-child(2) { transition-delay: 0.15s; }
.reveal-stagger.visible > *:nth-child(3) { transition-delay: 0.3s; }
```

### Parallax
- Hero video: fixed background attachment (or JS-driven parallax)
- Section images: subtle parallax (10-15px offset on scroll)
- Use `transform: translateZ()` with perspective for smooth performance

### Smooth Scroll
- `scroll-behavior: smooth` on `html`
- For anchor navigation
- Optional: lenis.js for custom smooth scroll (only if performance allows)

### Morphing / Shape Animation
- Section dividers: subtle wave or blob shapes at section boundaries
- SVG inline, animated with CSS `d` property
- Only on desktop (performance)

---

## 13. Micro-Interactions

### Navigation
- Link hover: underline slides in from center (`background-size` trick)
- Logo hover: subtle scale (1.02)
- Active page: dot indicator or thicker underline

### Buttons
- Hover: fill + scale (1.02)
- Active/click: scale (0.97)
- Magnetic: slight cursor-follow (JS, desktop only)

### Cards
- Hover: translateY(-6px), shadow deepens
- Image inside card: scale(1.05)
- Service card: front/back smooth flip (0.6s)

### Form
- Focus: border animates → accent color
- Valid: subtle green check appears
- Error: shake + accent border
- Submit: button shows spinner, text remains

### Gallery
- Hover: overlay gradient slides up, label appears
- Click to lightbox: smooth scale transition (0.3s)
- Lightbox nav: arrow keys, swipe

### Testimonials
- Hover card: slight lift
- Active dot: pulse animation

### Scrollbar
- Custom scrollbar: thin, accent-colored thumb
- Only on webkit (graceful degradation on Firefox)

```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--color-accent); border-radius: 3px; }
```

### Cursor (Desktop Luxury Detail)
- Custom cursor: 32px circle, `--color-accent` with 15% opacity
- Follows mouse with slight lag (`transition: transform 0.15s`)
- On hoverable elements: circle fills to accent at 30% opacity, scales to 48px
- On buttons/links: circle fills more, scales to 56px
- Implementation: single JS tracker, CSS-only on pseudo-element
- **Disable** on mobile / touch devices

---

## 14. Copywriting Guidelines

### What to remove
| Remove | Replace with |
|---|---|
| качество | «Мы выбираем материалы, которые выдержат ваш праздник» |
| индивидуальный подход | «Расскажите нам свою историю. Мы нарисуем её шарами.» |
| надёжность | «Приедем за час до гостей. Уедем после того, как вы уйдёте.» |
| забота | «Каждая деталь продумана. Даже те, что вы не заметите.» |
| профессиональный | «Мы делаем это с 2020 года. И до сих пор влюблены в каждый заказ.» |

### Headline Patterns
- Short (< 8 words)
- Emotional, not descriptive
- Examples:
  - «Moments that float. Memories that last.»
  - «The art of celebration.»
  - «Your story, told in balloons.»
  - «Switzerland's studio for wonder.»

### Body Copy Principles
- Max 2 sentences per paragraph
- Start with the feeling, end with the fact
- Use sensory language: «warm», «soft», «float», «glow», «gasp», «tear up»
- Avoid exclamation marks (except one per page max)
- Use em-dashes sparingly
- Questions engage: «What would make your child's eyes light up?»

### Emotional Copy Examples

**Before (current):**
> «Мы с заботой превращаем любой праздник в волшебство с помощью авторских композиций из воздушных шаров.»

**After:**
> «Вы помните момент, когда ваш ребёнок впервые увидел что-то по-настоящему волшебное? Мы создаём такие моменты. С 2020 года.»

**Before (services):**
> «От классических летающих шаров до потрясающих букетов — гелиевые шары добавляют элемент веселья и цвета вашему мероприятию.»

**After:**
> «Гости входят и замирают. Потом — улыбки, фотографии, и «где вы это заказали?». Классические и авторские букеты, арки, потолки.»

---

## 15. Technical Requirements

### Performance Budget
- Lighthouse score: ≥ 90 on all 4 metrics
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.05
- First Input Delay: < 50ms
- Total page weight: < 1.5MB (images excluded — they can be up to 3MB total with optimization)

### Image Optimization
- Format: WebP with JPEG fallback
- Quality: 80-85
- Max dimensions: 1920px wide for hero, 1200px for content, 800px for thumbnails
- Lazy loading: native `loading="lazy"`
- Responsive: `<picture>` or `srcset` for 3 breakpoints

### Video
- Current dual-buffering system is good — keep
- Consider adding poster frame for slow connections
- For hero: compressed (H.264, 5-8 Mbps, 1080p)
- Preload: keep current approach

### CSS Architecture
- CSS custom properties for theming (colors, spacing, fonts)
- Single `style.css` (keep current, enhance)
- No CSS framework
- `@media (prefers-reduced-motion: reduce)` — disable all animations
- `@media (hover: hover)` — hover states (don't apply on touch)
- Naming: BEM-lite (block__element--modifier)

### JS Architecture
- Vanilla JS only (no frameworks)
- Current structure is good — keep as `script.js`
- Extract i18n translations to separate JSON files (optional, keep current if working)
- Add smooth scroll library if needed (lenis.js — 8KB gzipped)
- Add intersection-observer polyfill for older browsers

### Responsive Breakpoints
```
--bp-mobile: 480px;
--bp-tablet: 768px;
--bp-desktop: 1024px;
--bp-wide: 1280px;
```

### Accessibility
- All interactive elements: focus-visible styles
- Alt text on all images (descriptive, not keyword-stuffed)
- ARIA labels on icons, buttons, nav
- Color contrast: WCAG AA minimum (4.5:1 for text, 3:1 for large text)
- Skip to content link (visually hidden, shows on focus)
- Form error announcements via aria-live

### Internationalization
- Keep current i18n.js approach
- Add RTL support consideration (not needed now, but structure for it)
- All copy in 3 languages — no hardcoded text

### Meta / SEO
- Open Graph tags per page
- Structured data (JSON-LD): LocalBusiness, with address, hours, photos
- Canonical URLs
- Hreflang tags for DE/RU/EN

---

## 16. Migration Plan

### Phase 1: Foundation (Week 1)
1. Set up new CSS custom properties (colors, spacing, fonts)
2. Rebuild typography system
3. Set up animation framework (reveal classes, intersection observer)
4. Refactor navigation component (bottom sheet on mobile)
5. Test all existing functionality works

### Phase 2: Homepage (Week 2)
1. Implement new hero section (content + animation)
2. Build «The Experience» section
3. Build services preview section
4. Build gallery preview section
5. Build testimonials section
6. Build social proof strip
7. Build Instagram feed
8. Build FAQ accordion
9. Build final CTA
10. Test full scroll narrative

### Phase 3: Interior Pages (Week 3)
1. Refactor services page (new card design)
2. Refactor gallery page (masonry + filter + lightbox)
3. Refactor about page (editorial layout)
4. Refactor contact page (split form + info + FAQ)
5. Refactor terms page (minimal restyle)
6. Build 404 page

### Phase 4: Polish (Week 4)
1. Implement cursor follower
2. Implement magnetic buttons
3. Add micro-interactions across all pages
4. Performance optimization
5. Accessibility audit + fixes
6. SEO audit (meta, schema, OG)
7. Cross-browser testing
8. Mobile testing
9. Lighthouse score tuning

### Phase 5: Launch (Week 5)
1. Deploy to staging
2. Content review with client
3. Copy review across all 3 languages
4. Final QA
5. Deploy to production
6. Monitor performance

---

## Appendix: Design References

### Visual Inspiration
- **Apple** (apple.com) — hero staging, product reveal
- **Airbnb** (airbnb.com/dreamhost) — emotional travel storytelling
- **Aesop** (aesop.com) — editorial product presentation, whitespace
- **Monocle** (monocle.com) — magazine aesthetic, type-driven layout
- **Vogue Living** — luxury editorial spreads
- **Cereal Magazine** — minimal travel/design aesthetic
- **Figma** (figma.com) — product-led narrative
- **Linear** (linear.app) — minimal, precise, high trust

### Color Inspirations
- Anthropologie — warm, earthy, romantic
- Rosewood Hotels — dusky rose, warm neutrals
- SKKN by Kim Kardashian — minimal warmth, beige luxury
- Ganni — playful but premium

### Animation Inspirations
- Cuberto — scroll-driven narrative
- Locomotive Scroll — parallax storytelling
- Framer website — micro-interactions
- Stripe — precise, meaningful motion

---

*End of Technical Specification — Version 1.0*

*Next steps: Approve, assign designer for mockups, then implement per Phase 1.*
