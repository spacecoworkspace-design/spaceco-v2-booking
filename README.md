# spaceco-v2-booking

Room booking system — logged-in clients (auto-filled, tagged with Client ID) and guests (manual entry, tagged "Guest" until claimed).

Static HTML/CSS/JS, deployed via GitHub Pages, no build step. Public repo (required for free-plan Pages).

Status: **Phase 9 done.** Flow: `select-room.html` → `select-time.html` → `booking-details.html` → `booking-confirmed.html`, plus `my-bookings.html` for signed-in clients to view/cancel. No payment step — bookings insert as `status = 'pending'` for staff to confirm; there's no pricing model in the schema to build a payment flow against.

Same-origin session sharing with `spaceco-v2-website` confirmed working (both publish under `spacecoworkspace-design.github.io`, so a client signed in on the website is already recognized here).

Availability is read through the `get_room_busy_periods()` function (schema in `spaceco-v2-shared`) rather than querying `room_blocks`/`reservations` directly — `room_blocks` is staff-only, and the function returns just busy time ranges, never raw rows or other people's names/phone numbers. A database trigger (`check_reservation_conflict`) rejects overlapping bookings for the same room even if two people submit at nearly the same time, so this isn't just a UI-level check.
