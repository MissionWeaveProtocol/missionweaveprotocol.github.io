---
title: MissionWeaveProtocol 0.1
description:
  Consulter la spécification normative de MissionWeaveProtocol et le glossaire
  du protocole.
sidebar:
  label: Spécification
  order: 1
banner:
  content:
    MissionWeaveProtocol 0.1 est un <strong>projet de norme</strong>. Utilisez
    le dépôt canonique pour les exigences normatives.
---

MissionWeaveProtocol 0.1 définit une coopération orientée Group pour des Agent
autonomes travaillant au sein d’une même Organization. Il couvre l’identité, les
Mission Group, les WorkItem explicites, les Message entre pairs, la
planification, l’autorité, l’ordonnancement durable, le replay, la vérification
et l’approbation humaine.

## Source normative

Ce site explique MissionWeaveProtocol et fournit des liens vers ses ressources,
mais il n’est pas la source normative du protocole. Le
[dépôt `missionweaveprotocol`](https://github.com/missionweaveprotocol/missionweaveprotocol)
contient les artefacts faisant autorité :

- [Spécification MissionWeaveProtocol 0.1](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md)
- [Glossaire du protocole](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/CONTEXT.md)
- [JSON Schemas normatifs](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/schemas)
- [Manifeste et vecteurs de conformité](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/conformance)
- [Manifeste et vecteurs cryptographiques de documents signés](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/cryptography)

En cas de divergence entre ce guide et un artefact normatif, l’artefact du dépôt
du protocole prévaut.

## Version et identifiants

La version actuelle du protocole est `0.1`. Son wire namespace est
`missionweaveprotocol` :

- les identifiants du protocole utilisent `urn:missionweaveprotocol:*` ;
- les types d’extension intégrés utilisent `ext.missionweaveprotocol.*` ;
- les identifiants de schéma utilisent
  `https://missionweaveprotocol.dev/schemas/0.1/`.

Les versions du protocole et du SDK sont gérées indépendamment. Une
implémentation devrait déclarer sa compatibilité et fixer une version publiée du
protocole ou un commit exact, plutôt que de déduire la compatibilité de numéros
de version identiques.

## Parcours de lecture

1. Commencez par le
   [glossaire du protocole](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/CONTEXT.md)
   afin de partager le même vocabulaire.
2. Lisez la
   [spécification normative](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md)
   pour connaître les exigences et les règles de cycle de vie.
3. Consultez la [référence des schémas](../schemas/) pour la structure des
   documents.
4. Exécutez les [vecteurs de conformité](../conformance/) sur une
   implémentation.
5. Suivez le [guide source du Python SDK](../../sdk/python/) pour exercer
   l’implémentation de référence.

La validation des schémas ne prouve que la structure des documents. La
conformité comportementale exige également le respect des règles de machine à
états, d’ordonnancement, d’epoch, d’Execution Lease, de budget, de hiérarchie,
d’horodatage, de signature, d’autorisation et de replay définies dans la
spécification.
