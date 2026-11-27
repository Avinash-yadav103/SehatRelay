# Server-side structured note extraction

## Configuration

This is a real structured-output HTTP adapter, not a model simulator. Configure one provider in local server environment variables (`.env.local` for Next). The default `SEHAT_AI_PROVIDER=none` sends no AI request. Existing browser microphone and installed Wispr text-entry paths are unchanged; extraction starts only after the worker reviews text and selects Generate.

For Vercel AI Gateway:

```dotenv
SEHAT_AI_PROVIDER=gateway
AI_GATEWAY_API_KEY=<your server-only AI Gateway key>
SEHAT_AI_MODEL=<provider/model supporting strict json_schema chat output>
SEHAT_AI_TIMEOUT_MS=15000
```

For another provider implementing the same Chat Completions protocol:

```dotenv
SEHAT_AI_PROVIDER=openai-compatible
SEHAT_AI_ENDPOINT=https://<provider-host>/<path>/chat/completions
SEHAT_AI_API_KEY=<your server-only provider key>
SEHAT_AI_MODEL=<provider-supported structured-output model>
SEHAT_AI_TIMEOUT_MS=15000
```

Do not prefix keys with NEXT_PUBLIC, commit real credentials, paste credentials into chat, or place them in the narrative. Restart the server after configuration changes. The generic endpoint must support `response_format.type=json_schema`, `strict:true`, `max_completion_tokens`, system/user messages and the standard non-streaming choices/message/content envelope. Providers/models differ; an unsupported option is reported as unavailable/configuration-rejected and offers manual entry, not silently downgraded to unvalidated JSON. HTTPS is required. Explicit localhost HTTP is permitted only outside production with `SEHAT_AI_ALLOW_LOCAL_HTTP=1`, for isolated protocol tests; never deploy that flag.

A Vercel CLI sign-in does not configure an AI Gateway key/model. No extraction key or model was available in this environment. No credentialed provider call or multilingual AI-quality evaluation was performed. Tests use a mock HTTP provider and separately authored expected responses. Set a real key/model and run the synthetic examples on your machine before relying on the live integration.

This adapter makes one paid request per Generate click when configured, with at most 15,000 narrative characters, 6,000 requested output tokens, a default 15-second timeout (configurable 50–45,000ms), and a 256KiB response cap. There are no automatic AI retries or model failovers. Costs depend on your provider/model and account; no free quota is assumed. Keep a hosted synthetic demo private and set provider budget limits: current demo sessions are publicly selectable and are not identity verification or a distributed usage quota.

## Output, evidence and review contract

- Every supported field is present as `{value, evidence}`, both nullable. Unknown means both null. Values must be copied verbatim, with no translation/date normalization/measurement inference. Dates stay editable source text, including Hindi dates.
- Provider requests use a strict JSON Schema. Server-side Zod independently rejects malformed objects, extra fields, missing fields, oversized values, invalid issues and incomplete/refused responses.
- For nonempty fields, evidence must be an exact substring of the original narrative and must contain the exact value. A mismatching/unsupported claim rejects the entire generated note. Original narrative bytes/script/wording are never replaced by the output.
- Provider conflict/unclear issues have only a bounded kind, known field and exact source excerpts. Explanations are generated from fixed application copy, so model-authored clinical advice cannot become a review explanation. A conflict needs two distinct excerpts. The affected field stays blank, with the source alternatives visible and a human-review checkbox.
- Every generated field starts unverified. Narrative edits preserve entered values but clear source links and all verification, with explicit recheck copy. Field edits clear that field's verification/source link. Excerpts that no longer match are rejected on server save.
- Matching a quotation is provenance validation, **not clinical or semantic validation**. A model can still omit contradictions or assign an existing phrase to the wrong field. Workers must inspect the original text and verify every field before submitting; the clinician remains responsible for review. No diagnoses, treatment, prescriptions, urgency/triage or automated decisions are produced by the application.
- Extraction mode/message and per-field review reasons/alternatives survive draft/referral saves. Existing records without these optional properties remain readable.

## Errors and manual fallback

The API's generation response always describes its kind (`ai`, `manual`, `fixture`) and editable note. No exception, provider body, credential, raw endpoint or narrative is logged or included in diagnostic output.

| Outcome | HTTP | Error code |
| --- | --- | --- |
| AI not configured | 200, explicitly manual | AI_NOT_CONFIGURED |
| Invalid configuration | 503 | AI_CONFIG_INVALID |
| Provider refused | 422 | AI_REFUSED |
| Malformed, incomplete, oversize or unsupported source output | 502 | AI_OUTPUT_INVALID |
| Timeout | 504 | AI_TIMEOUT |
| Service/network/configuration rejection | 503 | AI_UNAVAILABLE |

Non-success responses include an empty manual note and safe message. The client handles these as explicit fallback outcomes, not AI success. If an edited note already exists, failure retains it and shows the failure message; workers may explicitly choose to replace it with the manual template. The dedicated **Open manual template (no AI request)** action bypasses the provider even when credentials exist. Existing narrative text is always preserved.

Without an AI provider, the original exact Tara-01 fixture remains an explicitly labeled predefined example for backward-compatible demos; other narratives are manual. No arbitrary-text understanding is claimed for this fallback. A selector now offers the original fixture plus new English Mina-02, Hindi रीवा-03, and Hinglish Nila-04 narratives (the latter has conflicting pregnancy weeks).

## Testing and remaining validation

`node --test tests/extraction.test.mjs` tests a real local HTTP exchange against a **mock provider** for the three new narratives, Hindi date preservation, missing history/observations/duration, conflict excerpts, strict request schema, unverified output and preservation of original text. It also tests invalid schema/JSON, invented facts, translated values, unsupported excerpts, refusal, truncation, response limits, timeout, service/network errors, missing credentials, invalid configuration, manual mode without a request and verification reset. This does not test an actual language model or speech recognition.

Before a live demo, configure credentials/model, generate each fictional example, inspect each excerpt and confirm omissions/conflicts manually. Try another new narrative, an adversarial instruction embedded in source text, ambiguous language, and a service outage. The system prompt treats narratives as untrusted data, but prompt-injection resistance and clinical accuracy are not certified by mock tests. Review the provider's privacy/retention terms; use synthetic data only.

The route emits only two low-cardinality Vercel metrics (extraction kind/error code and latency) through @vercel/functions. These are no-ops locally, require Vercel's supported observability plan/settings to inspect, and may be billed as observability events. No narrative, field value, workspace ID or raw API response is attached. Metrics have not been verified on a deployed function; no deployment was performed.

## Official protocol references

- [AI Gateway strict structured outputs](https://vercel.com/docs/ai-gateway/sdks-and-apis/openai-chat-completions/structured-outputs)
- [Chat Completions response format](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)

## Hosted persistence

The running backend still uses local JSON. See [the one-table managed Postgres proposal](proposals/hosted-persistence.md) and its review-only SQL. No database was configured, imported or tested. No serverless-readiness or deployment claim is made.
