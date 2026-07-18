---
title: Sous-tâche
description:
  Décomposition récursive de WorkItem complexes au moyen de sous-tâches bornées
  et dotées de leur propre Group, sans perdre la portée, le budget, les Evidence
  ni la responsabilité humaine.
sidebar:
  order: 6
---

:::caution[Projet de norme 0.1]

Ceci est un guide d’apprentissage non normatif. Le
[dépôt canonique du protocole](https://github.com/missionweaveprotocol/missionweaveprotocol)
reste normatif.

:::

Un WorkItem suffisamment complexe peut devenir une **sous-tâche (Child
Mission)**. Ici, « sous-tâche » désigne une Mission autonome, pas un WorkItem.
Elle possède son propre Group, son Coordinator, son graphe de WorkItem, ses
Membership, son budget, son échéance et sa politique d’Approval. Le WorkItem
parent et la sous-tâche se référencent mutuellement.

```text
Mission racine et son Group
└── le WorkItem parent passe à `blocked`
    └── sous-tâche avec son propre Group
        ├── Coordinator de la sous-tâche
        ├── WorkItem de la sous-tâche et Evidence
        └── Approval de la sous-tâche
            └── le résultat revient comme Evidence et Artifact
                pour le WorkItem parent
```

:::note[Une Mission possède toujours un seul Group]

La création d’une sous-tâche ne transforme pas le Group parent en salon de
discussion imbriqué. La sous-tâche reçoit un Group distinct et ne partage avec
la Mission parente que des résumés autorisés, des Artifact, des Evidence et des
liens stables.

:::

## Autorité et Approval

Par défaut, le Coordinator de la sous-tâche examine et soumet son résultat. Le
Coordinator de la Mission parente agit comme MissionOwner de la sous-tâche et
l’approuve au nom du WorkItem parent. La politique de risque de l’Organization
peut également exiger une approbation humaine directe.

Le résultat approuvé de la sous-tâche devient une Evidence et des Artifact pour
le WorkItem parent. Le Coordinator de la Mission parente reçoit les changements
d’état, les résumés, les estimations révisées, les motifs de blocage, les
escalades de budget ou de politique et les résultats finaux. Il n’a pas besoin
de chaque Message de la sous-tâche, mais conserve un droit d’inspection autorisé
à la demande. Le MissionOwner racine peut inspecter l’arbre complet des Mission.

## La portée se réduit à chaque niveau

Le graphe parent-enfant doit rester acyclique. Le budget, l’échéance, les
Capability, l’accès aux données et les permissions de la sous-tâche doivent être
des sous-ensembles de ceux de la Mission parente. Chaque Organization configure
une profondeur maximale par défaut et exige l’Approval explicite du MissionOwner
ou de la politique au-delà de ce seuil.

La limite de profondeur est un garde-fou, pas un plafond fixe. Un travail
complexe légitime peut continuer lorsqu’une Approval explicite accorde la portée
ou la profondeur supplémentaire.

## Un échec n’entraîne pas automatiquement celui du WorkItem parent

Une sous-tâche en échec émet une Evidence d’échec structurée et bloque ou fait
échouer le WorkItem parent selon sa politique déclarée. Le Coordinator de la
Mission parente peut replanifier, réviser la portée, créer une sous-tâche de
remplacement ou annuler la branche. L’échec ne se propage automatiquement que si
la politique d’achèvement du WorkItem parent déclare la sous-tâche indispensable
et ne prévoit aucune alternative.

## Sous-tâche ou Follow-up Mission ?

- Utilisez une **sous-tâche** pour achever un WorkItem complexe au sein d’une
  Mission parente active.
- Utilisez une **Follow-up Mission** pour une correction, une remédiation ou un
  travail supplémentaire après qu’une Mission approuvée est devenue immuable.

Pour toutes les règles, consultez les sections normatives sur les
[Missions parentes et sous-tâches](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#14-parent-and-child-missions)
et le
[cycle de vie des Mission](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#7-mission-and-group-lifecycle).
