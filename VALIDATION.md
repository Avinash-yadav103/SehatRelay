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
