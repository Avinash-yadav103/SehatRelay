# Validation record

Executed locally on 2026-11-27 with Node.js 22.14.0.

- Dependency install: passed (`npm install --legacy-peer-deps --no-audit --no-fund`); existing dependency deprecation warnings remain. No framework upgrade performed.
- `node --test tests/model.test.mjs`: passed (1 test). Covers missing duration, conflicting age phrases, unmatched source evidence and arbitrary-text fallback.
- `npm run dev`: started successfully at localhost:3000.
- `node --test tests/relay.test.mjs`: passed (1 integration test with multiple assertions) against the running Next.js server. Covers unauthenticated/invalid-role requests, predefined/manual generation, draft persistence, required verification, referral submission, duplicate submission, role enforcement, transition enforcement, acknowledgement retrieval and workspace isolation.
- `npx tsc --project tsconfig.relay.json --pretty false`: passed; checks all new UI, model, server and route files.
- Repository-wide TypeScript check: failed on existing CareFolio errors (585 diagnostic output lines), including Firebase client `verifyIdToken`, legacy implicit-any props and incompatible UI types. No diagnostics in the new relay files. Existing build config skips type/lint errors, so a build is not proof of repository type safety.
- `npm run build`: passed after adding an explicit missing-configuration guard for legacy Firebase auth initialization. All 41 static pages generated; /relay and /api/relay are present. Initial attempts failed because of overlapping dev/build output, then missing Firebase configuration; both were resolved before the final successful run.

Not executed: actual Wispr installed-product dictation, browser automation for input/caret focus and localStorage recovery, responsive visual inspection, screen-reader checks, and legacy CareFolio end-to-end regression tests. There is no available browser-control tool in this session. Native form elements, visible focus rules and responsive CSS are implemented, but visual/browser behavior needs manual verification.

Manual browser acceptance:
1. Open /relay at desktop width, select ASHA, start a visit, click Dictate with Wispr Flow. Confirm focus is inside the textarea and instructions are visible.
2. Type/paste Hindi and Hinglish, insert a second phrase at the caret, and confirm text and focus remain stable. Repeat with installed Wispr (README steps).
3. Refresh; confirm complete narrative recovers. Select ASHA again if the server session restarted, then Visit workspace. Edit source and note; confirm verification clears and refresh recovers edits.
4. Generate exact fixture; inspect missing-duration flag and evidence. Generate arbitrary text; confirm blank manual template and clear fallback message.
5. Fill required referral fields and verify each field, save, submit, switch clinician and acknowledge. Refresh and inspect timeline; switch ASHA and refresh records.
6. Repeat at 390px viewport with keyboard navigation. Check labels, focus, button reachability, source review and status messages.
7. Disconnect network, edit draft, refresh while the page remains available, then reconnect and retry save. Full offline navigation is not supported. Block storage to inspect error messaging.

The integration test creates fictional server records in .relay-data. Reset instructions are in README. No real patient data was used. No external AI or Wispr credentials were requested, added or exposed by the new workflow. This is not a complete secret scan or security audit of legacy files.

Final production smoke check: npm start reached Ready; GET /relay returned HTTP 200 with the synthetic-data notice. The full referral API integration test passed again against the production server (including submission and clinician acknowledgement). This HTTP check does not exercise hydrated browser interactions. Owned preview servers were stopped after verification.

## Redesign validation (current session)

Code inspection reconfirmed the installed-app-only Flow path, no audio access, exact-fixture extraction, local JSON storage, demo sessions and synthetic-only workflow. No server authorization, validation or status-transition logic was changed. Dependencies already existed in node_modules; no dependency changes or additional libraries were required.

Reference access: all three requested URLs were readable using web text access. No browser-control tool was available; neither reference visual inspection nor local desktop/mobile screenshots, keyboard navigation, dialog focus, caret retention or recovery behavior could be exercised in an actual browser. No real Wispr, microphone hardware or speech languages were tested. These remain manual checks. Responsive CSS and reduced-motion rules were implemented, not visually certified.

Manual checks for the redesigned flow:
- At desktop width and 390px width, inspect landing sections, walkthrough buttons, navigation, overflow, form labels and touch targets.
- Use keyboard-only navigation: skip link, demo entry, role selector, step navigation, fields, checkboxes, submission dialog, Escape and returned focus. Confirm no accidental submission.
- Enter Hindi/English/Hinglish text through typing/paste and installed Wispr. Verify cursor position and text are preserved, without a false listening indicator.
- Refresh during a draft and resume it from Overview. Edit a synced draft and confirm its status changes to device-only/not synced, then save to the server.
- Generate exact sample and arbitrary narrative. Check predefined-vs-manual labels; inspect missing duration, excerpts and user-entered field labels. Verify every field and submit via confirmation.
- Open clinician inbox, inspect the source, acknowledge, add follow-up and verify timeline/status from the worker role.
- Block network or local storage, observe visible failure feedback, then retry server save after reconnecting.

Current command results are appended below when complete. Earlier results above refer to the original implementation session.

Build isolation: a pre-existing development server was found listening on port 3000. Shared `.next` artifacts caused a collection-stage `/_document` failure despite successful compilation. The server was left running. Added optional `SEHATRELAY_BUILD_DIR` in next.config.mjs to validate in `.next-relay-check` and serve on port 3001. The previous artifacts were preserved under node_modules/.cache/sehatrelay-build-backup-20261127. No dependency reinstallation was needed.

Final redesign results (2026-11-28):
- Dependencies: existing installed stack reused; no package additions or upgrades.
- SunoSure model test: PASS (1 test).
- Focused relay TypeScript check: PASS after the redesign corrections.
- Full repository TypeScript check: FAIL on legacy CareFolio and generated legacy-route diagnostics (597 output lines). No relay diagnostics in that run. This remains separate from the passing focused check.
- Isolated production build: PASS with SEHATRELAY_BUILD_DIR=.next-relay-check; all 41 static pages generated. Existing config still skips lint/type validation during builds.
- Production startup: PASS on port 3001 using the Next CLI directly. The npm PowerShell wrapper dropped the short -p argument in this environment, so README uses the direct command for this optional isolated check.
- Referral API integration test: PASS against http://localhost:3001 (submission, acknowledgement, persistence, duplicate handling, role validation, workspace isolation and invalid transitions).
- Landing HTTP smoke check: PASS, status 200; original hero, scripted-example label, synthetic notice and all three linked section IDs were present.
- Git diff whitespace check: PASS (line-ending conversion notices only).
- Browser/visual/input-hardware checks: NOT RUN; no browser-control tool was available. Real installed Wispr dictation, caret retention, keyboard dialog focus, mobile layout, draft recovery in a browser and speech language quality remain manual checks above.

The owned validation server on port 3001 was stopped after checks. The pre-existing development server on port 3000 was left running. No deployment was performed. Local disk storage and demo authentication limitations remain unchanged.

## Screenshot / GSAP update (2026-11-28)

Visually reviewed the user-provided full-page Wispr screenshot. Rechecked the live website through web text and official GSAP matchMedia/context/ScrollTrigger documentation. No browser tools were available for a live website or local visual inspection.

Installed GSAP 3.15.1. Initial registry access was blocked by the sandbox; the approved retry succeeded. No other dependencies were added. Source inspection confirms deferred GSAP imports, scoped teardown, static readable content before animation initialization, reduced-motion handling, native scrolling and no microphone/audio animation. These checks do not replace browser execution or a performance profile.

SunoSure model test passed again (1 test). Focused type/build and production API results follow below. Manual acceptance still includes: mobile widths 320/390/720, desktop 1280/1440, keyboard walkthrough/FAQ navigation, scene changes without large layout shifts, reduced-motion toggling, navigating out/back without duplicate triggers, scroll smoothness on a lower-powered phone, caret retention and draft recovery, and installed Wispr dictation. None of these hardware/browser checks is claimed as performed.

GSAP update results:
- Focused relay TypeScript: PASS.
- Production build in .next-relay-check: PASS (41 static pages). Next reports /relay route JS 12.2 KB and first-load JS 116 KB; deferred GSAP chunks load after mount for motion-enabled visitors and are additional to this first-load figure.
- CSS source measurement: 40,525 bytes raw / 7,864 bytes gzip. This is the relay source stylesheet measurement, not a network capture of all production CSS.
- Production server: reached Ready on port 3001. Landing HTTP smoke: PASS, 200; new hero, scripted-example label, FAQ, section links and synthetic notice present.
- Referral API regression test against production port 3001: PASS (1 integration test covering submission, acknowledgement, persistence, role/validation/isolation/transition checks).
- Existing SunoSure model test: PASS (1 test).
- Git diff whitespace check: PASS; line-ending conversion notices remain.
- Actual visual animation, browser/device scroll performance and real Wispr/microphone checks: NOT RUN. No claim of measured FPS or lag-free behavior. Use manual acceptance above.

The owned validation server on port 3001 was stopped. The pre-existing port-3000 development server remains available. The supplied screenshot informs this update; prior notes about no visual reference apply to the earlier redesign session. No deployment or database/authentication migration was performed.
