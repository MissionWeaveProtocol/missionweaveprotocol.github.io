---
title: Confiance et autorité
description:
  Comment MissionWeaveProtocol sépare l’autorité liée à l’identité, à la
  Conversation, à l’assignation, à l’exécution, à l’ordonnancement et à
  l’Approval finale.
sidebar:
  order: 5
---

:::caution[Projet de norme 0.1]

Ceci est un guide d’apprentissage non normatif. Le
[dépôt canonique du protocole](https://github.com/missionweaveprotocol/missionweaveprotocol)
reste normatif.

:::

MissionWeaveProtocol 0.1 fonctionne au sein d’une seule Organization de
confiance. L’Organization est la racine de gouvernance de l’identité des Agent,
de la politique, de l’autorisation, de l’ordonnancement durable des Group et de
la responsabilité humaine.

## Une autorité délibérément répartie

| Sujet                                                          | Autorité                                             |
| -------------------------------------------------------------- | ---------------------------------------------------- |
| Identité stable et capacités vérifiées                         | Agent Registry contrôlé par l’Organization           |
| Direction de la Mission et Approval finale                     | MissionOwner                                         |
| Planification, assignation, intégration, soumission            | Coordinator Epoch actuel                             |
| Ordre d’exécution entre Group                                  | Scheduler contrôlé par le Worker                     |
| Validation des transitions et ordre des Event                  | Group Authority                                      |
| Permission d’outil, de donnée, de ressource et d’effet de bord | Authorization Service et politique de l’Organization |

La Group Authority constitue une autorité logique unique pour chaque Group. Une
implémentation peut la répliquer en interne, mais le consensus, l’élection d’un
leader et la topologie des réplicas ne sont pas exposés comme sémantique du
protocole.

Les Command et Event d’amorçage de Registry et de Session ont une portée
Organization et ne portent aucun contexte d’ordre de Group. Les Command visant
un Group existant portent les epochs d’autorité applicables à leur acteur ; les
Command réservées au Coordinator portent aussi `coordinatorEpoch` au niveau
supérieur, jamais dans le payload.

## L’identité n’est pas la présence

Une Agent Card est une identité stable, versionnée et signée par l’Organization.
Elle contient les clés publiques, les points de terminaison, les versions de
protocole prises en charge, les capacités vérifiées et la concurrence maximale.
Elle ne contient aucun identifiant d’accès réutilisable ni permission d’outil.

Un Presence Record est éphémère. Il peut indiquer la disponibilité, les Capacity
Slot libres, la disponibilité des capacités, la latence estimée de réponse et
l’heure du heartbeat. Un Presence Record obsolète ne constitue jamais une
acceptation d’assignation ni un renouvellement d’Execution Lease.

:::note[Une capacité n’est pas une autorisation]

Une capacité décrit ce qu’un Agent est vérifié comme sachant faire.
L’autorisation détermine si cet Agent peut exécuter une opération précise sur
des ressources précises, selon la politique, l’ownership, l’Execution Lease,
l’Approval et les contraintes de budget actuelles de la Mission.

:::

## Sessions et délimitation d’autorité

La négociation WebSocket utilise une clé Ed25519 enregistrée par l’Organization
et un nouveau défi. Une négociation réussie émet un jeton de session à courte
durée de vie et un nouveau Session Epoch. L’émission de l’epoch `n + 1` invalide
chaque environnement d’exécution à l’epoch `n` ou inférieur pour cette identité
d’Agent.

D’autres epochs restreignent encore l’autorité :

- un Membership Epoch invalide une ancienne version d’une Membership de Group ;
- un Coordinator Epoch invalide un Coordinator remplacé et ses délégations ;
- un Ownership Epoch invalide les anciens responsables d’un travail exclusif ;
- un Execution Lease ID invalide une période d’exécution expirée ou révoquée.

Les Command durables et les manifestes d’Artifact sont signés individuellement
sur du JSON canonique. Les Event acceptés sont signés par la Group Authority.

## Du contexte à l’effet de bord autorisé

```text
Message ou Work Proposal
        ↓ autorisation explicite
WorkItem et Work Contract
        ↓ acceptation du Worker
Ownership Epoch
        ↓ vérification de la session, de la politique, du budget et des Approval
Execution Lease et jeton de capacité à portée limitée
        ↓
Opération autorisée
```

Les Message, Agent Card, Context Package, Artifact et Group Event ne doivent pas
transporter de secret ni d’identifiant d’accès réutilisable. Les opérations à
haut risque peuvent exiger une Execution Approval humaine signée avant que
l’Authorization Service n’émette un jeton de capacité.

La Mission racine exige toujours une Approval humaine finale distincte après la
vérification des résultats par le Coordinator. Une Execution Approval autorise
une opération risquée bornée ; l’Approval finale accepte une révision terminée
de la Mission et un ensemble exact d’Artifact.

Pour toutes les règles, consultez les sections normatives sur
[l’identité et les sessions](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#6-identity-agent-registry-and-sessions),
la
[Membership et la visibilité](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#8-membership-visibility-and-attention),
ainsi que
[l’autorisation et les budgets](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#12-authorization-budgets-and-side-effects).
