---
title: Python SDK
description:
  Installer et vérifier le Python SDK de MissionWeaveProtocol depuis son dépôt
  source.
sidebar:
  label: Python
  order: 1
---

Le
[Python SDK de MissionWeaveProtocol](https://github.com/missionweaveprotocol/python-sdk)
est l’implémentation de référence officielle en Python de MissionWeaveProtocol
0.1. Il comprend le Core faisant autorité, l’environnement d’exécution des
Agent, le Worker Scheduler, la passerelle de Group, les adaptateurs de stockage,
l’outil de conformité et une preuve de concept exécutable.

Ces instructions utilisent un checkout source du dépôt du SDK.

## Prérequis

- Python 3.12 ou version ultérieure
- [`uv`](https://docs.astral.sh/uv/)
- Docker, pour les tests d’intégration PostgreSQL facultatifs

## Checkout et préparation du SDK

```bash
git clone https://github.com/missionweaveprotocol/python-sdk.git
cd python-sdk
uv sync --extra dev
```

Le package source est
[`src/missionweaveprotocol/`](https://github.com/missionweaveprotocol/python-sdk/tree/main/src/missionweaveprotocol).
Les métadonnées du projet et les points d’entrée des commandes sont définis dans
[`pyproject.toml`](https://github.com/missionweaveprotocol/python-sdk/blob/main/pyproject.toml).

## Vérifier le checkout source

```bash
uv run pytest
uv run ruff check .
uv run ruff format --check .
uv run mypy
uv run missionweaveprotocol-conformance --root .
```

La commande de conformité vérifie les 52 vecteurs embarqués par rapport aux 21
schémas Draft 2020-12 embarqués. Le dépôt du protocole reste normatif ;
[`PROTOCOL_PIN.json`](https://github.com/missionweaveprotocol/python-sdk/blob/main/PROTOCOL_PIN.json)
enregistre le commit exact du protocole et les empreintes d’artefact utilisées
par le SDK.

Pour valider à la place un checkout voisin du dépôt canonique du protocole :

```bash
git clone https://github.com/missionweaveprotocol/missionweaveprotocol.git ../missionweaveprotocol
uv run missionweaveprotocol-conformance --root ../missionweaveprotocol
```

## Exécuter la preuve de concept

```bash
uv run missionweaveprotocol-demo --workdir .missionweaveprotocol/poc
```

La commande produit un rapport JSON canonique et se termine avec un statut non
nul si un comportement requis manque. Le scénario déterministe couvre deux
Missions concurrentes, des Workers partagés, une sous-tâche, la clarification
entre pairs, la planification, la préemption uniquement aux Checkpoint, la
récupération, la vérification du Coordinator et l’Approval humaine du résultat
exact.

## Exécuter les tests d’intégration PostgreSQL

```bash
docker compose up -d --wait postgres
MISSIONWEAVEPROTOCOL_TEST_POSTGRES_URL=postgresql://missionweaveprotocol:missionweaveprotocol@127.0.0.1:55432/missionweaveprotocol \
  uv run pytest tests/test_core.py -q
```

Une fois terminé, arrêtez le service local :

```bash
docker compose down --volumes
```

## Exécuter le gateway de développement

Créez des clés de développement jetables et un Agent Registry signé par
l’Organization :

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

`--allow-insecure` est réservé au développement en boucle locale. Un déploiement
doit fournir `--tls-certfile` et `--tls-keyfile` ; MissionWeaveProtocol 0.1
exige un transport WebSocket sécurisé sur TLS 1.3.

## Construire les artefacts locaux

```bash
uv build
```

Le wheel local obtenu contient `py.typed` et les 21 schémas fixés utilisés pour
la validation des documents à l’exécution.

Pour les détails d’implémentation, les tests et les informations de
compatibilité actuelles, consultez le
[README canonique du SDK](https://github.com/missionweaveprotocol/python-sdk/blob/main/README.md).
