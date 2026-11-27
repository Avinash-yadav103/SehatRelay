-- PROPOSAL ONLY. Not applied, connected or tested. Synthetic demo data only.
CREATE TABLE synthetic_referrals (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('draft','submitted','acknowledged','follow-up','closed')),
  revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (payload ?& ARRAY['id','workspace','status','narrative','note','timeline']),
  CHECK (payload->>'id' IS NOT NULL AND payload->>'id' = id::text),
  CHECK (payload->>'workspace' IS NOT NULL AND payload->>'workspace' = workspace_id::text),
  CHECK (payload->>'status' IS NOT NULL AND payload->>'status' = status),
  CHECK (jsonb_typeof(payload->'narrative') = 'string'),
  CHECK (jsonb_typeof(payload->'note') = 'object'),
  CHECK (jsonb_typeof(payload->'timeline') = 'array')
);
CREATE INDEX synthetic_referrals_workspace_status_updated
  ON synthetic_referrals (workspace_id, status, updated_at DESC);
-- Every mutation must update status/payload/revision/timeline together in a transaction.
-- Use parameterized queries. Never give browser clients database credentials.
