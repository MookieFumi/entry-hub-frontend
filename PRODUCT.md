# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Employees** of an office: they book a meeting room for a time slot, check their upcoming bookings, reschedule or cancel. Usually a quick task between other work, on desktop or phone.
- **Facilities team**: they manage the room catalog (create, edit, deactivate), see everyone's bookings, cancel when needed and set closed days.
- **Landing-page audience (confirmed by the owner):** office and Facilities managers at companies who could adopt EntryHub to manage their rooms.

## Product Purpose

EntryHub is a room-booking product: an API (`mookie-studio/entry-hub`, .NET) and this React frontend. People find a free room and book a slot in about a minute; the office's rules are enforced by the system instead of by etiquette. Success: a booking made without conflicts or doubts, and a Facilities team that does not have to arbitrate.

## Positioning

The office's rules are part of the product and are shown in plain language at the moment of booking: opening days and hours in the office time zone, slot size, minimum and maximum duration, lead time, cancellation notice, a per-person limit of active bookings, closed days and room capacity. Occupancy is live ("free now / busy now until…").

## Operating Context

- Multi-tenant: each account belongs to a client (tenant); roles are Employee and Facilities.
- Times are always shown in the office time zone, whatever the viewer's zone.
- Rooms have a floor, a capacity, equipment (for example TV) and accessibility features (for example step-free access); both are filters.
- Current deployment is a minimal-cost demo (v1.0.0): the free server sleeps and the first request can be slow (there is a Status page for it). Accounts are created by the administrator.

## Capabilities and Constraints

- Room catalog with filters (floor, minimum capacity, equipment, accessibility); room detail with the day's occupancy, week view and booking form.
- Availability search for a concrete slot; my bookings (upcoming, past, cancelled); booking detail; reschedule; cancel with confirmation.
- Administration (Facilities): rooms, all bookings, closed days.
- Interface in Spanish (default) and English; message catalogs must keep identical keys. Code, identifiers and URLs in English.
- Stack: Vite, React 19, strict TypeScript, Tailwind CSS 4, Base UI (unstyled), TanStack Query. No Untitled UI code may be copied (public repository).
- Redesign scope confirmed by the owner: a full visual redesign with recomposed layouts; functions, existing copy, accessibility and the test suites are preserved.
- Undecided: pricing, licensing terms for companies, hosting offer, contact or sales channel.

## Brand Commitments

- The name **EntryHub** stays. Colour, typography and logo are open (confirmed by the owner).

## Evidence on Hand

- The working app itself and its simulated API (`e2e/fake-api.ts`) for demonstrations.
- Public repositories on GitHub (`mookie-studio/entry-hub`, `mookie-studio/entry-hub-frontend`).
- No customers, testimonials, usage figures, benchmarks or prices exist; future work must not invent them.

## Product Principles

1. Booking is a one-minute task: the fastest path to a confirmed slot wins.
2. The rules are visible before they are broken, in plain language.
3. Time is unambiguous: always the office's zone, always the slot grid.
4. Facilities governs without policing: the system says no, not a person.

## Accessibility & Inclusion

- Keyboard-first operation, visible focus and a skip link already exist and must stay.
- Playwright + axe checks must report no serious violations on the key screens.
