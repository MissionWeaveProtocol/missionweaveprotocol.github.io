---
title: Planification entre les Group
description:
  Files de Worker par Group, planification globale, Capacity Slot isolés,
  préemption sûre aux Checkpoint et Replay dans MissionWeaveProtocol 0.1.
sidebar:
  label: Planification
  order: 4
---

:::caution[Projet de norme 0.1]

Ceci est un guide d’apprentissage non normatif. Le
[dépôt canonique du protocole](https://github.com/missionweaveprotocol/missionweaveprotocol)
reste normatif.

:::

Un Worker peut appartenir à plusieurs Mission Group sans fusionner leurs
contextes. Il maintient une boîte de réception d’Event, un Cursor et une file de
travail distincts pour chaque Group, puis utilise un Scheduler contrôlé par le
Worker pour sélectionner les WorkItem éligibles entre ces files.

```text
Event du Group A → file du Group A ┐
Event du Group B → file du Group B ├→ Worker Scheduler → slots d’exécution isolés
Event du Group C → file du Group C ┘
```

## Qui contrôle la priorité

Le Coordinator fournit l’urgence demandée, l’échéance et l’impact métier pour sa
Mission. Le Worker Scheduler contrôle en dernier ressort l’ordre entre les
Group. Un Coordinator ne peut pas forcer sa Mission à passer devant des Group
sans rapport ; une modification de priorité à l’échelle de l’Organization passe
par la politique ou le MissionOwner.

Le Scheduler doit fournir une équité pondérée et éviter la famine. Son ordre
effectif devrait prendre en compte :

- la classe de priorité de l’Organization ;
- les échéances et le vieillissement des files ;
- les quotas par Group ;
- le risque et les barrières d’Approval ;
- les ressources et Capacity Slot disponibles.

Une planification illimitée strictement par priorité maximale n’est pas
conforme, car un Group très actif ou urgent pourrait affamer tous les autres
Group.

## Divulgation respectueuse de la confidentialité

Lorsqu’un Worker accepte une offre ou modifie sensiblement son planning, il
devrait publier une fenêtre estimée de début, une estimation de fin, son niveau
de confiance, l’état de sa capacité et l’heure du calcul. Il ne doit pas révéler
l’identité, le contenu, les assignations ni la position globale exacte dans la
file d’un autre Group.

Chaque Capacity Slot isole le contexte de Mission, les identifiants d’accès, les
Checkpoint, les budgets d’outil et les clés d’effet de bord de tous les autres
Capacity Slot.

## Ownership, Execution Lease et préemption sûre

L’acceptation démarre un Ownership Epoch et une échéance de démarrage. Le début
du travail exige également une Execution Lease liée à l’Agent, au Session Epoch,
au WorkItem, à l’Ownership Epoch et à son expiration.

Une modification de priorité réordonne immédiatement le travail à l’état
`queued`. Un travail à l’état `active` n’est pas interrompu à un point
dangereux. La préemption coopérative suit une séquence durable :

1. le Scheduler demande la préemption ;
2. le Worker atteint un Checkpoint sûr et idempotent ;
3. le Worker enregistre ce Checkpoint et se met en pause ;
4. le Capacity Slot est libéré ;
5. le WorkItem revient dans la file de son Group pour une reprise ultérieure.

Le blocage suit le même principe de sécurité : enregistrer un Checkpoint,
émettre le motif de blocage, libérer la capacité, puis reprendre ou réassigner
selon les règles actuelles d’ownership et de lease.

## Récupération par Replay

Les files par Group sont des projections locales des Group Event durables. Un
Worker redémarré restaure ses Cursor et ses files depuis un Group Snapshot et un
Replay ordonné. La livraison des Event a lieu au moins une fois : le Worker
déduplique par Event ID et n’avance que le Cursor durable contigu le plus élevé
pour chaque Group.

MissionWeaveProtocol définit l’ordre au sein d’un Group, pas un ordre global
entre les Group.

Pour toutes les règles, consultez les sections normatives sur la
[planification, l’exécution et la récupération](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#11-scheduling-execution-and-recovery)
et sur la
[livraison et le Replay](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#16-delivery-replay-and-acknowledgement).
