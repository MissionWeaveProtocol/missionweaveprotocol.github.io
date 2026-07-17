---
title: Python SDK
description:
  Richte das MissionWeaveProtocol Python SDK aus seinem Quell-Repository ein und
  verifiziere es.
sidebar:
  label: Python
  order: 1
---

Das
[MissionWeaveProtocol Python SDK](https://github.com/missionweaveprotocol/python-sdk)
ist die offizielle Python-Referenzimplementierung von MissionWeaveProtocol 0.1.
Es enthält den autoritativen Core, Agent Runtime, Worker Scheduler, Group
Gateway, Speicheradapter, Konformitäts-Runner und einen ausführbaren Proof of
Concept.

Diese Anleitung verwendet einen Quell-Checkout des SDK-Repository.

## Voraussetzungen

- Python 3.12 oder neuer
- [`uv`](https://docs.astral.sh/uv/)
- Docker für die optionalen PostgreSQL-Integrationstests

## SDK auschecken und vorbereiten

```bash
git clone https://github.com/missionweaveprotocol/python-sdk.git
cd python-sdk
uv sync --extra dev
```

Das Quellpaket befindet sich unter
[`src/missionweaveprotocol/`](https://github.com/missionweaveprotocol/python-sdk/tree/main/src/missionweaveprotocol).
Projektmetadaten und Command-Einstiegspunkte sind in
[`pyproject.toml`](https://github.com/missionweaveprotocol/python-sdk/blob/main/pyproject.toml)
definiert.

## Quell-Checkout verifizieren

```bash
uv run pytest
uv run ruff check .
uv run ruff format --check .
uv run mypy
uv run missionweaveprotocol-conformance --root .
```

Der Konformitäts-Command prüft alle 43 eingebetteten Vektoren gegen die 21
eingebetteten Schemas nach Draft 2020-12. Das Protokoll-Repository bleibt
normativ;
[`PROTOCOL_PIN.json`](https://github.com/missionweaveprotocol/python-sdk/blob/main/PROTOCOL_PIN.json)
zeichnet den genauen Protokoll-Commit und die vom SDK verwendeten
Artefakt-Digests auf.

So validierst du stattdessen einen benachbarten Checkout des kanonischen
Protokoll-Repository:

```bash
git clone https://github.com/missionweaveprotocol/missionweaveprotocol.git ../missionweaveprotocol
uv run missionweaveprotocol-conformance --root ../missionweaveprotocol
```

## Proof of Concept ausführen

```bash
uv run missionweaveprotocol-demo --workdir .missionweaveprotocol/poc
```

Der Command erzeugt einen kanonischen JSON-Bericht und beendet sich mit einem
Status ungleich null, wenn ein erforderliches Verhalten fehlt. Das
deterministische Szenario umfasst zwei nebenläufige Mission, gemeinsam genutzte
Worker, Child Mission, Klärung zwischen Peers, Planung, ausschließlich
Checkpoint-basierte Preemption, Wiederherstellung, Verifizierung durch den
Coordinator und genaue menschliche Approval.

## PostgreSQL-Integrationstests ausführen

```bash
docker compose up -d --wait postgres
MISSIONWEAVEPROTOCOL_TEST_POSTGRES_URL=postgresql://missionweaveprotocol:missionweaveprotocol@127.0.0.1:55432/missionweaveprotocol \
  uv run pytest tests/test_core.py -q
```

Beende anschließend den lokalen Dienst:

```bash
docker compose down --volumes
```

## Entwicklungs-Gateway ausführen

Erstelle kurzlebige Entwicklungsschlüssel und eine von der Organization
signierte Agent Registry:

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

`--allow-insecure` ist ausschließlich für die Loopback-Entwicklung vorgesehen.
Ein Deployment muss `--tls-certfile` und `--tls-keyfile` bereitstellen;
MissionWeaveProtocol 0.1 verlangt sicheren WebSocket-Transport über TLS 1.3.

## Lokale Artefakte bauen

```bash
uv build
```

Das erzeugte lokale Wheel enthält `py.typed` und die 21 gepinnten Schemas für
die Dokumentvalidierung zur Laufzeit.

Implementierungsdetails, Tests und aktuelle Kompatibilitätsinformationen stehen
in der kanonischen
[SDK-README](https://github.com/missionweaveprotocol/python-sdk/blob/main/README.md).
