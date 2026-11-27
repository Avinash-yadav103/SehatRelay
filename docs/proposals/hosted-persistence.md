# Hosted synthetic demo persistence proposal

Historical proposal. The adapter and idempotent migration are now implemented; see [current hosted setup](../hosted-demo.md) and VALIDATION.md for actual database/deployment verification. The inspection below describes the earlier JSON-only implementation.

## What the current store actually does

`lib/relay/server.ts` loads all records from `.relay-data/records.json`, mutates an array inside a process-local promise queue, then writes `records.json.tmp` and renames it over the original. Every GET also rewrites the array. This serializes one process but cannot coordinate separate processes/instances; two instances can lose updates or collide on the same temporary filename. Ephemeral local disk loses state between instances/redeploys. JSON parsing has no on-disk schema/version validation. Timeline and status updates are stored together, which is worth retaining.

Records already have stable UUID IDs, workspace IDs, a narrative, editable note, status and timeline. New note flags and extraction provenance remain ordinary JSON. Preserve IDs, timestamps, Unicode text and the existing synthetic workspace boundary.

## Smallest reliable migration

Use one managed Postgres database and **one row per referral**, keeping the existing record as JSONB. Add indexed workspace/status columns and a revision counter. This avoids an ORM and a large schema rewrite. The host choice is independent of the application; a small managed Postgres instance with pooled connections (for example Neon) is sufficient. No provider has been selected/provisioned through a paid integration.

Existing MongoDB code lives in a separate legacy Express application with incomplete auth configuration. Reusing it is only smaller if that service is already securely hosted; coupling the new demo to it now would add a second deployment and an auth integration. Keep legacy medical records untouched.

Review-only DDL is in `synthetic-referrals.sql`. Apply it only to a newly configured synthetic-demo database. Use a least-privilege app database role, TLS and a server-only pooled `DATABASE_URL`; do not expose a database credential in `NEXT_PUBLIC_*`. Require a stable `RELAY_SESSION_SECRET` across instances. Existing public demo-role switching must remain visibly synthetic; this does not become production authentication.

## Minimal code boundary

Replace the callback-over-all-records interface with three repository operations:

- `list(workspace, role)`: parameterized SELECT restricted to workspace, and exclude drafts for the clinician.
- `save(workspace, data, expectedRevision)`: transaction described below. Return stored record + revision.
- `review(workspace, id, expectedRevision, status, reviewNote)`: transaction/conditional update described below.

Keep Zod input validation, server role checks, exact-source checks and state transitions at the API boundary. Keep the browser's existing draft recovery. Never fall back silently to local JSON when database configuration fails; return a visible 503 and retain the device draft.

Use a normal pooled Postgres driver with a small per-instance connection pool; run each multi-statement transaction on one checked-out client. Do not scatter BEGIN/SELECT/UPDATE/COMMIT across independent HTTP connections. A managed pooler such as Neon's supports serverless connection churn; keep connections/credentials server-only.

### Draft save / submission

1. BEGIN. INSERT a new record with its global UUID using `ON CONFLICT (id) DO NOTHING`.
2. If it already exists, SELECT it `WHERE id=$1 AND workspace_id=$2 FOR UPDATE`. If it belongs elsewhere, return 404. Do not overwrite or disclose the other workspace's record.
3. If already submitted, return the stored record for duplicate submit retries. Do not append a second submission event. Existing API behavior already treats the ID as the idempotency key.
4. For a draft, compare `expectedRevision`, validate required verification/facility/reason, and UPDATE status + payload + appended timeline entry + increment revision in the same transaction. Revision mismatch returns 409 and asks the worker to refresh/reconcile. Two editors must not silently overwrite each other.
5. COMMIT before returning success. Roll back on failure. The UI marks synced only after success.

### Clinician transition

Lock/select the workspace-scoped record in a transaction, compare revision and current status, enforce the existing allowed transition map, append the actor/timestamp/review note and update status/payload/revision atomically. An equivalent conditional UPDATE with `WHERE workspace_id=$1 AND id=$2 AND status=$3 AND revision=$4 RETURNING ...` also prevents competing transitions. Return 409 for stale revisions or invalid transitions. Retry a failed connection only when the logical operation's idempotency is established; never append timeline events blindly on retry.

## Import and acceptance gate

1. Provision a separate synthetic database; confirm project/team and billing before connecting it. Configure pooled DATABASE_URL and stable session secret in local/staging environment variables.
2. Back up the JSON file; stop writes during a one-time import. Validate every existing record through a full record schema (including flags, extraction metadata, timeline and UUIDs) before inserting. Do not log narratives. Reject unknown/corrupt rows for explicit operator review.
3. Import in a transaction, preserving UUID/workspace/status/timeline. `ON CONFLICT DO NOTHING` makes re-running the same import non-destructive, but compare hashes/counts to detect changed duplicates rather than ignoring them silently. Include no real patient data.
4. Test save → reload → submit → acknowledge across **two independent application instances**, then restart/redeploy both and verify records/timeline/revision persist.
5. Test simultaneous duplicate submissions (one submitted record/event), simultaneous clinician acknowledgements (one transition), conflicting draft revisions (409), cross-workspace IDs (404), ASHA/clinician permissions, provider extraction flags surviving persistence, and database loss/reconnect (visible failure, no false synced state).
6. Only after these pass should the app be considered ready for a hosted synthetic demo. Deployment is still a separate requested action. Keep JSON backup for rollback; do not delete it or turn on dual writes automatically.

## References

- [Postgres row locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [Postgres INSERT / ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html)
- [Neon connection pooling](https://neon.com/docs/connect/connection-pooling)

These establish database mechanics, not a claim that this proposal has been configured or tested.
