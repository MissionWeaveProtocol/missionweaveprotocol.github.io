---
title: SDK
description:
  Choisissez un SDK MissionWeaveProtocol officiel et comprenez son périmètre de
  conformité actuel.
sidebar:
  label: Vue d’ensemble
  order: 1
---

MissionWeaveProtocol fournit une implémentation de référence Python complète et
cinq SDK de protocole officiels. Chaque SDK est versionné indépendamment et fixe
le commit exact du protocole ainsi que les condensats des Artifact qu’il
implémente.

## Matrice des capacités et de l’état

| SDK                                                                  | Périmètre actuel                     | Bindings de protocole | Conformité des schémas et vecteurs | Runtime comportemental complet |
| -------------------------------------------------------------------- | ------------------------------------ | --------------------- | ---------------------------------- | ------------------------------ |
| [Python](https://github.com/missionweaveprotocol/python-sdk)         | Implémentation de référence complète | Oui                   | 43/43 vecteurs                     | Oui                            |
| [Go](https://github.com/missionweaveprotocol/go-sdk)                 | SDK de protocole officiel            | Oui                   | 43/43 vecteurs                     | Non                            |
| [TypeScript](https://github.com/missionweaveprotocol/typescript-sdk) | SDK de protocole officiel            | Oui                   | 43/43 vecteurs                     | Non                            |
| [Java](https://github.com/missionweaveprotocol/java-sdk)             | SDK de protocole officiel            | Oui                   | 43/43 vecteurs                     | Non                            |
| [Rust](https://github.com/missionweaveprotocol/rust-sdk)             | SDK de protocole officiel            | Oui                   | 43/43 vecteurs                     | Non                            |
| [C++](https://github.com/missionweaveprotocol/cpp-sdk)               | SDK de protocole officiel            | Oui                   | 43/43 vecteurs                     | Non                            |

La conformité des schémas et vecteurs couvre le traitement JSON strict, la
validation hors ligne avec les 21 schémas Draft 2020-12 épinglés, le JSON
canonique et les ID de contenu, les signatures Ed25519, la validation des Frame
et les 43 vecteurs de conformité épinglés. Elle n’établit pas à elle seule la
conformité de la planification, de la persistance, de la reprise, du transport
ou d’autres comportements du runtime.

## Choisir un SDK

Utilisez le [guide du Python SDK](./python/) si vous avez besoin du runtime de
référence complet, notamment du Core, du runtime des Agent, du Worker Scheduler,
de la passerelle de Group, des adaptateurs de stockage et de la preuve de
concept exécutable.

Utilisez le dépôt Go, TypeScript, Java, Rust ou C++ si vous avez besoin de
bindings de protocole natifs, de validation, de canonicalisation, de signatures
et de Frame Codec. Les commandes d’installation et de vérification sont
maintenues dans le README de chaque dépôt. La spécification du protocole et les
Artifact de conformité restent normatifs.
