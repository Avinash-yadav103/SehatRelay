# Hosted synthetic demo

SehatRelay's Vercel project is `avinash-yadav103s-projects/sehatrelay`, running Next.js 15.5.29 and Node 22. Production uses the connected Neon Postgres database; release status and executed checks are recorded in VALIDATION.md.

## No-key startup for reviewers

```
docker compose up --build
```

Open http://localhost:3000. Docker uses file storage in a named volume and creates a stable local demo signing key automatically. No .env file is required. The main screen, Tara predefined example, editable manual notes, SunoSure and referral handoff work without paid services. The original narrative remains editable. Other narratives require configured AI extraction or manual entry. Browser microphone input requires browser support, permission and usually network access; installed Wispr Flow is a separate product.

Docker Engine was unavailable in the implementation environment. The production Next build/start and HTTP workflow were tested; the actual container command must still be checked on a machine with Docker.

## Hosted configuration

- `RELAY_STORAGE=postgres`
- `DATABASE_URL`: provider-managed server credential for the connected Neon database. Never expose it through NEXT_PUBLIC variables or commit it.
- `RELAY_SESSION_SECRET`: generated stable production signing secret, stored as a Vercel Secret. It separates this public synthetic role demo from other workspaces; it is not production user authentication.
- Optional AI: `SEHAT_AI_PROVIDER`, `SEHAT_AI_MODEL`, plus `AI_GATEWAY_API_KEY`, or the compatible-provider endpoint/key documented in structured-extraction.md. No AI credential is required to load the app or use manual/sample modes. Providers may charge for extraction. No live model is claimed tested without credentials.

The hosted build stops if storage or signing configuration is missing. It applies db/migrations/001-synthetic-referrals.sql idempotently and runs tests/storage.test.mjs against REAL Postgres before compiling/releasing the application. Failures stop the build. The tests create isolated fictional records, check concurrent saves, duplicate submission, workspace isolation, status transitions and reads from an independent Node process.

Migration does not import local JSON records into the cloud. Localhost and the live domain have different signed cookies/workspaces. Use the same browser profile to switch between ASHA and clinician for a complete demo. Clearing cookies loses access to that workspace. Records remain in the store; this is a synthetic prototype, not account recovery.

The Postgres adapter uses one JSONB row per referral with indexed workspace/status columns, revisions, parameterized queries and row locks. Every status/timeline/revision update commits together. Stale drafts produce HTTP 409; the local edited draft stays available. Reads do not rewrite records. Vercel never falls back to disk. Local file storage supports only one Node process, not multiple replicas.

Production and Preview currently share the provider-created synthetic database. Use a separate database/branch and distinct signing secret before enabling a preview workflow. Development credential rescoping was rejected by Vercel because the provider variables are Secrets. Production Secrets cannot be downloaded by env pull; the hosted build performs migration/testing without exposing them locally.

## Publication

The linked project uses `npm ci --legacy-peer-deps --no-audit --no-fund` and `npm run build`. A production build is staged with `vercel deploy --prod --skip-domain --regions sin1`, tested, then promoted. Do not deploy a file-only version to Vercel.

The legacy Firebase/MongoDB/Express services were not provisioned by this deployment. Their existing setup is documented in README.md; a deployed frontend does not make every legacy integration live.

## Submission checklist supplied by organizers

- Public source repository; Docker Compose one-command, no-key main screen.
- At least roughly 300 lines of original hackathon implementation: inspect source/commit history, excluding generated lockfiles and templates.
- Public/unlisted YouTube demo, at most three minutes: still requires recording/upload.
- Text-readable PDF pitch: still requires preparation/submission.
- Live link is optional; this task prepares and verifies it.
- One submission, deadline supplied as 30 November, 11:59 pm. Confirm timezone/year with organizers; the text supplied does not specify them.
- Whether this round accepts installed-app Wispr text insertion as evidence of building with Flow remains unverified. Browser microphone is not Wispr.

Deployment notes: Vercel project `sehatrelay`, production URL https://sehatrelay-avinash-yadav103s-projects.vercel.app. SSO Deployment Protection is disabled so judges can open the link. Hosted DB build gate passed. Latest live HTTP checks cover 38 routes and the referral handoff. User supplied requested Next.js version upgrade approval. See VALIDATION.md for the deployed commit and follow-up status.
