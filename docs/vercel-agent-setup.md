# Vercel agent setup

Followed https://vercel.com/get-started.md. CLI upgraded from 54.20.0 to 68.0.0; authenticated as avinash-yadav103. Existing Vercel plugin and skills are available, so no duplicate skill pack was installed.

The connected Vercel tool still returns 403 for the selected team after workspace approval. The CLI successfully accesses the same explicit workspace scope (team_isBCpPcB7tawteaNI4ntE2gN); project operations use that authenticated CLI. The separate Codex CLI MCP OAuth attempts previously timed out and are not claimed authenticated. No unrelated MCP configuration was replaced.

The checkout is linked to avinash-yadav103s-projects/sehatrelay, project prj_osmL0Xn1wHxpGalwZrpY2EpcKahO. Framework: Next.js. Node: 22.x. CLI project creation/linkage is explicitly authorized by the deployment request.

Neon Marketplace CLI provisioning repeatedly reported terms acceptance required, despite user-confirmed browser acceptance. The user created and connected neon-aureolin-compass through the dashboard instead; the CLI verified the store and Production/Preview credentials. No duplicate database was provisioned by the agent. Development rescoping failed because Vercel rejects Secret variables targeting Development; env pull/run cannot download Production Secrets. Database migration/tests run in the hosted build before release instead. No credentials are printed or committed.

The production signing secret was generated and stored as a Vercel Secret; RELAY_STORAGE is postgres. Environment files, local records and generated build output are excluded from deployment inputs. Deployment and live-check results are recorded in VALIDATION.md and docs/hosted-demo.md.

CLI authentication does not supply an AI provider key. No paid extraction provider was configured. Legacy CareFolio services remain separately configured.
