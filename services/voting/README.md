# Shared recommendation service

The canonical voting Site is https://farm-bx-showcase.james8101.chatgpt.site with API `/api/votes`.
Sites project: `appgprj_6af438f56164819193911c20e6dc0a99`. Preserve this project and its existing D1 binding when updating.

## Current policy

One authenticated ChatGPT account may recommend each project once, and may recommend any or all four different projects. Votes cannot be withdrawn in this release. Counts represent distinct recommending accounts per project, not a single-choice ballot or the final business decision. Different accounts are not proof of distinct natural people.

The Site remains publicly readable. Voting alone requires the platform sign-in flow. Start sign-in through a normal top-level anchor to `/signin-with-chatgpt?return_to=…` using a same-origin return path. Do not implement another OAuth provider or accept client-supplied identity.

- GET returns `counts`, `authenticated`, `votedBrands`, `duplicateVotesAllowed:false`, and `multipleProjectsAllowed:true`.
- Anonymous GET exposes aggregate counts only. Known GitHub Pages origin may read these counts without credentials.
- Authenticated GET adds the current account’s voted project slugs. It is not CORS-enabled and all responses use `Cache-Control: private, no-store`.
- POST accepts `{brand}` only as vote input. The server obtains identity exclusively from Sites dispatch’s authenticated user header and stores a SHA-256-derived opaque key.
- The composite primary key `(voter_id, brand)` in `brand_recommendations` guarantees at most one recommendation per account/project, including concurrent requests, retries, page reloads, and another device signed into the same account.
- POST is same-origin and rejects missing authenticated identity with 401. Cross-origin voting, including from GitHub Pages, is rejected. The GitHub showcase sends visitors to the matching canonical project for voting, avoiding third-party-cookie dependence.
- No account email, display name, IP address, browser fingerprint, or application-managed login token is stored. The application has no public reset/delete operation.

## Migration and old data

Keep applied migrations immutable. `0001_brand_recommendations.sql` is a review copy of the new Sites migration. Apply the append-only migration through the Sites publishing workflow.

The earlier `brand_votes` table recorded anonymous click events. Those rows cannot establish which account voted and therefore cannot be fairly deduplicated. Preserve the table and its rows as historical records; corrected public totals are drawn exclusively from `brand_recommendations`. Do not fabricate identities, carry anonymous clicks into account counts, or delete the old records.

## Source and release

The executable Site source is managed by Sites; `route.ts`, `schema.ts`, and SQL in this directory are aligned release review copies. Apply server changes to the same Site, run `npm run db:generate`, review appended SQL/Drizzle metadata, validate, and publish through the source helper.

Shared UI source: `src/showcase/ShowcaseApp.tsx` and `showcase.css`. The canonical Site uses `apiBase="/api/votes"`; GitHub Pages uses the public API URL for aggregate reads. Both use `content/portfolio-data.json` and the curated `public/portfolio-v15` assets. Local preview data and hosted data remain separate.
