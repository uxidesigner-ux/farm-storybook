# Shared recommendation service

The showcase is hosted with Sites and Cloudflare D1. The public origin is https://farm-bx-showcase.james8101.chatgpt.site and the API is `/api/votes`.

Sites project ID: `appgprj_6af438f56164819193911c20e6dc0a99`.

The deployment's source is managed by Sites. The route and schema in this directory are a review copy of the release in this repository. Apply changes to the same Sites project, regenerate migrations and publish through its source workflow. Do not create a second Site or database when updating the service. Keep these release copies aligned with deployment.

- GET returns all four persisted counts. Responses are not cached.
- POST accepts a known brand and a random UUID `requestId`. A new click creates a new ID and counts again. A retry uses the same ID and is counted once.
- Counts mean vote events, not unique people.
- No visitor ID, account, IP address, or cookie is recorded by the application.
- There is no public reset or delete operation.
- CORS permits the published GitHub Pages origin and this Site.
- Local preview data and hosted data are separate.

UI source: `src/showcase/ShowcaseApp.tsx` and `showcase.css`. The Site uses the same files and `content/portfolio-data.json`, with `apiBase="/api/votes"`. GitHub Pages uses the absolute public API address. Copy the curated `public/portfolio-v15` assets when updating the Site.
