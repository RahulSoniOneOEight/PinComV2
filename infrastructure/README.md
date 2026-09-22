# Infrastructure

Infrastructure conventions cover:
- local development
- dev/staging/production environments
- containers
- secrets
- deployment
- monitoring
- backups
- recovery

Release policy: build an immutable candidate, validate it in staging, require human production authorization, and promote that exact candidate.

## Local staging stack

`docker/docker-compose.staging.yml` provides the provider-neutral infrastructure
dependencies:

| Service | Image | Host port | Persistence |
|---|---|---|---|
| PostgreSQL | `postgres:16` | `5432` (`POSTGRES_PORT`) | `postgres-data` |
| Valkey (Redis-compatible cache) | `valkey/valkey:8-alpine` | `6379` (`VALKEY_PORT`) | `valkey-data` |
| NATS JetStream | `nats:2.10` (`-js -sd /data`) | `4222` / `8222` | `nats-data` |
| Meilisearch | `getmeili/meilisearch:v1.10` | `7700` (`MEILI_PORT`) | `meili-data` |

Copy `docker/.env.example` to `docker/.env` to override ports/credentials. The
`.env` file is gitignored; never commit real credentials.

```sh
cd infrastructure/docker
cp .env.example .env            # adjust POSTGRES_PORT if 5432 is taken
docker compose -f docker-compose.staging.yml up -d
```

Provider *application* containers (Medusa, Tryton, ...) are **not** part of the
provider-neutral base platform (see `docs/production-connectors.md`). They live in
`docker/docker-compose.providers.yml` behind the `providers` profile:

```sh
docker compose \
  -f docker-compose.staging.yml \
  -f docker-compose.providers.yml \
  --profile providers up -d
```

Tryton uses the official `tryton/tryton:8.0` image and requires a database
initialized once with `trytond-admin`. Medusa has no official image; set
`MEDUSA_IMAGE` to an image built from the client's Medusa project.
