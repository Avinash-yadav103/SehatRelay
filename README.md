# CareFolio — voice, review, relay

CareFolio now has a redesigned application-wide interface and a browser-microphone workflow. SehatRelay is its visit/referral feature; SunoSure helps review missing details and source evidence. The prototype is for **synthetic information only** and makes no diagnoses, prescriptions, treatment or triage decisions.

## Main application routes

| Route | Purpose |
| --- | --- |
| `/` | CareFolio landing page, microphone-enabled narrative, role entry points |
| `/login`, `/register`, `/medical-info`, `/profile` | Existing account/profile flows with shared styling and microphone access for eligible text fields |
| `/dashboard/patient/*` | Existing records, appointments, profile, sharing, tracking, vaccinations and logs |
| `/dashboard/doctor/*` | Existing clinician records, patients, appointments and profile |
| `/dashboard/student/*` | Existing researcher/student workspace |
| `/dashboard/government/*` | Existing administrator pages with consistent navigation and labeled sample reporting sections |
| `/visits` | Main CareFolio voice visit, SunoSure review, draft and referral workflow |
| `/referrals` | Referral list and clinician review entry |
| `/relay` | Compatibility entry to the shared visit experience; no longer the sole location of voice features |

The redesign updates the root landing page, shared dashboard header/sidebar, mobile navigation, cards, buttons, account-form panels, colors, tables and role-screen surfaces. Cream, teal, charcoal and lavender follow the supplied Wispr screenshot while retaining original CareFolio identity. No Wispr logo or proprietary assets were copied. Root-page 3D assets were removed; landing motion uses deferred GSAP and respects reduced motion. The source code and backend operations of legacy role screens remain in place.

## Run locally

For judges, run `docker compose up --build` and open http://localhost:3000. No secret keys or .env file are required. Docker uses a named volume for synthetic records and a locally generated signing key. Docker Engine was unavailable here, so actual container startup remains a manual check.

For development, use Node.js 22:

```powershell
npm install --legacy-peer-deps
npm run dev
```

Open **http://localhost:3000/**. No application API key is needed for browser microphone input, the home narrative or manual synthetic visit/referral flow. General AI extraction requires server-side provider credentials and a model. The browser's speech service needs browser support, permission, and typically network access. Unsupported browsers show a clear fallback rather than a pretend recording state.

Optional environment variables:

- `RELAY_SESSION_SECRET`: long random server-only value; keep it stable to preserve signed visit-demo workspace cookies across server restarts. Local file mode automatically creates a stable key in ignored `.relay-data/session.key`. On Vercel this variable is required; hosted instances never generate temporary signing keys.
- `SEHATRELAY_BUILD_DIR`: optional generated Next output directory for checking a production build while another dev server is using `.next`.

```powershell
$env:SEHATRELAY_BUILD_DIR = '.next-relay-check'
npm run build
node node_modules/next/dist/bin/next start --port=3001
```

Use the same output-directory variable for build and start. Normal commands use `.next` when unset.

## In-app microphone — actual implementation

The global **Voice input** control is mounted in the root layout, so it is available throughout the main application. The home narrative and visit documentation also have contextual microphone buttons. It uses the browser's native `SpeechRecognition` / `webkitSpeechRecognition` interface, **not Wispr Flow**. The API is not supported in every browser and may use a remote browser-vendor service. Use HTTPS or localhost. Feature availability is checked at runtime; a compatible browser can still return service/network/permission errors.

To dictate into a form:

1. Click an editable text/search field or textarea on a CareFolio screen. Password, OTP, credential, Aadhaar fields and nontext controls are excluded from dictation targeting. Read-only and disabled fields are excluded.
2. Open **Voice input** or the contextual microphone. Confirm the **Insert into** field. Select **Dictate into a text field**.
3. Choose English (India) or Hindi (India). These are requested recognition locales, **not a tested language-quality guarantee**. Hinglish/code-switching quality has not been tested.
4. Select **Start microphone**, then allow browser microphone permission. The UI shows requesting permission first and indicates active capture only after the speech service's start event.
5. Speak, then select **Stop & process**. Interim text is labeled as provisional; only final results become the review transcript. Browser silence/session limits can also end capture.
6. Review and edit the transcript. Select **Insert reviewed text**. The original field's selected range is replaced, with surrounding text preserved, through normal input events so existing React form state and validation continue to run.
7. Review the result in the form. Use that form's normal save/submit action yourself.

Cancellation and failures preserve the original form value. If the field was changed or removed while dictating, insertion is blocked instead of overwriting the newer content. Field limits are checked. Capture is aborted on cancellation, route navigation, closing the target dialog, hiding the tab, or unmount. Sessions stop after two minutes; setup and final-processing timeouts release the service. CareFolio stores no audio file and provides no playback; the browser provider’s retention terms are separate.

The microphone control can appear within an open dialog to remain reachable with that dialog's focus boundary. Actual browser focus/caret and mobile behavior still need manual verification; see VALIDATION.md.

### Confirmed voice navigation

Choose **Request app navigation** instead of dictation, start the microphone and speak one of:

| Phrase | Destination |
| --- | --- |
| `open home` / `go home` | `/` |
| `open dashboard` | `/dashboard` (existing role redirect/authentication applies) |
| `open visits` / `open voice visits` | `/visits` |
| `open referrals` | `/referrals` |
| `open sign in` | `/login` |

Review the recognized phrase and click **Confirm: open …**. No navigation happens automatically. Arbitrary URLs and instructions are rejected. No spoken command submits a referral, sends a message, edits clinical facts or makes a clinical decision.

### Verification limits and provider configuration

The actual browser-API path is implemented, with automated tests using an injected fake recognition engine for event sequences and failures. **No real microphone, speech service, installed Wispr dictation, or speech-language accuracy test was performed in this environment.** A passing mock test is not proof of hardware/service performance. There is no browser-control tool in this session, so visual, keyboard and real input checks remain manual. A browser may expose the API but still require additional configuration or deny its service. If that happens, use typing or installed Flow.

No new server transcription provider or paid speech API account was configured. Native recognition is provided under the browser vendor's terms; it may transmit audio remotely and is not claimed to be offline/private or suitable for health data. A uniform cross-browser server transcription adapter would require a separately selected service, credentials, terms/privacy review and hardware testing. No such provider is simulated here.

Official implementation references: [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition), [stop](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/stop), [abort](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/abort), [Microsoft browser documentation](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/speech-recognition-api).

## Installed Wispr Flow remains a separate option

Install and sign in to [Wispr Flow](https://wisprflow.ai/), finish its permissions/keyboard setup, place the cursor in the narrative or another editable field, and use the shortcut/mobile keyboard configured in your Flow app. Finish dictation in Flow and review inserted text. The **Use installed Wispr Flow** / **Use Wispr Flow** controls focus the field; they do not start, control, detect or authenticate Flow. SehatRelay receives text only on this path and has no access to Flow's recording. No Wispr API, token, fake connection badge or recording waveform is implemented.

Follow [Wispr's first-dictation guide](https://docs.wisprflow.ai/articles/6409258247-starting-your-first-dictation). Direct speech API authorization and terms for this project were not verified. The browser microphone is accurately labeled as a different engine.

## Complete synthetic demo from the main application

1. Start at `/`, introduce CareFolio, and select **Use microphone** in the narrative panel. Start, speak fictional details, stop, review and insert. Alternatively type or use installed Flow.
2. To show the supported extraction, load the exact fictional Tara-01 example:
   > Demo patient Tara-01. Aaj pregnancy follow-up visit hai. Patient ne thakan batayi. Pregnancy 24 weeks hai. Clinician review ke liye referral chahiye.
3. Click **Review as a visit**. The home draft transfers to `/visits`. Confirm before replacing an existing device visit draft. Choose **ASHA worker** in the explicitly labeled demo role selector if needed.
4. Generate the structured note with a configured server-side AI provider. New English/Hindi/Hinglish examples are available in the practice selector. Without credentials, the original Tara-01 fixture has predefined fields and other narratives use a clearly labeled manual template. Generation asks before replacing existing note content.
5. Inspect the missing-duration flag and source. Confirm unknown information as not provided; never invent a clinical fact. Enter the visit details, referral reason and `Demo PHC` as the fictional facility. Check every field individually.
6. Save a server draft, continue to Referral & timeline, and submit through the explicit confirmation dialog.
7. Open the clinician inbox / choose **Clinician**, read the narrative and note, dictate or type a clinician review note, review inserted text, then acknowledge using the button.
8. Show timestamped status changes. Switch back to ASHA and refresh Referrals to show acknowledgement and follow-up.
9. In any text form, demonstrate the global microphone. Optionally demonstrate `open dashboard` in navigation mode and confirm the destination.

SunoSure flags omissions, unmatched source excerpts/user entries, and limited differing-age patterns (`years old`, `saal`, `वर्ष`). It does not comprehensively check contradictions or clinically validate information. Field edits clear that field's verification; narrative edits clear all verification. No diagnosis, measurements or treatment are inferred. Missing details remain blank/Not provided.

## Data, authentication and legacy configuration

The new visit flow still validates requests and permissions on the server using Zod and signed HttpOnly demo cookies. Demo-role switching is public by design, and records are isolated by synthetic workspace. It is not production identity verification and is separate from legacy patient records. States: draft → submitted → acknowledged → follow-up → closed (acknowledged can close directly). Repeated submission IDs do not duplicate referrals. Clinician review needs a review note; invalid transitions are rejected.

Storage is configurable: local/Docker defaults to ignored `.relay-data/records.json` (one Node process with a persistent volume); hosted mode requires `RELAY_STORAGE=postgres`, server-only `DATABASE_URL` and stable `RELAY_SESSION_SECRET`. The Postgres adapter stores one JSONB row per referral with workspace/status indexes, revisions and transactional status/timeline updates. Stale writes return 409; duplicate submissions are idempotent. Hosted builds apply the idempotent schema and run real database concurrency/durability tests before release. Vercel refuses file fallback. See [hosted setup and verification](docs/hosted-demo.md) and VALIDATION.md for the actual release result. Production health-data use still requires real identity, authorization and privacy work.

Home narratives use localStorage (`carefolio-home-narrative`); visit drafts use `sehatrelay-synthetic-draft-v1`; explicit transfer uses sessionStorage. Device recovery alone works offline; navigation, services and submissions need connectivity. Clear home and visit drafts separately using their visible controls. Server records are retained. For a complete synthetic reset, stop the app and remove `.relay-data/records.json` manually. Browser storage is not a health-data protection solution.

The existing CareFolio dashboard CRUD/authentication integrations are preserved, with shared styling and dictation added. They contain a mixture of backend calls and sample/mock data; redesign does not make them live integrations. Client auth stores/demo OTP flows are not production authentication. Do not treat legacy sample metrics as real usage. The legacy SOS component had simulated notifications; its UI is now explicitly a non-contacting SOS demo and makes no alert-delivery claim.

Legacy services may require:

- `medical-records-backend`: install its dependencies and run `npm start` there; requires `MONGODB_URI` or its existing localhost MongoDB default. It normally serves port 5000.
- `aadharbackend`: install dependencies and run `npm start` there; its server/authentication configuration is separate. Existing frontend calls include localhost port 8881.
- Firebase client configuration in `lib/firebase.ts`: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, optional measurement ID. Server identity verification still needs repair: legacy medical-record/upload routes call `verifyIdToken` on a client auth object.
- The legacy `backend/app.js` chat service uses server-only `GEMINI_API_KEY` and is started with `node app.js` from that backend. Its separate configuration/privacy review is required if used. It is not part of the new microphone or extraction path.

Do not put secrets in `NEXT_PUBLIC_` variables. These legacy services were not provisioned or audited in this task. The new synthetic path and browser microphone need none of those service keys.

## Architecture and checks

Next.js 15 / React 19 / TypeScript / Tailwind + Radix; existing UI components remain. Main files:

- `app/page.tsx`, `app/layout.tsx`, `app/carefolio.css`: root home, shared voice mount and theme.
- `components/dashboard/layout`: role navigation, headers, shell and government sections.
- `components/voice`: global dock, contextual microphone control, dynamic loader.
- `lib/voice/session.ts`: injectable SpeechRecognition lifecycle, insertion and allowlisted navigation.
- `components/visits/visit-workspace.tsx`: shared main-application visit/referral workflow.
- `lib/relay`, `app/api/relay`: server-side structured extraction, exact-source validation, QA, manual fallback and demo persistence.

```powershell
node --test tests/extraction.test.mjs tests/voice.test.mjs tests/model.test.mjs
npx tsc --project tsconfig.voice.json --pretty false
npm run build
npm start
node --test tests/relay.test.mjs
```

For an isolated server on port 3001, set `RELAY_TEST_URL=http://localhost:3001` before the integration test. `npx tsc --noEmit --pretty false` still reports legacy errors; the build currently skips type/lint checking by existing configuration. See `VALIDATION.md` for executed checks and limitations. The root screenshot reference was visually reviewed; actual desktop/mobile browser inspection and microphone testing were not available.

## Privacy and hackathon limits

Synthetic data only. Review browser speech/Wispr/any future AI providers' permissions, retention and health-data suitability before real use. No HIPAA certification, clinical validation, privacy certification or production-readiness claim. This is a prototype, not an emergency response service.

The user supplied submission rules: public GitHub, docker-compose.yml with no-key startup, roughly 300+ original hackathon lines, a public/unlisted YouTube video up to three minutes, and a text-readable PDF pitch. A live link is optional and submission is once by 30 November, 11:59 pm (timezone/year not stated). The video and pitch still require preparation. Confirm Flow-building evidence requirements and whether installed-app text insertion meets this round with organizers. Adding a separate browser microphone does not prove a direct Wispr API integration or hackathon eligibility.

To repeat the main application's full smoke suite against a running server:

```powershell
$env:RELAY_TEST_URL = 'http://localhost:3000'
node --test tests/application.test.mjs tests/relay.test.mjs tests/extraction.test.mjs tests/voice.test.mjs tests/model.test.mjs
```

Latest local result: production build/startup on Next.js 15.5.29, focused types and all 11 tests passed, including storage concurrency/durability, 38 HTTP page URLs and referral acknowledgement. The whole-repository type check still fails on legacy errors. Browser/hardware checks remain manual; see VALIDATION.md.

## New narrative extraction milestone

Configured AI can now extract new Hindi, English and Hinglish synthetic narratives, requesting strict JSON Schema and validating every field/source excerpt on the server. All fields remain unverified until human review. Conflict flags retain exact alternatives and leave the field unknown. Failures show safe error codes and manual entry; manual mode can be selected without sending a request. The original narrative and both voice-entry paths are preserved.

See [structured extraction setup, error contract and actual test scope](docs/structured-extraction.md). New required server configuration: `SEHAT_AI_PROVIDER`, `SEHAT_AI_MODEL`, and either `AI_GATEWAY_API_KEY` (gateway) or `SEHAT_AI_API_KEY` + `SEHAT_AI_ENDPOINT` (compatible provider). No real key/model was available here; the three-language tests use a mock HTTP service, not a live model.

The persistence proposal is now implemented in `lib/relay/store.ts`, with runnable schema in `db/migrations/001-synthetic-referrals.sql`. Local JSON remains available for key-free startup. [Hosted configuration, release gate and limitations](docs/hosted-demo.md) describe the migration and actual validation scope.

## Hosted demo and submission

See [hosted demo setup](docs/hosted-demo.md) for Docker, Postgres, build gates and required submission artifacts. The configured Vercel project is `sehatrelay`. No AI provider credential was added; new narrative extraction uses manual fallback until a provider/model/key is configured. Installed Wispr Flow and the browser microphone paths are preserved; neither was tested with actual microphone hardware in this environment.
