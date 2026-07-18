---
title: Python SDK
description:
  Configura y verifica MissionWeaveProtocol Python SDK desde su repositorio de
  código fuente.
sidebar:
  label: Python
  order: 1
---

El
[MissionWeaveProtocol Python SDK](https://github.com/missionweaveprotocol/python-sdk)
es la implementación oficial de referencia en Python de MissionWeaveProtocol
0.1. Incluye Core autoritativo, entorno de ejecución de Agent, Worker Scheduler,
puerta de enlace de Group, adaptadores de almacenamiento, ejecutor de
conformidad y prueba de concepto ejecutable.

Estas instrucciones utilizan un checkout del código fuente del repositorio del
SDK.

## Requisitos

- Python 3.12 o posterior
- [`uv`](https://docs.astral.sh/uv/)
- Docker, para las pruebas opcionales de integración con PostgreSQL

## Obtener y preparar el SDK

```bash
git clone https://github.com/missionweaveprotocol/python-sdk.git
cd python-sdk
uv sync --extra dev
```

El paquete de código fuente es
[`src/missionweaveprotocol/`](https://github.com/missionweaveprotocol/python-sdk/tree/main/src/missionweaveprotocol).
Los metadatos del proyecto y los puntos de entrada de comandos se definen en
[`pyproject.toml`](https://github.com/missionweaveprotocol/python-sdk/blob/main/pyproject.toml).

## Verificar el checkout del código fuente

```bash
uv run pytest
uv run ruff check .
uv run ruff format --check .
uv run mypy
uv run missionweaveprotocol-conformance --root .
```

El comando de conformidad comprueba los 52 vectores incluidos frente a los 21
schemas Draft 2020-12 incluidos. El repositorio del protocolo sigue siendo
normativo;
[`PROTOCOL_PIN.json`](https://github.com/missionweaveprotocol/python-sdk/blob/main/PROTOCOL_PIN.json)
registra el commit exacto del protocolo y los resúmenes de contenido de los
artefactos que utiliza el SDK.

Para validar en su lugar un checkout hermano del repositorio canónico del
protocolo:

```bash
git clone https://github.com/missionweaveprotocol/missionweaveprotocol.git ../missionweaveprotocol
uv run missionweaveprotocol-conformance --root ../missionweaveprotocol
```

## Ejecutar la prueba de concepto

```bash
uv run missionweaveprotocol-demo --workdir .missionweaveprotocol/poc
```

El comando genera un informe JSON canónico y termina con un estado distinto de
cero si falta un comportamiento requerido. El escenario determinista abarca dos
Missions simultáneas, Workers compartidos, una subtarea, aclaraciones entre
pares, planificación, preemption solo mediante Checkpoint, recuperación,
verificación del Coordinator y Approval humana de un resultado exacto.

## Ejecutar las pruebas de integración con PostgreSQL

```bash
docker compose up -d --wait postgres
MISSIONWEAVEPROTOCOL_TEST_POSTGRES_URL=postgresql://missionweaveprotocol:missionweaveprotocol@127.0.0.1:55432/missionweaveprotocol \
  uv run pytest tests/test_core.py -q
```

Al terminar, detén el servicio local:

```bash
docker compose down --volumes
```

## Ejecutar el gateway de desarrollo

Crea claves de desarrollo desechables y un Agent Registry firmado por la
Organization:

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

`--allow-insecure` es solo para desarrollo en loopback. Un despliegue debe
proporcionar `--tls-certfile` y `--tls-keyfile`; MissionWeaveProtocol 0.1
requiere transporte WebSocket seguro sobre TLS 1.3.

## Crear artefactos locales

```bash
uv build
```

El wheel local resultante incluye `py.typed` y los 21 schemas fijados que se
utilizan para validar documentos durante la ejecución.

Para consultar detalles de implementación, pruebas e información de
compatibilidad actual, usa el
[README canónico del SDK](https://github.com/missionweaveprotocol/python-sdk/blob/main/README.md).
