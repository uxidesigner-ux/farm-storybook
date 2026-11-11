# Shared recommendation service

The API is `https://farm-bx-showcase.james8101.chatgpt.site/api/votes`.
Sites project: `appgprj_6af438f56164819193911c20e6dc0a99`. Preserve the existing Site and its D1 binding when updating.

## Current policy

Browsing, recommending, and withdrawing a recommendation require no login. Each of the four projects is independent: click to recommend, click the selected button to withdraw, and click again to recommend again. A browser/project pair has at most one active recommendation at a time. Both the GitHub Pages showcase and the Sites showcase operate in place; neither sends visitors to a sign-in screen or another origin to vote.

The browser stores a persistent UUIDv4 and server-confirmed project states in `localStorage`. The server hashes the UUID for the `(browser_id, brand)` primary key in `browser_recommendations`. This is a browser record, not verified personal or account identity. No email, name, application login token, or fingerprint is required for new recommendations.

GitHub Pages and Sites have separate origin-scoped local storage. Clearing site data, a private session, a different browser/device, or another origin can create another browser record and recommendation. Do not describe the totals as unique people or promise cross-device identity. If storage is blocked or the UUID cannot be durably written/read, the UI must show a retryable storage error and must not submit votes using a temporary unpersisted ID.

## API contract

Use `X-Farm-Browser-Id` with the persisted UUIDv4. The browser ID is not an authentication credential and does not establish who the visitor is.

| Request | Input | Result |
| --- | --- | --- |
| `GET /api/votes` | Browser header optional | Shared `counts`; `votedBrands` for the provided browser ID, or `[]` without one |
| `POST /api/votes` | Browser header required; JSON `{ "brand": "onari", "recommended": true }` | Ensure this browser/project is recommended |
| `POST /api/votes` | Browser header required; JSON `{ "brand": "onari", "recommended": false }` | Ensure this browser/project is not recommended |
| `OPTIONS /api/votes` | Allowed origin, method, and requested headers | CORS preflight for `GET`, `POST`, `OPTIONS`, `Content-Type`, and `X-Farm-Browser-Id` |

Both GET and POST return `identityMode: "browser"`, `toggleVotesAllowed: true`, `duplicateVotesAllowed: false`, `multipleProjectsAllowed: true`, `counts`, and `votedBrands`. `authenticated: false` remains a compatibility field and does not restrict participation. POST also returns `changed` and the final `recommended` state.

POST specifies the desired state; it does not ask the server to blindly toggle. Replaying `true` after an insert or `false` after a removal makes no further count change. A removal targets only that browser hash and project. Update the UI and stored confirmed state from the server response. Celebrate only when `changed === true && recommended === true`; removal, an idempotent retry, GET, reconciliation, and errors must not trigger the animation.

Allowed public origins are `https://uxidesigner-ux.github.io` and `https://farm-bx-showcase.james8101.chatgpt.site`, plus the request's own origin. Cross-origin participation uses the browser header without cookies or credentials. Responses use `Cache-Control: private, no-store, max-age=0` and vary by `Origin` and `X-Farm-Browser-Id`. Do not expose per-browser responses through shared caching.

Malformed or missing browser IDs, invalid brand/state bodies, non-JSON content, excessive bodies, disallowed POST origins, and unavailable storage are errors. The UI must retain a recoverable state and must not report failed operations as successful.

## Migration and data continuity

Keep applied migrations immutable. The append-only Sites migration is `drizzle/0002_broken_maelstrom.sql`; its review mirror is `services/voting/0002_browser_recommendations.sql`. It creates `browser_recommendations(browser_id, brand)` with a composite primary key and a brand index. Apply it through the same Sites publishing workflow and existing D1 binding.

Current totals combine the rows in `browser_recommendations` with the existing account recommendations in `brand_recommendations`. Preserve those account rows and their contribution to totals. A browser withdrawal must not delete account rows or another browser's rows, and account records must not be attributed to a browser.

The earlier `brand_votes` table recorded anonymous click events. Preserve it as historical raw data but exclude it from current totals. Do not collapse these three data sources into an invented unique-person count or erase prior rows to make a migration appear clean. Local preview data and production data remain separate.

## Source and release

The executable Site source is managed by Sites; `route.ts`, `schema.ts`, and SQL in this directory are aligned review copies. Apply server changes to the existing Site, use `npm run db:generate` for appended migrations, review SQL and metadata, validate, and publish through the source workflow.

Shared UI source: `src/showcase/ShowcaseApp.tsx` and `showcase.css`. Sites uses `apiBase="/api/votes"`; GitHub Pages calls the public API URL for both reads and writes. Both use the curated portfolio assets. Source alignment or an older account-based test run does not prove the new browser toggle has passed testing or deployment. Record that evidence under worklog step 42.

Run `node services/voting/verify.mjs` (Node 24+) for 17 isolated SQLite handler checks. It does not access the network or production data. The check is included in `npm run check`.
