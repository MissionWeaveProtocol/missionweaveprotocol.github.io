---
title: Terminologie de MissionWeaveProtocol
description:
  Termes essentiels de MissionWeaveProtocol pour l’identité, la collaboration,
  le travail, la planification et l’approbation.
sidebar:
  badge:
    text: Brouillon 0.1
    variant: caution
---

Cette page est une référence d’apprentissage concise. Le
[glossaire canonique du protocole](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/CONTEXT.md)
définit le vocabulaire normatif de MissionWeaveProtocol 0.1.

## Organization et identité

**Organization** : périmètre de gouvernance de confiance qui enregistre les
Agent, authentifie les humains et définit la politique.

**Agent** : environnement d’exécution planifié indépendamment, doté d’une
identité stable et d’au plus une session active.

**Agent Card** : description de l’identité stable, signée par l’Organization, et
des capacités vérifiées et versionnées. Elle ne contient ni permission ni
identifiant d’accès réutilisable.

**Agent Registry** : source contrôlée par l’Organization pour les Agent Card,
les clés de signature, les Evidence de capacité et l’état de validité.

**Presence Record** : informations éphémères de disponibilité, de capacité et de
heartbeat, conservées séparément de l’Agent Card stable.

**Group Authority** : infrastructure de l’Organization qui valide l’identité, la
Membership, la politique et les transitions d’état structurées, tout en ajoutant
l’historique ordonné des Group Event.

## Collaboration dans une Mission

**Mission** : objectif borné assorti d’une définition de l’achèvement, d’un
budget, d’une échéance et d’un cycle de vie d’Approval.

**Group** : espace de collaboration temporaire et historique partagé appartenant
à exactement une Mission.

**MissionOwner** : Principal responsable. Un MissionOwner racine est humain et
détient l’autorité d’Approval finale, d’annulation et de remplacement du
Coordinator.

**Coordinator** : Agent remplaçable chargé de la planification, de
l’assignation, du suivi de la progression, de l’intégration, de la vérification
et de la soumission.

**Worker** : Agent qui accepte et exécute des WorkItem au moyen de ses propres
files et de son Scheduler. Un Worker peut appartenir à plusieurs Group.

**Membership** : autorisation à portée limitée qui relie un Agent ou un
MissionOwner à un Group.

## Conversation et travail

**Conversation** : fil auditable de Message limité à un Group ou à un WorkItem.

**Message** : contexte conversationnel validé. Un Message seul n’accorde jamais
d’autorité exécutable.

**Work Proposal** : demande non exécutable d’un membre du Group visant à créer
un WorkItem.

**WorkItem** : unité explicite de travail de Mission, avec un responsable, un
cycle de vie, des dépendances et un Work Contract.

**Work Offer** : invitation à durée limitée faite à un Worker éligible pour
accepter un WorkItem après son contrôle d’admission local.

**Work Contract** : objectif, livrables, critères d’acceptation, entrées,
permissions, échéance et budget de tentatives d’un WorkItem.

**Artifact** : livrable immuable, adressé par son contenu, produit ou référencé
par le travail d’une Mission.

**Evidence** : faits enregistrés servant à évaluer un Artifact ou un WorkItem
par rapport à ses critères d’acceptation.

**Context Package** : résumé signé, versionné et porteur de provenance qui
fournit à un Agent un contexte de Mission à portée limitée.

## Coordination et exécution

**Command** : demande signée d’un acteur autorisé visant une transition d’état
structurée.

**Event** : fait accepté immuable dans l’historique monotone d’un Group.

**Cursor** : position contiguë la plus élevée des Group Event traitée de manière
durable par un Agent.

**Ownership Lease** : réservation bornée qui maintient un Worker assigné à un
WorkItem exclusif.

**Execution Lease** : autorisation renouvelable avec fencing, qui invalide les
autorisations obsolètes et permet à une session de Worker sous un Ownership
Epoch d’exécuter un WorkItem exclusif.

**Scheduler** : politique contrôlée par le Worker qui sélectionne les WorkItem
éligibles parmi les files par Group et les Capacity Slot.

**Checkpoint** : référence durable d’un état d’exécution pouvant être repris en
toute sécurité, utilisée pour le blocage, la récupération et la préemption
coopérative.

**Approval** : décision durable et signée qui accepte une révision précise de
Mission et un ensemble exact d’Artifact. Une Mission racine ne se termine
qu’après une Approval humaine.

## Hiérarchie et extension

**sous-tâche (Child Mission)** : Mission autonome créée pour achever un WorkItem
complexe d’une Mission parente. Ce n’est pas un WorkItem ; ses budgets et son
autorité sont plus restreints que ceux de la Mission parente.

**Follow-up Mission** : nouvelle Mission liée à une Mission approuvée et
immuable lorsqu’une correction ou un travail supplémentaire devient nécessaire.

**Extension Profile** : ensemble versionné de schémas et de sémantique, approuvé
par l’Organization, qui ne peut pas remplacer les invariants fondamentaux de
MissionWeaveProtocol.
