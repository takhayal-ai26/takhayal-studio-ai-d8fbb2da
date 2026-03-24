

# Takhayal.ai — AI Image Generation Studio

## Overview
A dark, studio-grade AI image generation workspace inspired by Higgsfield.ai. Arabic-first branding with an ember (#F03E1B) accent on a void-black UI. No landing page — users land directly in the studio. Auth is handled via an inline modal overlay.

## Design System Setup
- Custom dark theme: Void black background, Charcoal text, Ember accents
- Typography: DM Sans (English), Almarai + Cairo (Arabic) via Google Fonts
- Shape: 12px cards, 8px buttons, no shadows/gradients/glows
- Custom scrollbar styling, focus states with Ember outline
- Respect `prefers-reduced-motion`

## Logo
- Geometric Arabic "ت" mark with two Ember dots, white body
- "Takhayal" in DM Sans Medium + ".ai" in Ember
- Uploaded SVGs used as logo assets

## Layout — Three-Column Workspace

### Left Sidebar (220px)
- Logo at top
- Nav items: Studio, Gallery, Templates, Credits, Settings — with active/hover states per spec
- Bottom: credit pill showing balance + user avatar row
- Mobile: collapses to bottom tab bar

### Center Canvas (flex-grow)
- Top bar: page title + aspect ratio pills + download button
- Main output card (max 640px centered): empty state → loading shimmer/spinner → generated image with fade-in
- Variations row: 4 thumbnails below main card, click to swap
- Bottom action bar: Regenerate (outlined) + Download (Ember filled)

### Right Panel (320px)
- Collapsible sections: Prompt, Templates, Style, Format
- **Prompt**: textarea with char count, clear button, "Enhance with AI" toggle
- **Templates**: 10 culturally-relevant pill templates (Ramadan, Eid, National Day, etc.) that auto-fill prompts
- **Style**: 2×4 grid of visual styles (Cinematic, Photorealistic, etc.)
- **Format**: Aspect ratio buttons synced with canvas + Quality toggle (Standard/HD)
- **Generate**: sticky bottom section with cost preview + full-width Ember button + ⌘Enter shortcut
- Mobile: becomes bottom drawer

## Pages (via sidebar nav)

### Studio (default)
- The main workspace described above
- Keyboard shortcut: Cmd/Ctrl+Enter to generate

### Gallery
- Masonry grid (3 cols) of generated images
- Filter pills by template category
- Hover overlay with prompt preview, date, download, "Use again"
- Empty state with CTA to Studio

### Credits
- Balance card with Ember border showing current credits
- 3 top-up tiers: 100/3 KWD, 300/8 KWD (popular), 1000/22 KWD
- Usage history table

### Settings
- Profile card with avatar, name, email
- Language toggle (English/Arabic — RTL switch for later)
- Default quality and aspect ratio preferences
- Danger zone: delete account

## Auth Flow (inline modal, not a page)
- Studio renders behind dark overlay (rgba(0,0,0,0.85))
- Floating card modal: logo, "Start creating", tab login/signup, email+password fields, Google SSO button, terms link
- On auth success: modal fades out (200ms), welcome toast appears
- Mock auth with local state (no real backend yet)

## UX Micro-Details
- Toast system: success (green), error (red), credits (ember), warning (amber) — bottom-right
- Credit guard: warning at ≤10, blocking modal at 0
- All animations: 150-300ms with reduced-motion support
- Escape key dismisses modals

## State Management
- Local state for: auth status, selected nav, prompt text, selected template/style/format/quality, generated images, credits balance, gallery items
- Mock image generation with loading states and placeholder images

## What's NOT Built
- No landing/marketing page
- No real AI generation backend (mocked)
- No real payments
- No Arabic UI (toggle placeholder only)
- No video, face swap, teams, API, inpainting, social, or admin features

