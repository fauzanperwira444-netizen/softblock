---
name: Tactile Barista Modern
colors:
  surface: '#f8fafa'
  surface-dim: '#d8dada'
  surface-bright: '#f8fafa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f4'
  surface-container: '#eceeee'
  surface-container-high: '#e6e8e8'
  surface-container-highest: '#e1e3e3'
  on-surface: '#191c1d'
  on-surface-variant: '#414844'
  inverse-surface: '#2e3131'
  inverse-on-surface: '#eff1f1'
  outline: '#717973'
  outline-variant: '#c1c8c2'
  surface-tint: '#406653'
  primary: '#406653'
  on-primary: '#ffffff'
  primary-container: '#769e88'
  on-primary-container: '#0c3424'
  inverse-primary: '#a6d0b8'
  secondary: '#5a5f5e'
  on-secondary: '#ffffff'
  secondary-container: '#dce1df'
  on-secondary-container: '#5f6462'
  tertiary: '#3d6752'
  on-tertiary: '#ffffff'
  tertiary-container: '#739f87'
  on-tertiary-container: '#073523'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c2ecd3'
  primary-fixed-dim: '#a6d0b8'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#284e3c'
  secondary-fixed: '#dfe3e1'
  secondary-fixed-dim: '#c3c7c6'
  on-secondary-fixed: '#181d1c'
  on-secondary-fixed-variant: '#434847'
  tertiary-fixed: '#beedd2'
  tertiary-fixed-dim: '#a3d1b7'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#244f3b'
  background: '#f8fafa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e3'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-numeric-lg:
    fontFamily: Space Mono
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: 0.04em
  label-numeric-md:
    fontFamily: Space Mono
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: 0.02em
  label-ui:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system translates the precision, warmth, and sensory tactility of modern specialty espresso hardware into a digital environment. Designed for hardware telemetry dashboards, precision IoT devices, and professional specialty equipment monitors, it emphasizes clarity, calm assurance, and mechanical control.

The visual language bridges **soft neomorphism** and **precision minimalism**:
- **Soft Neomorphism & Tactile Surfaces:** Extruded soft-pill surfaces, debossed inset status trays, and pill-shaped control pads. Interfaces mirror sandblasted anodized aluminum, matte ceramic, and satin glass.
- **Precision Instrumentation:** Technical values, pressure curves, and timers are rendered with clinical precision. High-contrast dot-matrix/segmented numerical readouts are paired with geometric, accessible sans-serif typography.
- **Organic Muted Accentuation:** A calming sage and eucalyptus green spectrum provides focused, eye-friendly contrast against an off-white, light gray ceramic canvas. Deep slate charcoal anchors interactive calls-to-action.

## Colors

The palette reproduces physical materials found in artisanal espresso appliances: matte ceramic off-white, anodized aluminum, and botanical sage accents.

### Palette Architecture
- **Primary (`#769E88`) & Tertiary (`#8FBCA3`):** Muted sage and eucalyptus tones. Reserved for active states, dynamic curve plots, dial backdrops, and active hardware selection cards.
- **Accent Light Tint (`#E3EFE9`):** Soft mist green used for inset card fills, selected item highlights, and low-intensity glows.
- **Secondary / Contrast Dark (`#1E2322`):** Deep charcoal slate. Applied to prominent pill actions (such as "Start Brew" or "View Analytics"), active navigation pill containers, and primary headings.
- **Neutral Base Canvas (`#EDEFEF` / `#E8EAEA`):** Warm, light gray foundation that allows dual-source highlights (pure white specular light) and gentle drop shadows to produce realistic extrusion without visual clutter.
- **Surface Elevation Levels:**
  - Base canvas: `#EDEFEF`
  - Extruded cards & floating controls: `#F4F6F5` to `#FFFFFF`
  - Inset micro-trays / debossed wells: `#E4E7E6`

## Typography

The typographic strategy pairs a friendly, geometric sans-serif (**Plus Jakarta Sans**) for content hierarchy with a monospaced display face (**Space Mono**) for live telemetry, digital timers, and metric indicators.

- **Primary Interface (Plus Jakarta Sans):** Offers balanced proportions, legible micro-captions, and rounded terminals that complement the soft hardware forms.
- **Telemetry & Hardware Readouts (Space Mono):** Used for temperatures (e.g. `92° C`), extraction pressure (`9.0 bar`), liquid volume, and digital timers (`00:15`). Numbers maintain uniform tabular widths to prevent layout jitter during active brewing cycles.
- **Hierarchical Discipline:** Data values dominate visually over labels. Labels employ muted slate tones (`#7A8480`) in uppercase or semi-bold title case, keeping telemetry at the forefront.

## Layout & Spacing

The layout is built around a continuous tactile workstation:
- **Root Enclosure:** The entire viewport or primary dashboard canvas is housed in a generous, padded tablet-like containment bezel with outer padding matching `space-lg` (24px) to `space-xl` (32px).
- **Rail + Canvas Grid:** A persistent 64px compact icon rail or docked selector sits to the left, followed by a fluid modular grid:
  - **Desktop / Tablet Landscape:** 12-column adaptive layout. Metric cards occupy the top row in a 5-column span or equal horizontal distribution. The workspace splits into an active visualizer/circular gauge area (7–8 cols) and a dedicated analytics/curve card (4–5 cols).
  - **Tablet Portrait / Mobile:** Reorganizes into a single-column stacked view. The circular gauge centers above the live extraction curve, while top-level metric metrics transition to a horizontally swipeable rail.
- **Micro-Spacers:** Component internals adhere to an 8px grid cadence (`space-xs` = 4px, `space-sm` = 8px, `space-md` = 16px, `space-lg` = 24px).

## Elevation & Depth

Visual depth is achieved through physical extrusion and debossed wells rather than sharp drop shadows.

1. **Extruded Soft Cards (Convex / Floating):**
   - Constructed with dual ambient light vectors:
     - Top-left specular highlight: `box-shadow: -4px -4px 10px rgba(255, 255, 255, 0.9)`
     - Bottom-right soft occlusion: `box-shadow: 6px 6px 16px rgba(30, 35, 34, 0.06), 2px 2px 6px rgba(30, 35, 34, 0.04)`
   - Used for micro-metric cards, floating icon action buttons, and hardware selector cards.

2. **Debossed / Inset Wells (Concave / Nested):**
   - Recessed regions for sliders, progress paths, and active display chambers:
     - `box-shadow: inset 2px 2px 6px rgba(30, 35, 34, 0.08), inset -2px -2px 6px rgba(255, 255, 255, 0.8)`

3. **Luminescent Radial Glow (Extraction Core):**
   - The central dial features an ethereal background glow using the accent tint:
     - `background: radial-gradient(circle, rgba(143, 188, 163, 0.45) 0%, rgba(227, 239, 233, 0.1) 70%, transparent 100%)`
   - Produces a soft backlit aesthetic reminiscent of frosted LED gauges.

## Shapes

The design system uses a pill-forward shape scale (`roundedness: 3`) to match ergonomic, premium appliance touchpoints:
- **Interactive Controls & Mini Actions:** Full pill rounding (`border-radius: 9999px`) on buttons, filter chips, segmented selectors, and floating indicator toggles.
- **Data & Metric Tiles:** Large continuous corner radiuses (`rounded-xl` = 24px–32px), creating squircle-like silhouettes that sit naturally on the base canvas.
- **Hardware Dial Arcs:** Curved concentric geometries and circular gauges. Accompanying arc sliders feature rounded end-caps.

## Components

### Buttons & Quick Triggers
- **Primary Capsule Action (e.g., "Start Brew"):** Deep charcoal background (`#1E2322`), white text, full pill radius. Accompanied by micro-icons (e.g. coffee cup glyph) left-aligned with `space-sm` gap.
- **Tactile Circular Buttons:** 44px–52px round circles, extruded white/off-white body with subtle dual shadows. Active state drops into a debossed inset shadow.
- **Secondary Capsule:** Translucent sage tint (`#E3EFE9`) with primary green text (`#769E88`).

### Micro-Metric Tiles (Telemetry Cards)
- Soft extruded rounded-xl cards with low-contrast labels in `label-ui` (`#7A8480`).
- Values rendered in monospaced or bold sans numbers with small unit superscripts (e.g. `93° C`, `9.0 bar`).
- Preceded by subtle line-drawn telemetry iconography (steam, gauge, thermometer, drop, antenna).

### Brewing Dial & Gauge
- Dual concentric display: an outer dashed or dot-matrix tick track with an inner luminescent sage circle.
- Center features state display: standard sans label ("Time") over prominent monospaced numerical readout ("00:15").
- Flanked by an ergonomic arc slider with debossed travel grooves and frosted tactile thumb capsules.

### Hardware Carousel / Selection Cards
- Vertical or horizontal card arrays showing machine model previews with soft background fills.
- Active machine card takes an extruded sage-mist border (`2px solid #8FBCA3`) with a soft inner tint (`#E3EFE9`).

### Analytics & Curve Panel
- Frosted or solid sage container (`#769E88`) housing real-time spline graphs (Pressure vs. Flow).
- Grid lines rendered in low-opacity white (`rgba(255, 255, 255, 0.15)`).
- Plotted curves use solid and dotted high-contrast white paths with tactile circular scrub points displaying tooltips (`11bar  45s  5ml`).