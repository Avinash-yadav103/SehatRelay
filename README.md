# SehatRelay — voice-first visit handoffs

SehatRelay extends the copied CareFolio application for the Scaler × Wispr Flow “India Runs on Voice” hackathon. An ASHA worker documents a **synthetic** visit, reviews an editable note with SunoSure, and submits a referral for clinician acknowledgement. It provides no diagnosis, treatment, prescription, or automated triage.

## Repository inspection and scope

CareFolio already contained Next.js 15.2.4 / React 19, Tailwind and Radix components; patient, doctor, government and student dashboards; Firebase client/auth helpers; separate Express/MongoDB medical-record, appointment and access-control services; and Aadhaar-oriented services. Those routes remain. Their configuration and full behavior were not independently validated. The existing medical-record API calls `verifyIdToken` on a Firebase client auth object: this needs a separate production authentication repair. Legacy build configuration suppresses TypeScript and lint errors. No existing test suite, referral model, Wispr workflow, SunoSure implementation or official hackathon problem statement was found.

The new, isolated `/relay` route uses the existing App Router and teal healthcare styling. A link is available in the CareFolio landing navigation. It does not connect fictional demo records to Aadhaar or legacy patient records. Previous README claims about HIPAA compliance and end-to-end encryption were unsupported and have been removed.

## Local setup

Use Node.js 22 or later and npm:

```sh
npm install --legacy-peer-deps
npm run dev
```

Open http://localhost:3000/relay. No external accounts, database, AI keys or Firebase configuration are required for this route. Optional server environment variable: `RELAY_SESSION_SECRET` (a long random secret) stabilizes signed demo cookies across server restarts. Without it sessions expire on process restart; selecting a role again creates a new workspace, so old records remain on disk but are not accessible through that new session. Set this variable before the demo to preserve workspace access across restarts. Do not use a `NEXT_PUBLIC_` secret.

Other CareFolio routes still require their original services: Firebase public configuration variables in `lib/firebase.ts`, MongoDB via `MONGODB_URI`, and the appropriate backend servers/dependencies. See each backend's package.json. These are not needed for the isolated demo.

## Architecture, persistence and permissions

- `app/relay`: accessible native forms, mobile layout, worker workspace, overview, clinician inbox and timeline.
- `lib/relay/model.ts`: exact synthetic fixture, blank manual template and completeness/source checks.
- `app/api/relay`: server request validation, same-origin mutations, signed HttpOnly SameSite demo cookie, ASHA/clinician permission checks and workspace isolation.
- `lib/relay/server.ts`: serialized writes and atomic replacement in `.relay-data/records.json`, ignored by Git. Survives browser refresh and local server restarts; use a persistent disk and a single Node process. This is **not suitable for serverless, multiple processes or production**. No MongoDB migration was introduced.
- Device drafts use browser localStorage, contain synthetic narratives/notes, and recover after refresh. Submission removes the local draft. Clear device draft removes only local data; it does not delete server referrals. For a complete reset, stop the server and remove `.relay-data/records.json` manually. Storage/sync failures appear visibly; only draft recovery works offline.
- Demo role selection is intentionally public and permits both fictional roles in the same browser workspace. It is not identity verification. Production needs real server-verified identity, tenant membership, durable database transactions, privacy review, encryption/access policies and retention controls. Do not deploy this prototype for real patient care.

Transitions: draft → submitted → acknowledged → follow-up → closed; acknowledged can also close directly. Submitted notes are immutable. Resubmitting an existing submitted ID returns that record without a duplicate. Clinician actions require a review note. Stale or illegal transitions return 409. Clinician inbox excludes drafts. Dashboard counts use server records in the current workspace; unsynced local drafts are excluded. Use Refresh records to see changes.

## Wispr Flow — exact manual steps

1. Install and sign in to Wispr Flow from https://wisprflow.ai/ on your supported device.
2. Open `/relay`, choose **ASHA worker**, and start a synthetic visit.
3. Select **Dictate with Wispr Flow**. It focuses the standard Visit narrative textarea and displays instructions.
4. With the cursor in that field, invoke the shortcut or mobile keyboard configured in **your installed Flow app**. Speak the fictional narrative below.
5. Stop dictation using Flow, inspect the inserted text, and edit it. Check Hindi script, punctuation and clinical meaning yourself.
6. Add another sentence at the caret, edit a word, refresh, and confirm that the entire draft recovers. Confirm caret/focus stays in the textarea during insertion.
7. Generate the structured note, review each field, and continue the demo.

The button does not start, control, detect or authenticate Flow. This application receives ordinary text input, retains the source script, and records no audio. It reads no background clipboard, keystrokes or screen. There is no in-app transcription provider in the new workflow and no “Wispr API” connection badge.

Official developer page checked: https://wisprflow.ai/developers describes app/website dictation. Direct speech API authorization, credentials and applicable terms were **not verified** for this project, so no direct API/SDK was implemented. An official MCP listing for notes/context is not proof of authorized speech-to-text API access. Actual installed Wispr dictation has **not been manually tested** in this environment; follow the steps above on your machine.

## Note generation and SunoSure

No external AI integration is configured or required. The exact supplied fixture returns predefined source-linked fields, labeled as a synthetic example. Any other narrative returns a blank manual template, labeled clearly. Even minor changes to the fixture require manual entry. This deliberately does not pretend to understand arbitrary Hindi, English or Hinglish clinical text. Source text remains untouched. Generation replaces note fields; do it before editing them.

SunoSure flags missing fields, absent duration, unmatched excerpts/user-entered details, and differing ages written as numbers followed by “years old”, “saal” or “वर्ष”. It is a limited textual check, not exhaustive conflict detection or medical validation. No numeric confidence scores. Every field needs explicit worker confirmation, including unknown values, before submission; patient identifier, facility and referral reason must be filled. Editing a field or the narrative clears verification. Source excerpts and the full narrative remain visible to the clinician.

## Complete synthetic demo script

1. Choose ASHA worker → Start a synthetic visit → Dictate with Wispr Flow.
2. Dictate or use the explicitly labeled fictional example:
   > Demo patient Tara-01. Aaj pregnancy follow-up visit hai. Patient ne thakan batayi. Pregnancy 24 weeks hai. Clinician review ke liye referral chahiye.
3. Review the narrative. For predefined extraction, use **Use fictional Tara-01 example** to ensure exact fixture text, then Generate structured note.
4. Inspect the source for the reported concern and pregnancy context. SunoSure flags missing duration. Confirm duration as unknown; do not invent it. Enter the visit date and preferred language only as demo user input. Enter receiving facility “Demo PHC”. Correct any field if needed and verify each field, including unknowns.
5. Save server draft, then Submit reviewed referral. Show the submitted timeline event.
6. Switch to Clinician → Referrals → open Tara-01. Read source and note. Enter “Synthetic source and note reviewed; acknowledgement recorded.” Mark acknowledged.
7. Add a fictional follow-up note and mark follow-up if desired. Switch to ASHA → Referrals and show persisted timeline and overview counts.

This scripted example demonstrates workflow only, not clinical accuracy or multilingual performance.

## Validation

```sh
npm run build
npm start
node --test tests/relay.test.mjs
npx tsc --noEmit --pretty false
```

The API test creates synthetic records and checks unauthorized requests, invalid roles, missing-field validation, sample/manual generation, draft save, submission verification, duplicate handling, clinician permission checks, transition guards, workspace isolation and persisted acknowledgement. Set `RELAY_TEST_URL` if using another origin. See `VALIDATION.md` for actual execution results and remaining manual checks.

## Privacy and hackathon limitations

Use synthetic patient information only. Browser localStorage and the local JSON store are not a health-data security solution. Review Wispr and any future AI provider's privacy terms, permissions, data retention and suitability before real patient use. No compliance or certification is claimed. Legacy CareFolio features have not received a full security audit; do not treat the broader application as production-ready healthcare software.

No official round-specific judging rules were supplied. Confirm eligibility, deadlines, required Flow-building evidence, whether installed-app dictation meets the particular round's definition, demo/video requirements and permitted services with the organizers. Product use of Flow alone does not prove rule compliance.

Validation summary: production build, focused relay TypeScript check, SunoSure model test and running-server referral integration test passed. Repository-wide TypeScript validation fails on legacy errors. Actual Wispr and browser interaction checks remain manual; see VALIDATION.md. Legacy Firebase auth initialization now reports missing configuration when used, allowing the isolated demo to build without Firebase credentials.
