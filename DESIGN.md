---
name: Premium macOS System
colors:
  surface: '#fcf8fb'
  surface-dim: '#dcd9dc'
  surface-bright: '#fcf8fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7ea'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#414755'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#717786'
  outline-variant: '#c1c6d7'
  surface-tint: '#005bc1'
  primary: '#0058bc'
  on-primary: '#ffffff'
  primary-container: '#0070eb'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#5d5e63'
  on-secondary: '#ffffff'
  secondary-container: '#e0dfe4'
  on-secondary-container: '#626267'
  tertiary: '#9e3d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c64f00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#e3e2e7'
  secondary-fixed-dim: '#c6c6cb'
  on-secondary-fixed: '#1a1b1f'
  on-secondary-fixed-variant: '#46464b'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb595'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7c2e00'
  background: '#fcf8fb'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style

This design system is anchored in the aesthetic of high-end desktop operating systems, prioritizing clarity, depth, and intentionality. It targets professional environments where focus and organization are paramount. The design narrative centers on **Glassmorphism** and **Minimalism**, utilizing translucency to create a sense of layered context without visual clutter.

The emotional response is one of calm sophistication and high-performance reliability. By leveraging generous whitespace and soft, diffused light, the UI feels airy and expansive. It avoids heavy ornamentation, relying instead on the interplay of light, shadow, and precise geometry to guide the user's attention.

## Colors

The palette is predominantly monochrome to ensure the content remains the focal point. We use a base of **Pure White** for top-level surfaces and **Soft Grey** (F5F5F7) for structural backgrounds to provide subtle contrast. 

The primary accent is **San Francisco Blue** (#007AFF), used sparingly for primary actions and active states. Success, warning, and error states should follow standard macOS semantic tones but with reduced saturation to maintain the professional aesthetic. Translucency is a core "color" in this system, where surfaces adopt the tones of the elements beneath them through backdrop filters.

## Typography

The design system utilizes **Inter** for its neutral, highly legible characteristics that mirror SF Pro. The typographic hierarchy is strict: bold weights are reserved for structural headers, while body copy maintains a lighter, more open feel.

Letter spacing is slightly tightened for large display headers to create a premium "locked-in" look, while smaller labels receive a touch of tracking to ensure readability at a glance. Line heights are generous to support the "airy" brand pillar.

## Layout & Spacing

The layout follows a **Fluid Grid** system with a focus on large margins and significant negative space. On desktop, we utilize a 12-column grid with a 24px gutter. For high-density task management, elements are grouped into logical containers with 40px (xl) padding to prevent visual overcrowding.

- **Desktop:** 12 columns, 64px-80px side margins.
- **Tablet:** 8 columns, 32px side margins.
- **Mobile:** 4 columns, 16px side margins, transitioning to stacked card layouts.

Alignment should prioritize the left axis for readability, with status indicators and secondary actions often right-aligned within containers to create a balanced horizontal tension.

## Elevation & Depth

Depth is achieved through **Glassmorphism** rather than traditional opaque stacking. 
1. **Base Layer:** The application background (Soft Grey).
2. **Mid Layer:** Main content areas using a 70% opacity white with a 20px-30px backdrop blur and a 1px white border (inner glow).
3. **High Layer:** Modals and dropdowns using 85% opacity white, 40px backdrop blur, and a deep, highly diffused shadow (0px 20px 40px rgba(0,0,0,0.08)).

Shadows must never be "heavy" or "black." They should feel like soft ambient occlusion, reinforcing that the interface is floating in a 3D space.

## Shapes

The shape language is defined by **Large Radii**. Standard components use a 0.5rem (8px) radius, while primary containers and cards use 1rem (16px) or 1.5rem (24px) for an ultra-modern, friendly appearance. 

Buttons should always be fully rounded (pill-shaped) or match the 8px component standard to maintain consistency. Circular shapes are used exclusively for avatars and status indicators.

## Components

### Buttons & Inputs
- **Buttons:** Primary buttons use a solid San Francisco Blue background with white text. Secondary buttons use a glass surface effect with a subtle 1px border.
- **Input Fields:** Minimalist design with no background color—only a soft bottom border or a very faint 1px outline that glows slightly on focus.

### Task Cards
- **Task Cards:** Use white backgrounds with a subtle 1px border (#E5E5E7). On hover, cards should slightly lift via a shadow transition and a scale increase of 1.01x. 
- **Content Spacing:** Internal padding for cards should be at least 24px to maintain the airy feel.

### Status Indicators
- **Indicators:** Use small, high-contrast dots with adjacent label text.
    - **Total:** Neutral black or deep grey.
    - **Completed:** Subtle emerald green.
    - **Pending:** Soft amber or the primary blue.
- **Chips:** Highly rounded with light tinted backgrounds (e.g., light blue background with blue text) for category tagging.

### Navigation
- **Sidebar:** Semi-transparent glass container with a vertical list of items. Active states are indicated by a subtle grey background pill and a 3px blue vertical line on the leading edge.