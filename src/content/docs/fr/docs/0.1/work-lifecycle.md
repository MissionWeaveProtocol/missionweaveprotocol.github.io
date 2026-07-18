---
title: Cycle de vie du travail
description:
  Comment MissionWeaveProtocol passe de la Conversation et des Work Proposal à
  des résultats acceptés, vérifiés et approuvés par un humain.
sidebar:
  order: 3
---

:::caution[Projet de norme 0.1]

Ceci est un guide d’apprentissage non normatif. Le
[dépôt canonique du protocole](https://github.com/missionweaveprotocol/missionweaveprotocol)
reste normatif.

:::

MissionWeaveProtocol conserve la fluidité de la coopération conversationnelle
tout en rendant explicite la responsabilité d’exécution. Tout membre d’un Group
peut discuter du contexte, demander de l’aide ou proposer du travail. Une
proposition ne devient une obligation qu’au moyen d’une transition de WorkItem
autorisée.

## De la discussion à l’engagement

1. **Discuter.** Les Agent échangent des Message complets dans une Conversation
   de Group ou de WorkItem.
2. **Proposer.** Tout membre du Group peut soumettre une Work Proposal. Aucun
   WorkItem exécutable n’existe encore.
3. **Autoriser.** Le Coordinator actuel, une dérogation d’urgence du
   MissionOwner ou un Agent doté d’une Delegation Grant valide et limitée crée
   le WorkItem.
4. **Offrir.** Le Coordinator ou le délégataire à portée limitée propose le
   WorkItem à un Worker éligible et consigne le fondement de la sélection.
5. **Accepter.** Le Worker effectue son contrôle d’admission. Une acceptation
   valide commence un nouvel Ownership Epoch et place le WorkItem dans la file
   par Group de ce Worker.

:::note[L’acceptation constitue un engagement de planification]

Accepter une offre ne signifie pas l’exécuter immédiatement. Le Worker Scheduler
contrôle en dernier ressort l’ordre entre Group et démarre le WorkItem lorsque
la capacité, les dépendances, la politique et l’autorisation le permettent.

:::

## Le Work Contract

Chaque WorkItem possède un Work Contract versionné et lisible par machine. Il
consigne :

- l’objectif, les livrables et les critères d’acceptation ;
- les Evidence requises et les références d’entrée ou de dépendance ;
- les outils, données, ressources et opérations autorisés ;
- les identifiants et versions de capacité requis ;
- l’échéance, l’urgence demandée et l’impact métier ;
- les budgets financiers, de jetons, d’appels d’outil, de calcul, de temps
  écoulé et d’effets de bord ;
- les tentatives, le délai entre tentatives, l’échéance et la politique de coût
  ;
- la classification du risque et toute barrière d’Approval avant exécution.

Toute ambiguïté essentielle doit être résolue avant l’acceptation. Une révision
importante du contrat exige une nouvelle acceptation du Worker.

## Parcours de réussite courant

```text
Work Proposal
    ↓ autoriser
WorkItem à l’état open
    ↓ proposer
offered
    ↓ le Worker accepte
queued
    ↓ ownership valide, barrières d’Approval et Execution Lease
active
    ↓ le Worker soumet Artifact et Evidence
submitted
    ↓ le Coordinator accepte le résultat
verified
```

Un travail à l’état `active` peut revenir à `queued` après un Checkpoint, entrer
dans `blocked` avec un Checkpoint durable, échouer avec des Evidence ou être
annulé. Un WorkItem à l’état `blocked` libère son Capacity Slot, puis revient
dans une file ou fait l’objet d’une nouvelle offre après l’expiration de
l’ownership.

## Evidence avant Approval

L’affirmation d’un Worker ne suffit pas à prouver l’achèvement. La soumission
comprend des Artifacts et des Evidence associés aux critères d’acceptation. La
revue du Coordinator devrait valider l’intégrité des Artifacts, exécuter des
contrôles déterministes lorsqu’ils sont disponibles, demander des Evidence à un
Agent chargé de la revue pour les critères qualitatifs et conserver le résultat.

Une fois tous les WorkItem requis à l’état `verified`, le Coordinator soumet une
révision précise de la Mission et un ensemble exact d’Artifacts. Le MissionOwner
signe l’Approval finale ou demande des modifications. Une demande de
modification rouvre la même Mission sans effacer les soumissions antérieures.

Pour toutes les transitions et règles d’autorité, consultez la
[machine à états du WorkItem](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#102-workitem-state-machine)
et la
[revue fondée sur les Evidence](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#132-evidence-based-review).
