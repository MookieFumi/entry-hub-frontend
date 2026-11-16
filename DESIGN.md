---
name: EntryHub
description: Room booking drawn as an office wall planner; marker-ink blue, ruled white cells, sticker colours with jobs, highlighter yellow for what is yours.
colors:
  brand-25: '#f6f7ff'
  brand-50: '#eef0fe'
  brand-100: '#dfe4fd'
  brand-200: '#c2cbfa'
  brand-300: '#9aa8f4'
  brand-400: '#6c7fec'
  brand-500: '#4359df'
  brand-600: '#2a3fc9'
  brand-700: '#1f2fa3'
  brand-800: '#18257d'
  brand-900: '#121c57'
  brand-950: '#0c1238'
  gray-25: '#f4f6f9'
  gray-50: '#edf0f5'
  gray-100: '#e3e7ef'
  gray-200: '#d3d9e5'
  gray-300: '#b8c1d3'
  gray-400: '#8e99b3'
  gray-500: '#5f6b88'
  gray-600: '#46516d'
  gray-700: '#303a57'
  gray-800: '#1c2542'
  gray-900: '#0f1736'
  white: '#ffffff'
  success-50: '#ddf5e8'
  success-500: '#17a865'
  success-700: '#0a6a3f'
  warning-50: '#fff0d2'
  warning-500: '#f39a0b'
  warning-700: '#8a4a00'
  error-50: '#fde6e1'
  error-300: '#f6a495'
  error-500: '#f0533b'
  error-600: '#cf3a23'
  error-700: '#a52a17'
  mine-200: '#fff3a3'
  mine-400: '#ffe53d'
typography:
  display:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: 'clamp(3rem, 9vw, 6rem)'
    fontWeight: 750
    lineHeight: 0.95
    letterSpacing: '-0.005em'
    fontVariation: "'wdth' 78"
  headline:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: '2.25rem'
    fontWeight: 750
    lineHeight: 1.25
    letterSpacing: '-0.005em'
    fontVariation: "'wdth' 78"
  title:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: '1.125rem'
    fontWeight: 750
    lineHeight: 1.55
    letterSpacing: '-0.005em'
    fontVariation: "'wdth' 78"
  numeral:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: '1.5rem'
    fontWeight: 750
    lineHeight: 1
    letterSpacing: '-0.005em'
    fontVariation: "'wdth' 78"
    fontFeature: "'tnum'"
  body:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: '0.875rem'
    fontWeight: 600
    lineHeight: 1.43
  sticker:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: '0.75rem'
    fontWeight: 600
    lineHeight: 1.33
  header-band:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: '0.75rem'
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: '0.05em'
rounded:
  sm: '0.25rem'
  lg: '0.5rem'
  xl: '0.625rem'
  full: '9999px'
spacing:
  '1.5': '6px'
  '2': '8px'
  '3': '12px'
  '4': '16px'
  '5': '20px'
  '6': '24px'
  '8': '32px'
  '10': '40px'
components:
  button-primary:
    backgroundColor: '{colors.brand-600}'
    textColor: '{colors.white}'
    typography: '{typography.label}'
    rounded: '{rounded.lg}'
    padding: '10px 16px'
  button-primary-hover:
    backgroundColor: '{colors.brand-700}'
  button-primary-active:
    backgroundColor: '{colors.brand-800}'
  button-secondary:
    backgroundColor: '{colors.white}'
    textColor: '{colors.gray-800}'
    typography: '{typography.label}'
    rounded: '{rounded.lg}'
    padding: '10px 16px'
  button-secondary-hover:
    backgroundColor: '{colors.brand-25}'
    textColor: '{colors.brand-800}'
  button-destructive:
    backgroundColor: '{colors.error-600}'
    textColor: '{colors.white}'
    typography: '{typography.label}'
    rounded: '{rounded.lg}'
    padding: '10px 16px'
  button-destructive-hover:
    backgroundColor: '{colors.error-700}'
  button-landing:
    backgroundColor: '{colors.mine-400}'
    textColor: '{colors.brand-950}'
    rounded: '{rounded.lg}'
    padding: '12px 20px'
  button-landing-hover:
    backgroundColor: '{colors.white}'
  badge-gray:
    backgroundColor: '{colors.gray-100}'
    textColor: '{colors.gray-700}'
    typography: '{typography.sticker}'
    rounded: '{rounded.full}'
    padding: '2px 10px 2px 8px'
  badge-success:
    backgroundColor: '{colors.success-50}'
    textColor: '{colors.success-700}'
    typography: '{typography.sticker}'
    rounded: '{rounded.full}'
    padding: '2px 10px 2px 8px'
  badge-warning:
    backgroundColor: '{colors.warning-50}'
    textColor: '{colors.warning-700}'
    typography: '{typography.sticker}'
    rounded: '{rounded.full}'
    padding: '2px 10px 2px 8px'
  badge-error:
    backgroundColor: '{colors.error-50}'
    textColor: '{colors.error-700}'
    typography: '{typography.sticker}'
    rounded: '{rounded.full}'
    padding: '2px 10px 2px 8px'
  badge-brand:
    backgroundColor: '{colors.brand-50}'
    textColor: '{colors.brand-800}'
    typography: '{typography.sticker}'
    rounded: '{rounded.full}'
    padding: '2px 10px 2px 8px'
  badge-mine:
    backgroundColor: '{colors.mine-400}'
    textColor: '{colors.brand-950}'
    typography: '{typography.sticker}'
    rounded: '{rounded.full}'
    padding: '2px 10px 2px 8px'
  input:
    backgroundColor: '{colors.white}'
    textColor: '{colors.gray-900}'
    typography: '{typography.body}'
    rounded: '{rounded.lg}'
    padding: '10px 12px'
  card:
    backgroundColor: '{colors.white}'
    textColor: '{colors.gray-900}'
    rounded: '{rounded.xl}'
    padding: '20px'
  nav-item:
    backgroundColor: '{colors.brand-700}'
    textColor: '{colors.brand-100}'
    rounded: '{rounded.lg}'
    padding: '8px 12px'
  nav-item-active:
    backgroundColor: '{colors.white}'
    textColor: '{colors.brand-900}'
    typography: '{typography.label}'
    rounded: '{rounded.lg}'
    padding: '8px 12px'
  date-tile:
    backgroundColor: '{colors.white}'
    textColor: '{colors.gray-900}'
    typography: '{typography.numeral}'
    rounded: '{rounded.lg}'
    width: '56px'
  date-tile-band:
    backgroundColor: '{colors.brand-700}'
    textColor: '{colors.white}'
  planner-strip:
    backgroundColor: '{colors.white}'
    rounded: '{rounded.lg}'
    height: '48px'
  planner-block-busy:
    backgroundColor: '{colors.error-500}'
    rounded: '{rounded.sm}'
  planner-block-mine:
    backgroundColor: '{colors.mine-400}'
    rounded: '{rounded.sm}'
  toast:
    backgroundColor: '{colors.brand-950}'
    textColor: '{colors.white}'
    rounded: '{rounded.lg}'
    padding: '14px'
---

# Design System: EntryHub

## Overview

**Creative North Star: "The Office Wall Planner"**

EntryHub looks like the laminated planner on an office wall: a cool laminate ground, white cells ruled with blue-grey lines, lettering in marker-ink blue, and a handful of stickers whose colour always means the same thing. Office time is drawn before it is written. A day is a ruled strip with blocks on it, a booking is led by its date cell, and whatever belongs to the viewer is struck through with a fluorescent highlighter.

The system is dense but calm. Surfaces are flat sheets separated by hairlines; saturated colour is spent on the ink (the shell, the primary action, the header band of a date cell) and on state. The public landing page is the same planner at poster scale: an ink-blue sheet ruled with lighter lines, white rows below it, and one highlighter-yellow closing row.

Motion is small and has one signature: a marker band draws in once from the left. Everything else is a 150 ms change of colour, border or shadow.

**Key Characteristics:**

- Time is drawn on planner strips and date cells, with the same content always available as text beside the drawing.
- One variable grotesque, Archivo: condensed and heavy for titles and numerals, normal width for everything else.
- Every time, date and count uses tabular figures.
- Colour carries a job: green free or confirmed, coral busy or wrong, amber warning, yellow yours, ink blue the shell and the action.
- Flat ruled sheets; shadow is a response to hover or a sign that something floats.

## Colors

A cool, blue-tinted palette: one saturated ink, neutrals tinted towards that ink, and four sticker colours.

### Primary

- **Marker Ink** (`brand-700`): the shell. Side rail, the mobile menu panel, the sign-in panel, the landing sheet, the header band of a date cell, the floor tile of an active room, today's header in the week row.
- **Marker Ink, action** (`brand-600`): the primary button, focus outlines on light surfaces, the native accent and caret colour. Darkens to `brand-700` on hover and `brand-800` when pressed.
- **Deep Ink** (`brand-950`): the darkest surface and the darkest text. Toasts, the landing footer, the dialog scrim (55% opacity), text on highlighter yellow, the thin ring (55% opacity) around a highlighter band.
- **Ink tints** (`brand-25` to `brand-500`): `brand-50` fills info alerts, table header rows and checked filter chips; `brand-100` is body text on the ink; `brand-200` to `brand-400` are hover and focus borders on white; `brand-500` is the info dot.

### Secondary

- **Highlighter Yellow** (`mine-400`): the viewer's own bookings (planner bands, the week row's time chips, the "yours" sticker), text selection, the marked cell of the EntryHub mark, and focus outlines on ink surfaces, where the ink-blue outline would vanish. On the landing page it is also the primary action and the closing row.
- **Highlighter wash** (`mine-200`): the row tint of an own booking in the text schedule (60 to 70% opacity).

### Tertiary

- **Free Green** (`success-500` dot, `success-50` label, `success-700` text): free now, confirmed, active, a successful toast.
- **Busy Coral** (`error-500` block and dot, `error-50` label, `error-300` border, `error-700` text, `error-600` destructive button): other people's bookings on a strip, and every error or refusal.
- **Warning Amber** (`warning-500` dot, `warning-50` label, `warning-700` text): inactive rooms and warnings.

### Neutral

- **Laminate** (`gray-25`): the page ground of the app. `gray-50` marks past days, the hour ruler and disabled fields.
- **White**: every cell, card, field and the top bar.
- **Grid line** (`gray-200`): rules inside a sheet and resting card borders. `gray-300` outlines a sheet, a field or a date cell.
- **Text** (`gray-900` primary, `gray-800` labels, `gray-700` large supporting text, `gray-600` secondary text and descriptions, `gray-500` placeholders, past numerals and muted date cells).

### Named Rules

**The Sticker Job Rule.** A sticker colour has one job everywhere: green is free or confirmed, coral is busy or wrong, amber is a warning. State is carried by a dot or block of the 500 shade on a 50 tint with 700 text; never by 500-shade text on white.

**The Highlighter Rule.** In the app, yellow means "yours" (and selected text). It is never a generic accent, a hover colour or a success colour. The landing page alone spends it on the primary action and the closing row.

**The White Cell Rule.** The current place on the ink is a white cell with ink text, not a yellow one. Yellow on the rail is reserved for the focus outline.

**The Signature Rule.** The owner's mookie studio wordmark (red) appears once per surface as a signature: at the foot of the rail and in the landing footer. Its red is never an interface colour and is not a token.

## Typography

**Display Font:** Archivo Variable, condensed (with ui-sans-serif, system-ui fallback)
**Body Font:** Archivo Variable, normal width (same stack)
**Label/Mono Font:** none; times and counts are Archivo with tabular figures

**Character:** One family doing two voices. The planner's header lettering is Archivo squeezed to 78% width at weight 750; everything read at length is the same face at its normal width. Self-hosted through `@fontsource-variable/archivo`.

### Hierarchy

- **Display** (750, 78% width, `clamp(3rem, 9vw, 6rem)`, line-height 0.95): the landing headline and closing line only. Capped near 20 characters per line.
- **Headline** (750, 78% width, 2.25rem at 640px and up, 1.875rem below, line-height 1.25): the one page title of each app screen. Landing row titles use the same voice at 2.25rem to 3rem, line-height 1.
- **Title** (750, 78% width, 1.125rem): section headings inside a page and the tenant name in the top bar; 1.25rem in dialogs.
- **Numeral** (750, 78% width, tabular, 1.5rem to 2.25rem, line-height 1): the day number of a date cell, the week row and the floor tile.
- **Body** (400, 1rem, line-height 1.5): descriptions and form controls; 1.125rem for landing paragraphs. Descriptions are capped at 65ch.
- **Body small** (400 or 500, 0.875rem): metadata lines, hints, alerts, table cells.
- **Label** (600, 0.875rem): buttons, field labels, navigation, row titles (which run at 1rem).
- **Sticker** (600, 0.75rem): badge text.
- **Header band** (600, 0.75rem, letter-spacing 0.05em, uppercase): weekday bands, table column headers and the navigation group label. Inside a date cell and on the hour ruler it drops to 0.6875rem.

### Named Rules

**The Two Voices Rule.** Condensed heavy Archivo is for titles and big numerals; it never sets a paragraph, a button or a label. No second family.

**The Same Figure Width Rule.** Every time, date and count sits on tabular figures, including inside form controls.

**The Header Band Rule.** Uppercase tracked lettering belongs to the planner's own headers: weekday bands, column headers, group labels. It never sits above a heading as a caption.

## Layout

The app is a two-column shell from 1024px: a sticky ink rail 15.5rem wide and a content column with a white top bar. Below 1024px the rail is replaced by a menu button in the top bar that opens the same navigation as an ink panel under it. Content is centred at a maximum of 72rem with 16px side padding (32px from 640px) and 24px top padding (40px from 640px).

A page opens with its title and one-line description on the left and its actions on the right, bottom-aligned, wrapping under the title when there is no room, with 32px below. Sections follow with a condensed 1.125rem heading and 16px below it. Lists of rows use a 12px gap; card grids 16px; form fields stack at 16px with 6px between label, control and hint.

Sheets divide with rules instead of gaps: the week row is one bordered block whose days are separated by vertical lines, a week of strips is one block with horizontal dividers. Time maps to width, so a strip always spans office opening to closing; on narrow screens the hour ruler shows every other hour, and a multi-room board scrolls sideways at a minimum width of 44rem instead of compressing its cells.

The landing page uses an 80rem measure with 20px side padding (32px from 640px). Its opening is the ink sheet with a weekday header band; below it each white row is a 5:7 split from 1024px with a vertical rule between the row's name and its content, and stacks below that width.

## Elevation & Depth

Flat by default. Depth is conveyed by the laminate ground under white cells and by grid lines; a surface at rest has a border, not a shadow.

### Shadow Vocabulary

- **Lift** (`box-shadow: 0 1px 2px rgb(15 23 54 / 0.08), 0 2px 6px -2px rgb(15 23 54 / 0.08)`): filled buttons at rest; cards and rows on hover, together with a border shift to `brand-300`.
- **Float** (`box-shadow: 0 18px 32px -12px rgb(12 18 56 / 0.28), 0 4px 10px -4px rgb(12 18 56 / 0.12)`): toasts and the dialog, the only things that sit above the sheet.

### Named Rules

**The Ruled Sheet Rule.** Cells are separated by lines. Shadow appears only as a response to hover or on a surface that genuinely floats above the page.

## Shapes

Corners are gently eased, never pill-shaped except on stickers. Controls, date cells, strips and navigation items use 0.5rem; cards, sheets, alerts and dialogs 0.625rem; blocks drawn on a strip 0.25rem; badges, dots and filter chips are fully round. Borders are 1px throughout.

The one expressive shape is the highlighter band: a yellow block skewed 12 degrees, shorter than the coral blocks beside it and blended in multiply so the hour ruling shows through it like ink; on white it carries a 1px deep-ink ring at 55% so it does not rely on colour alone. On the ink sheet of the landing the band is plain opaque yellow. The landing headline letters its last words on the same band (skewed 6 degrees, deep-ink text). The decorative bands in the landing hero columns are white at 12 to 20% opacity: full-strength sticker colours are reserved for real states, the headline band and the action. Other people's bookings are plain upright coral blocks.

Icons are an authored set drawn on a 20px grid with a single 1.6px stroke and round caps and joins. They are decorative; a text label always carries the meaning.

## Components

### Buttons

- **Shape:** 0.5rem corners, 10px by 16px padding, 0.875rem semibold label, never wrapping.
- **Primary:** action ink with white text and the Lift shadow. One per view.
- **Secondary:** white with a `gray-300` border and `gray-800` text; hover shifts the border to `brand-400`, the fill to `brand-25` and the text to `brand-800`.
- **Destructive:** `error-600` with white text, darkening to `error-700`; used to confirm a cancellation or deletion.
- **Hover / Focus:** 150 ms colour change; pressed moves 1px down; focus is a 2px `brand-600` outline offset 2px. Disabled is 50% opacity.
- **Landing action:** highlighter yellow with deep-ink text at 12px by 20px, turning white on hover; on the yellow closing row it inverts to `brand-800` with white text. The landing header carries a quiet outlined version (white 50% border on the ink).

### Chips

- **Sticker badge:** a fully round label on a 50 tint with a 6px dot of the 500 shade and 700-shade text, 0.75rem semibold. Tones: gray, success, warning, error, brand, and "mine" (solid highlighter yellow with a deep-ink dot and text).
- **Filter chip:** a fully round white label wrapping a native checkbox; checked takes a `brand-600` border on a `brand-50` fill.

### Cards / Containers

- **Corner Style:** 0.625rem.
- **Background:** white on the laminate ground.
- **Shadow Strategy:** none at rest; Lift on hover for cards that are links (room cards also rise 2px).
- **Border:** 1px `gray-200`; `gray-300` for sheets that hold a grid.
- **Internal Padding:** 20px for a card, 16px for a room card, 12px for a booking row.
- **Empty state:** a dashed `gray-300` outline on translucent white, centred, with a small drawn empty planner, a title, one sentence and one action.
- **Alert:** a tinted box with a 10px sticker dot in place of an icon; info on `brand-50`, the others on their 50 tint.

### Inputs / Fields

- **Style:** white, 1px `gray-300` border, 0.5rem corners, 10px by 12px padding, 1rem text with tabular figures. Label above in 0.875rem semibold; hint below in `gray-600`.
- **Focus:** border and 2px outline in `brand-600`. Hover darkens the border to `gray-400`.
- **Error / Disabled:** an invalid field takes an `error-600` border and replaces its hint with an `error-700` message; disabled sits on `gray-50` with `gray-500` text.

### Navigation

- **Rail:** ink background, EntryHub mark and condensed wordmark at the top, items with a 20px icon and a 0.875rem label in `brand-100`. Hover is a 10% white wash; the current place is a white cell with semibold `brand-900` text. A hairline of 15% white separates the status link; the owner's wordmark sits at the foot.
- **Top bar:** white with a bottom rule; tenant name in the condensed voice on the left, role badge, language select and sign-out on the right.
- **Focus on ink:** a 2px highlighter-yellow outline.

### Date cell

The lead of every booking row and closed day: a white cell 56px wide (80px in its large size) with an ink header band carrying the weekday, the day number in the condensed numeral voice and the month beneath. A cancelled booking mutes it to a gray band and gray text. It is hidden from assistive technology because the full date is always written beside it.

### Planner strip

One day from office opening to closing: an optional hour ruler on `gray-50`, then a 48px strip ruled with a vertical line per hour. Other people's bookings are coral blocks; the viewer's own are highlighter bands. Blocks draw in once from the left (420 ms, `cubic-bezier(0.16, 1, 0.3, 1)`), and not at all under reduced motion. The strip is exposed as a single labelled image and is always paired with the text schedule: a ruled list of the same bookings, each with a coral or deep-ink dot, where an own booking gets the highlighter wash and the "yours" sticker.

### Week row

The home screen's current office week as one ruled block: a column per day with a weekday header band, the day number, and the viewer's bookings as small highlighter time chips. Today's header is filled with ink; past days sit on `gray-50` with gray numerals.

### Toast and dialog

Toasts are deep-ink slips at the bottom right with white text and a sticker dot for success or error. The confirmation dialog is a white sheet with the Float shadow over a deep-ink scrim, a condensed title, and its actions right-aligned with the way back first.

## Do's and Don'ts

### Do:

- **Do** draw a time range on a planner strip and lead a booking with its date cell, and always put the same information next to it as text.
- **Do** use the sticker pattern for state: a dot or block in the 500 shade, a 50 tint behind, 700-shade text.
- **Do** keep yellow for the viewer's own bookings and selected text in the app.
- **Do** set every time, date and count in tabular figures.
- **Do** separate cells of a sheet with 1px rules and keep surfaces flat at rest.
- **Do** use the yellow outline for focus on ink surfaces and the ink outline on light ones.
- **Do** let marker bands draw in once from the left, and keep other transitions at 150 ms (200 ms for the dialog).

### Don't:

- **Don't** use yellow as a generic accent, hover or success colour, or to mark the current navigation item.
- **Don't** use coral for anything that is neither busy nor an error, or green for anything that is neither free nor confirmed.
- **Don't** set paragraphs, buttons or labels in the condensed voice, or add a second typeface.
- **Don't** write state in 500-shade text on white; those shades are for dots and blocks.
- **Don't** take the mookie studio red into the interface, or show the wordmark more than once per surface.
- **Don't** put a shadow on a resting card or stack cards inside cards; rule the sheet instead.
- **Don't** place uppercase tracked captions above headings; that lettering is for planner header bands and column headers.
- **Don't** replay the marker draw on hover or scroll, or animate anything when reduced motion is requested.

## Additions after the finish review

- **Language select on ink.** On the landing header the select takes the ink surface: `brand-700` fill, white text, white border at 50%, `brand-800` on hover, highlighter focus outline. Its height (2.625rem) matches the buttons beside it; form fields share one height (2.875rem).
- **Week sheet.** The week view is one sheet: a sticky hour ruler on top and one tight row per day (date cell, strip without its own ruler, the day's list).
- **Landing board keyboard model.** The board is a single tab stop; arrow keys move between cells (roving tabindex) and Enter or Space books or releases. A pressed busy cell shows a white inset ring and the rule message appears above the grid.
- **Motion staging.** Marker bands draw once from the left in 420ms; `--marker-delay` staggers them (headline first, then the hero columns and the board). Bands inside `[data-inview='false']` wait until their block scrolls into view. Reduced motion disables the draw.
- **Search results.** The slot action sits inside the room card as the primary button.

- **Sticker colours beyond occupancy.** Green and coral keep one meaning each across the product: green is the good state (free, confirmed, active) and coral the blocking one (busy, error). Yellow means only "yours".
- **Load failure.** The alert keeps the page title above it and reads: localized title, a localized recovery line, the server's own text labelled as such, and the retry button.
