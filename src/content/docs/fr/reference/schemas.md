---
title: Schémas JSON
description:
  Parcourir les 21 Schémas JSON normatifs de MissionWeaveProtocol 0.1.
sidebar:
  label: Schémas JSON
  order: 2
---

MissionWeaveProtocol 0.1 définit **21 fichiers normatifs JSON Schema Draft
2020-12**. Les fichiers canoniques se trouvent dans le
[répertoire `schemas/`](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/schemas)
du dépôt du protocole.

Les noms des propriétés transmises utilisent le lower camel case. Les objets
fondamentaux rejettent les propriétés inconnues et les données d’extension
approuvées ne sont transportées que dans des membres `extensions` explicites.

## Catalogue des schémas

| Schema                                                                                                                                          | Rôle                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [`common.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/common.schema.json)                       | Définitions partagées du protocole utilisées par les autres schémas                              |
| [`agent-card.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/agent-card.schema.json)               | Identité stable de l’Agent signée par l’Organization et capacités vérifiées                      |
| [`presence-record.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/presence-record.schema.json)     | Disponibilité et capacité éphémères de l’Agent                                                   |
| [`mission.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/mission.schema.json)                     | Objectif, ownership, budget et cycle de vie d’Approval de la Mission                             |
| [`group.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/group.schema.json)                         | Group de collaboration temporaire appartenant à une Mission                                      |
| [`group-snapshot.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/group-snapshot.schema.json)       | Group Snapshot d’archive signé de l’historique d’un Group                                        |
| [`membership.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/membership.schema.json)               | Autorisation limitée qui relie un Principal à un Group                                           |
| [`conversation.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/conversation.schema.json)           | Fil de Conversation auditable pour un Group ou un WorkItem                                       |
| [`message.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/message.schema.json)                     | Contexte conversationnel validé qui n’accorde aucune autorité d’exécution                        |
| [`work-contract.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/work-contract.schema.json)         | Objectif, livrables, critères, entrées, permissions, échéance et budget de tentatives du travail |
| [`work-item.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/work-item.schema.json)                 | Unité explicite du travail de Mission, avec cycle de vie et ownership                            |
| [`artifact.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/artifact.schema.json)                   | Manifeste de livrable immuable et adressé par son contenu                                        |
| [`evidence.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/evidence.schema.json)                   | Faits enregistrés et évalués par rapport aux critères d’acceptation                              |
| [`approval.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/approval.schema.json)                   | Approval signée d’un résultat exact de Mission                                                   |
| [`context-package.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/context-package.schema.json)     | Contexte de Mission signé, limité et porteur de provenance                                       |
| [`command.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/command.schema.json)                     | Demande signée pour une transition d’état structurée                                             |
| [`event.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/event.schema.json)                         | Fait accepté immuable dans l’historique ordonné d’un Group                                       |
| [`error.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/error.schema.json)                         | Document d’erreur structuré du protocole                                                         |
| [`lease.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/lease.schema.json)                         | Execution Lease renouvelable et protégée par epoch                                               |
| [`extension-profile.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/extension-profile.schema.json) | Définition d’extension gouvernée et métadonnées de compatibilité                                 |
| [`websocket-frame.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/websocket-frame.schema.json)     | Union canonique des trames WebSocket                                                             |

Le
[README canonique des schémas](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/README.md)
consigne les règles de validation partagées.

## Valider le dépôt du protocole

Depuis un checkout source de `missionweaveprotocol` :

```bash
python -m pip install -r requirements-validation.txt
python scripts/check_repository_policy.py
python scripts/validate_protocol.py
```

Un validateur doit enregistrer chaque schéma avec son `$id` avant de résoudre
les références. Réussir la validation des schémas démontre la conformité
structurelle, mais pas les exigences comportementales de la
[spécification](../specification/).

Le [manifest de conformité](../conformance/) fournit des instances
expected-valid et expected-invalid pour ces schémas.
