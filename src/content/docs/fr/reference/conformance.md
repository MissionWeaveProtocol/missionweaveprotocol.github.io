---
title: Conformité
description:
  Exécuter les 52 vecteurs de conformité de MissionWeaveProtocol indépendants de
  l’implémentation.
sidebar:
  label: Conformité
  order: 3
---

MissionWeaveProtocol 0.1 fournit **52 cas de conformité indépendants de
l’implémentation** :

| Résultat attendu | Cas | Répertoire canonique                                                                                                                 |
| ---------------- | --: | ------------------------------------------------------------------------------------------------------------------------------------ |
| Valide           |  25 | [`conformance/vectors/valid/`](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/conformance/vectors/valid)     |
| Invalide         |  27 | [`conformance/vectors/invalid/`](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/conformance/vectors/invalid) |

Le fichier canonique
[`manifest.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/conformance/manifest.json)
associe chaque cas à un schéma, un document d’instance et sa validité attendue.
Consultez le
[README de conformité](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/conformance/README.md)
pour les exigences normatives d’utilisation.

## Ce que prouvent les vecteurs

L’exécution des 52 cas vérifie qu’une implémentation respecte les règles
structurelles du protocole pour les documents. Les cas invalides couvrent des
formes délibérément rejetées, telles que des signatures manquantes, des états de
cycle de vie invalides, un ownership absent, un comportement d’extension
dangereux ou une provenance incohérente.

Réussir le manifeste est nécessaire, mais insuffisant. La conformité
comportementale exige également les règles de machine à états, d’ordonnancement,
d’autorisation, de signature, d’epoch, de lease, de budget, de hiérarchie, de
timestamp et de Replay définies dans la
[spécification normative](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md).

## Valider depuis le checkout du protocole

```bash
python -m pip install -r requirements-validation.txt
python scripts/check_repository_policy.py
python scripts/validate_protocol.py
```

## Exécuter avec le Python SDK

Avec des copies de travail source voisines nommées `missionweaveprotocol` et
`python-sdk`, exécutez ceci depuis la copie de travail du protocole :

```bash
uv run --project ../python-sdk missionweaveprotocol-conformance --root .
```

Ou exécutez ceci depuis la copie de travail du Python SDK :

```bash
uv run missionweaveprotocol-conformance --root ../missionweaveprotocol
```

Le Python SDK embarque également le même ensemble de schémas et de vecteurs pour
la validation hors ligne. Son fichier
[`PROTOCOL_PIN.json`](https://github.com/missionweaveprotocol/python-sdk/blob/main/PROTOCOL_PIN.json)
enregistre le commit exact du protocole et les empreintes de contenu utilisés
par cette copie de travail.
