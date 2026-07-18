---
title: Modèle central
description:
  Les Mission, Group, rôles, enregistrements durables et projections locales qui
  composent MissionWeaveProtocol 0.1.
sidebar:
  order: 2
---

:::caution[Projet de norme 0.1]

Ceci est un guide d’apprentissage non normatif. Le
[dépôt canonique du protocole](https://github.com/missionweaveprotocol/missionweaveprotocol)
reste normatif.

:::

MissionWeaveProtocol organise la coopération autour d’une **Mission** bornée et
de son **Group** temporaire. Chaque Mission possède exactement un Group
principal et chaque Group principal appartient à exactement une Mission.

```text
Organization
├── Agent Registry
├── Group Authority et stockage durable des Event
├── Authorization Service
└── Mission
    └── Group
        ├── MissionOwner
        ├── Coordinator
        ├── Membership des Worker
        ├── Conversation et Message
        ├── WorkItem et Work Contract
        └── Event ordonnés, Artifact, Evidence et Approval
```

## Rôles et responsabilités

| Role                  | Responsabilité                                                                              | Limite importante                                            |
| --------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Organization          | Gouverne l’identité, la politique, l’autorisation et l’infrastructure                       | Seul périmètre de confiance de la version 0.1                |
| MissionOwner          | Donne la direction, inspecte la progression, intervient et accorde l’Approval finale        | Un MissionOwner racine est humain                            |
| Coordinator           | Planifie, assigne, surveille, intègre et soumet la Mission                                  | Remplaçable ; un Coordinator Epoch invalide son prédécesseur |
| Worker                | Accepte et exécute les WorkItem avec ses propres files et son Scheduler                     | Un même Agent peut travailler dans plusieurs Group           |
| Group Authority       | Authentifie les acteurs, valide la politique, sérialise les transitions et ajoute les Event | Ordonne l’état sans gérer le sens de la Mission              |
| Authorization Service | Émet des jetons de capacité courts et limités après les vérifications requises              | Une capacité n’est pas une autorisation                      |

Une **Agent Card** porte une identité stable, signée par l’Organization, ainsi
que des capacités vérifiées. Un **Presence Record** porte une disponibilité et
une capacité éphémères. Ils sont séparés, car une disponibilité temporaire ne
doit pas réécrire une identité de confiance.

## Les enregistrements qui relient la coopération

- Une **Membership** relie un Principal à un Group, un ensemble de rôles, une
  plage de visibilité et un Membership Epoch.
- Une **Conversation** contient des Message durables pour la planification du
  Group ou pour un WorkItem.
- Un **WorkItem** est une unité exécutable du travail de la Mission. Son **Work
  Contract** définit l’objectif, les livrables, les Evidence, les permissions,
  l’échéance et le budget.
- Un **Artifact** est un livrable immuable, adressé par son contenu.
- Une **Evidence** consigne comment un Artifact ou un WorkItem satisfait les
  critères d’acceptation.
- Un **Event** est un fait accepté immuable dans l’historique monotone d’un
  Group.
- Un **Cursor** consigne la position contiguë la plus élevée des Group Event
  traitée de manière durable par un Agent.

:::note[Les Message ne deviennent jamais implicitement des assignations]

Un Message peut fournir du contexte ou proposer du travail. La responsabilité
exécutable ne commence qu’après une transition de WorkItem autorisée et
l’acceptation par le Worker.

:::

## État faisant autorité et projections locales

MissionWeaveProtocol sépare la vérité partagée de l’état du Worker pouvant être
reconstruit.

L’**état faisant autorité** comprend les Mission, Membership, WorkItem, epochs
d’ownership et de lease, reçus de déduplication, Approval et Group Event. La
Group Authority sérialise les modifications de cet état.

Les **projections locales de l’Agent** comprennent les Cursor, files par Group,
Checkpoint, boîtes d’envoi, boîtes de réception et état du Scheduler. Un Agent
peut les reconstruire à partir des Event durables. La perte d’une base locale ne
doit jamais modifier l’état autoritatif d’une Mission.

## Invariants à retenir

- Une Mission possède un Group principal et un ordre d’Event par Group.
- Une Conversation n’est jamais une autorité d’exécution.
- Le travail exclusif est délimité par les epochs d’ownership et de lease.
- Les Event acceptés et les Message consignés ne peuvent être qu’ajoutés en fin
  de journal.
- Le contexte et les identifiants d’accès d’une Mission sont isolés par défaut.
- Les budgets et permissions d’un WorkItem ou d’une sous-tâche ne peuvent pas
  dépasser ceux de leur parent.
- L’achèvement d’une Mission racine exige l’Approval humaine d’une révision
  précise et d’un ensemble exact d’Artifact.
- Les Agent publient les décisions, entrées, Evidence, motifs de blocage et
  résultats nécessaires à l’audit, mais pas leur chaîne de raisonnement privée.

Pour toutes les règles, consultez les sections normatives sur les
[invariants fondamentaux](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#4-core-invariants)
et l’
[architecture du système](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#5-system-architecture).
