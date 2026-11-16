---
version: 1
slug: "src-components-layout-applayout-tsx"
primary_target: "src/components/layout/AppLayout.tsx"
related_targets: ["src/pages","src/components"]
---

# App shell and working screens

Scope: every authenticated screen (home, rooms, room detail and week, search, my bookings, booking detail, reschedule, status, administration) plus login. Visitor mode: Operate.

Audience and job: employees booking a room in about a minute between other work; Facilities managing rooms, bookings and closed days. Constraints: existing copy, behaviour, accessibility and tests are preserved; standard web controls only.

Memorable moment: your own bookings look highlighted with a fluorescent marker on a wall planner.

Unresolved: none. Copy constraint: week-day headings keep the ISO date ("Martes 2030-01-15") because existing tests and copy are preserved by the owner's scope; the date cell beside them carries the readable date.

## Direction contract

THESIS: Office time is seen, not read: every time range is drawn on a planner strip and every booking leads with its date cell. Refuses the category default of grey cards with one blue accent and text-only dates.

OWN-WORLD: The office wall planner. Cool laminate-white ground, white cells ruled with blue-grey grid lines, a saturated marker-ink blue rail and primary action, sticker colours with jobs (green free, coral busy, amber warning), fluorescent yellow for "yours" and for text selection. One variable-width grotesque: condensed and heavy for titles and numerals, normal width for text; tabular figures for every time.

STORY: The visitor sees when and where at a glance, trusts the state colours, books and leaves.

FIRST VIEWPORT: Ink-blue side rail with wordmark and icon navigation; top bar with tenant, role, language and sign out; page title in condensed bold; home shows the current office week as a row of planner cells (today marked, own bookings as highlighted times) above upcoming bookings, each led by a date cell. Primary action "Buscar sala libre" top right.

FORM: Wall planner, candidate 4 of 7 on the grounded list; seed:822e952eebb4a70d (degraded roll, no challengers). Signature move: date cells plus planner strips with marker bands, own bookings in highlighter. Motion grammar: 150 to 200 ms state transitions; marker bands draw in once from the left.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
