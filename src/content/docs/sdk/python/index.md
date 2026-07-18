---
title: Python SDK
description:
  Set up and verify the MissionWeaveProtocol Python SDK from its source
  repository.
sidebar:
  label: Python
  order: 1
---

The
[MissionWeaveProtocol Python SDK](https://github.com/missionweaveprotocol/python-sdk)
is the official Python reference implementation of MissionWeaveProtocol 0.1. It
includes the authoritative Core, Agent runtime, Worker Scheduler, Group gateway,
storage adapters, conformance runner, and executable proof of concept.

These instructions use a source checkout of the SDK repository.

## Requirements

- Python 3.12 or newer
- [`uv`](https://docs.astral.sh/uv/)
- Docker, for the optional PostgreSQL integration tests

## Check out and prepare the SDK

```bash
git clone https://github.com/missionweaveprotocol/python-sdk.git
cd python-sdk
uv sync --extra dev
```

The source package is
[`src/missionweaveprotocol/`](https://github.com/missionweaveprotocol/python-sdk/tree/main/src/missionweaveprotocol).
The project metadata and command entry points are defined in
[`pyproject.toml`](https://github.com/missionweaveprotocol/python-sdk/blob/main/pyproject.toml).

## Verify the source checkout

```bash
uv run pytest
uv run ruff check .
uv run ruff format --check .
uv run mypy
uv run missionweaveprotocol-conformance --root .
```

The conformance command checks all 52 vendored vectors against the 21 vendored
Draft 2020-12 schemas. The protocol repository remains normative;
[`PROTOCOL_PIN.json`](https://github.com/missionweaveprotocol/python-sdk/blob/main/PROTOCOL_PIN.json)
records the exact protocol commit and artifact digests used by the SDK.

To validate a sibling checkout of the canonical protocol repository instead:

```bash
git clone https://github.com/missionweaveprotocol/missionweaveprotocol.git ../missionweaveprotocol
uv run missionweaveprotocol-conformance --root ../missionweaveprotocol
```

## Run the proof of concept

```bash
uv run missionweaveprotocol-demo --workdir .missionweaveprotocol/poc
```

The command produces one canonical JSON report and exits with a nonzero status
if a required behavior is missing. The deterministic scenario covers two
concurrent Missions, shared Workers, child Missions, peer clarification,
scheduling, checkpoint-only preemption, recovery, Coordinator verification, and
exact human approval.

## Run the PostgreSQL integration tests

```bash
docker compose up -d --wait postgres
MISSIONWEAVEPROTOCOL_TEST_POSTGRES_URL=postgresql://missionweaveprotocol:missionweaveprotocol@127.0.0.1:55432/missionweaveprotocol \
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
export MISSIONWEAVEPROTOCOL_ORGANIZATION_PUBLIC_KEY="$(uv run python -c \
  'import json; print(json.load(open(".missionweaveprotocol/dev-keys.json"))["organizationPublicKey"])')"
export MISSIONWEAVEPROTOCOL_AUTHORITY_PRIVATE_KEY="$(uv run python -c \
  'import json; print(json.load(open(".missionweaveprotocol/dev-keys.json"))["authorityPrivateKey"])')"
export MISSIONWEAVEPROTOCOL_SESSION_SECRET='development-only-session-secret-32-bytes'

uv run missionweaveprotocol-server \
  --registry .missionweaveprotocol/dev-registry.json \
  --database-url postgresql://missionweaveprotocol:missionweaveprotocol@127.0.0.1:55432/missionweaveprotocol \
  --organization-public-key "$MISSIONWEAVEPROTOCOL_ORGANIZATION_PUBLIC_KEY" \
  --allow-insecure
```

`--allow-insecure` is only for loopback development. A deployment must provide
`--tls-certfile` and `--tls-keyfile`; MissionWeaveProtocol 0.1 requires secure
WebSocket transport over TLS 1.3.

## Build local artifacts

```bash
uv build
```

The resulting local wheel includes `py.typed` and the 21 pinned schemas used for
runtime document validation.

For implementation details, tests, and current compatibility information, use
the canonical
[SDK README](https://github.com/missionweaveprotocol/python-sdk/blob/main/README.md).
