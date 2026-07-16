---
title: Python SDK
description:
  Set up and verify the MissionWeave Python SDK from its source repository.
sidebar:
  label: Python
  order: 1
---

The [MissionWeave Python SDK](https://github.com/MissionWeaveProject/python-sdk)
is the official Python reference implementation of MissionWeave Protocol 0.1. It
includes the authoritative Core, Agent runtime, Worker Scheduler, Group gateway,
storage adapters, conformance runner, and executable proof of concept.

These instructions use a source checkout of the SDK repository.

## Requirements

- Python 3.12 or newer
- [`uv`](https://docs.astral.sh/uv/)
- Docker, for the optional PostgreSQL integration tests

## Check out and prepare the SDK

```bash
git clone https://github.com/MissionWeaveProject/python-sdk.git
cd python-sdk
uv sync --extra dev
```

The source package is
[`src/missionweave/`](https://github.com/MissionWeaveProject/python-sdk/tree/main/src/missionweave).
The project metadata and command entry points are defined in
[`pyproject.toml`](https://github.com/MissionWeaveProject/python-sdk/blob/main/pyproject.toml).

## Verify the source checkout

```bash
uv run pytest
uv run ruff check .
uv run ruff format --check .
uv run mypy
uv run missionweave-conformance --root .
```

The conformance command checks all 43 vendored vectors against the 21 vendored
Draft 2020-12 schemas. The protocol repository remains normative;
[`PROTOCOL_PIN.json`](https://github.com/MissionWeaveProject/python-sdk/blob/main/PROTOCOL_PIN.json)
records the exact protocol commit and artifact digests used by the SDK.

To validate a sibling checkout of the canonical protocol repository instead:

```bash
git clone https://github.com/MissionWeaveProject/missionweaveprotocol.git ../missionweaveprotocol
uv run missionweave-conformance --root ../missionweaveprotocol
```

## Run the proof of concept

```bash
uv run missionweave-demo --workdir .missionweave/poc
```

The command produces one canonical JSON report and exits with a nonzero status
if a required behavior is missing. The deterministic scenario covers two
concurrent Missions, shared Workers, child Missions, peer clarification,
scheduling, checkpoint-only preemption, recovery, Coordinator verification, and
exact human approval.

## Run the PostgreSQL integration tests

```bash
docker compose up -d --wait postgres
MISSIONWEAVE_TEST_POSTGRES_URL=postgresql://missionweave:missionweave@127.0.0.1:55432/missionweave \
  uv run pytest tests/test_core.py -q
```

When finished, stop the local service:

```bash
docker compose down --volumes
```

## Run the development gateway

Create disposable development keys and an Organization-signed Agent Registry:

```bash
uv run python examples/create_dev_registry.py
export MISSIONWEAVE_ORGANIZATION_PUBLIC_KEY="$(uv run python -c \
  'import json; print(json.load(open(".missionweave/dev-keys.json"))["organizationPublicKey"])')"
export MISSIONWEAVE_AUTHORITY_PRIVATE_KEY="$(uv run python -c \
  'import json; print(json.load(open(".missionweave/dev-keys.json"))["authorityPrivateKey"])')"
export MISSIONWEAVE_SESSION_SECRET='development-only-session-secret-32-bytes'

uv run missionweave-server \
  --registry .missionweave/dev-registry.json \
  --database-url postgresql://missionweave:missionweave@127.0.0.1:55432/missionweave \
  --organization-public-key "$MISSIONWEAVE_ORGANIZATION_PUBLIC_KEY" \
  --allow-insecure
```

`--allow-insecure` is only for loopback development. A deployment must provide
`--tls-certfile` and `--tls-keyfile`; MissionWeave Protocol 0.1 requires secure
WebSocket transport over TLS 1.3.

## Build local artifacts

```bash
uv build
```

The resulting local wheel includes `py.typed` and the 21 pinned schemas used for
runtime document validation.

For implementation details, tests, and current compatibility information, use
the canonical
[SDK README](https://github.com/MissionWeaveProject/python-sdk/blob/main/README.md).
