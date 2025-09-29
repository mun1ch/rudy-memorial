---

# Cursor Rules — Memorial Site (Next.js + Tailwind + Supabase)

**Prime directive:** Deliver a production-grade memorial website with elegant UX, strong data integrity, and maintainable code. Build decisively. No placeholders, no partial stubs, no “TODO later.” Ship quality.

## 0) Execution Behavior (for the Agent)

* **Do not ask for clarification** if reasonable assumptions can be made; implement with best practices.
* **No fallbacks / no placeholders:** If something is unspecified, choose a sane, production-ready default and implement it.
* **Never suppress real errors.** Never `catch` and ignore. If catching, **add context and rethrow**.
* **Security first:** Treat all external input as untrusted; validate aggressively server-side.
* **Idempotent scripts:** Setup/migration scripts must be re-runnable without breaking the environment.
* **Atomic commits:** Each commit should compile, pass tests, and migrate cleanly.

---

## 1) Tech Stack & Project Constraints

* **Framework:** Next.js 14+ (App Router, `/app` directory, Server Components where sensible)
* **Language:** TypeScript strict mode (`"strict": true`)
* **Styling:** Tailwind CSS + CSS Modules for component-local tweaks
* **Data:** Supabase (Postgres, Auth, Storage)
* **ORM & Validation:** Drizzle ORM (for portability) + Zod (runtime validation)
* **Images:** `next/image` + `sharp` (optimize, strip EXIF, generate responsive sizes)
* **Testing:** Vitest + Testing Library (unit) and Playwright (e2e)
* **CI:** GitHub Actions (typecheck, lint, unit, e2e on PR)
* **Lint/Format:** ESLint + Prettier (zero warnings)
* **Accessibility:** axe checks in e2e for core pages

---

## 2) Repository Layout

```
/app
  /(public)           # public routes (home, gallery, tributes)
  /(admin)            # protected moderation dashboard
  /api                # route handlers (only where Server Actions not suitable)
  globals.css
  layout.tsx
  page.tsx
/components
  /ui                 # base primitives (Button, Card, Dialog, Input, etc.)
  /features           # domain components (GalleryGrid, TributeForm, ...)
  /layout             # Nav, Footer, Shell, ...
/db
  schema.ts           # Drizzle schema
  drizzle.config.ts
/lib
  supabase/server.ts  # server client (cookies from headers)
  supabase/client.ts  # browser client (limited)
  auth.ts             # helpers for session, RLS-safe access
  images.ts           # HEIC->JPEG, strip EXIF, create thumbs
  validation.ts       # zod schemas
  rate-limit.ts
  logger.ts
/policies             # SQL RLS policies for Supabase
/public
/scripts
  seed.ts             # safe, idempotent seed
  export.ts           # export ZIP/CSV
/tests
  /unit
  /e2e
  /fixtures
.env.example
cursor-rules.md
```

---

## 3) Core Features (MUST Implement)

1. **Home/Hero**

   * Hero with name, dates, short message, and prominent CTA to view gallery / share memories.
   * Lighthouse ≥ 95 (Performance/Best Practices/SEO/Accessibility).

2. **Photo Gallery**

   * Grid with responsive breakpoints, lazy loading, and **accessible lightbox** (keyboard navigation, captions).
   * Uploads (HEIC/HEIF/JPEG/PNG/MP4 short clips) via **signed uploads** to Supabase Storage.
   * Server-side processing: convert HEIC→JPEG, strip EXIF, generate thumbnails; store normalized metadata (title, caption, contributor, uploadAt).
   * Display uses `next/image` with `sizes` and proper `alt`.

3. **Memory Wall (Tributes)**

   * Form: name (optional), email (optional), message (required), optional image.
   * Server Actions: validate input (Zod), rate-limit, write to DB **as `pending`**.
   * Public wall shows **approved** posts only; admin approves/rejects.

4. **Auth & Moderation**

   * Magic-link auth (Supabase) for contributors; **admin role** gated by email allowlist env var.
   * Admin dashboard: review queue, approve/reject tributes & photos, soft-delete, restore.

5. **Backups & Export**

   * `/scripts/export.ts` to bundle all images + JSON/CSV of tributes into a ZIP.
   * **Daily automated DB dump** instructions; R2/S3 option documented.

6. **Content Safety**

   * Cloudflare Turnstile (or reCAPTCHA) on public forms.
   * Basic NSFW image check (hash/size heuristics; do not upload to external services).
   * Rate limiting (IP + session) on write routes.

---

## 4) Data Model (Drizzle)

```ts
// /db/schema.ts
import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const contributors = pgTable("contributors", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const photos = pgTable("photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  storagePath: text("storage_path").notNull(),
  thumbPath: text("thumb_path").notNull(),
  caption: text("caption"),
  contributorId: uuid("contributor_id").references(() => contributors.id),
  width: text("width"),
  height: text("height"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  approved: boolean("approved").default(false).notNull(),
});

export const tributes = pgTable("tributes", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayName: text("display_name"),
  message: text("message").notNull(),
  contributorId: uuid("contributor_id").references(() => contributors.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  approved: boolean("approved").default(false).notNull(),
});
```

**Rules:**

* No nullable booleans for status flags; default to `false` and flip via moderation.
* Timestamps always with timezone; set by DB default, not app code.

---

## 5) Supabase Setup & RLS (Required)

* **Buckets:** `photos` (private), `photos-thumbs` (private). Only signed URLs for public display.
* **RLS:** Enable RLS on all tables. Policies:

  * Public can **insert** tributes/photos with rate limiting; **no direct select** of unapproved rows.
  * Admins can select/update all; non-admins can only read **approved = true**.
* Add SQL under `/policies/*.sql`, with clear names and comments.
* **Never** expose service role key client-side.

---

## 6) API & Server Actions

* Prefer **Server Actions** for form submissions; fall back to Route Handlers only if needed.
* **Validation:** Zod on inputs; map to typed DTOs; server-side validate again (never trust client).
* **Error handling:**

  * **Never swallow errors.** If you `catch`, do:

    ```ts
    } catch (err) {
      logger.error({ err }, "Failed to create tribute");
      throw err; // rethrow after logging with context
    }
    ```
  * No “best-effort” fallbacks. Fail fast and clearly.

---

## 7) UI & Accessibility

* Tailwind for layout & spacing; keep classes readable (extract to `@apply` or components when long).
* **Keyboard and screen-reader support** for modals, lightbox, and interactive widgets.
* Reduce motion when user prefers-reduced-motion.
* Ensure color contrast ≥ WCAG AA.
* Use semantic HTML (figure/figcaption for images, time elements for dates, etc.).

---

## 8) Images & Media

* On upload:

  * Convert HEIC/HEIF → JPEG.
  * Strip EXIF.
  * Generate thumbnail (`max 640px` longest side).
* On render:

  * `next/image` with meaningful `alt`; set `sizes` for responsive layouts.
  * Use **signed URLs** with short TTL; refresh server-side as needed.

---

## 9) Testing Requirements

* **Unit (Vitest)**: Components (render, a11y roles), lib functions, server actions (with mocked DB).
* **E2E (Playwright):** Core flows: submit tribute, admin approve, upload photo, lightbox nav, signed URL render.
* **Coverage:** `--coverage` ≥ 85% lines/branches for `/lib` and `/components/features`. Do not exclude files to cheat.
* **A11y:** Run basic axe assertions on key pages in e2e.
* **No flaky tests.** Use test IDs only when necessary; prefer role/label queries.

---

## 10) CI / Quality Gates

* GitHub Actions workflow must:

  1. Install deps, cache pnpm.
  2. `pnpm typecheck` (no `any` escapes), `pnpm lint`, `pnpm test`, `pnpm test:e2e` (headless).
  3. Block merge on any failure or coverage drop below thresholds.
* ESLint: no warnings; treat warnings as errors.

---

## 11) Performance & SEO

* Use App Router streaming for initial content.
* Generate `metadata` and `openGraph` tags; include social preview image.
* Preload critical fonts (system stack preferred; if custom, use `next/font` with `display: swap`).
* Avoid client components unless interaction is required.

---

## 12) Security

* **Env management:** All secrets in `.env.local` only; reference via server runtime only.
* **CSRF & Abuse:** Turnstile/reCAPTCHA on public forms, IP + session rate limit, server-side validation always.
* **Headers:** Add security headers (CSP with `next-safe-middleware` or manual), no inline scripts except hashes.

---

## 13) Observability & Logging

* `logger.ts` with structured logs (pino or console shim). Include request IDs in server actions.
* Log only necessary context; **never** log secrets, tokens, or PII.

---

## 14) Backups & Export

* `/scripts/export.ts`:

  * Export JSON/CSV of tributes (approved and pending).
  * Zip photos + thumbs with manifest.
* Document daily DB dump via Supabase (or `pg_dump`) and optional S3/R2 storage rotation.

---

## 15) Definition of Done (each feature)

* [ ] Type-safe end-to-end (types flow from schema → zod → UI).
* [ ] Validated server-side; meaningful error paths; **no swallowed exceptions**.
* [ ] Unit tests + e2e added; coverage maintained.
* [ ] a11y pass for interactive pieces.
* [ ] Lighthouse ≥ 95 (P/SEO/A11y/Best Practices) for main pages.
* [ ] RLS policies exist, named, and tested.
* [ ] Docs updated (README section for feature).

---

## 16) Commands (pnpm)

```bash
pnpm dev            # local dev
pnpm build          # CI build
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint
pnpm test           # vitest
pnpm test:e2e       # playwright test
pnpm db:generate    # drizzle-kit generate
pnpm db:migrate     # drizzle-kit migrate
pnpm seed           # tsx scripts/seed.ts
pnpm export:zip     # tsx scripts/export.ts
```

---

## 17) Non-Negotiables

* **No fallbacks, no “temporary” code.**
* **Never catch and ignore real exceptions.** Catch only to add context and **rethrow**.
* **Strict TypeScript, zero ESLint warnings, high test coverage.**
* **Every PR is deployable.**

---

### Notes for future contributors

If a requirement is ambiguous, pick a solution that:

1. preserves data integrity, 2) is easiest to maintain, 3) is secure by default, and 4) improves accessibility.

---

If you want, I can also drop in a ready-to-go repo scaffold that follows these rules (with tests, CI, policies, and basic pages wired).
