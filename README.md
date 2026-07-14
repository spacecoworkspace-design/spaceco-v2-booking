# spaceco-v2-booking

Room booking system — logged-in clients (auto-filled, tagged with Client ID) and guests (manual entry, tagged "Guest" until claimed).

Static HTML/CSS/JS, deployed via GitHub Pages, no build step. Public repo (required for free-plan Pages).

Status: **scaffolded only (Phase 1 — Foundation setup). No feature pages built yet.**

Before writing any page, copy `shared-config/supabase-client.js` from `spaceco-v2-shared` into this repo rather than creating a new Supabase client inline. Same-origin auth session sharing with `spaceco-v2-website` needs to be re-verified once both are live (it worked in the old system because both repos published under the same `spacecoworkspace-design.github.io` origin — confirm the new repos do too).
