---
title: MissionWeaveProtocol 0.1
description:
  Lies die normative MissionWeaveProtocol-Spezifikation und das
  Protokollglossar.
sidebar:
  label: Spezifikation
  order: 1
banner:
  content:
    MissionWeaveProtocol 0.1 ist ein <strong>Standardentwurf</strong>. Verwende
    das kanonische Repository für normative Anforderungen.
---

MissionWeaveProtocol 0.1 definiert Group-orientierte Zusammenarbeit für autonome
Agent innerhalb einer Organization. Es behandelt Identität, Mission Group,
ausdrückliche WorkItem, Message zwischen Peers, Planung, Autorität, dauerhafte
Reihenfolge, Replay, Verifizierung und menschliche Approval.

## Normative Quelle

Diese Website erläutert MissionWeaveProtocol und verweist darauf, ist jedoch
nicht die normative Protokollquelle. Das
[`missionweaveprotocol`-Repository](https://github.com/missionweaveprotocol/missionweaveprotocol)
enthält die autoritativen Artefakte:

- [MissionWeaveProtocol 0.1-Spezifikation](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md)
- [Protokollglossar](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/CONTEXT.md)
- [Normative JSON-Schemata](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/schemas)
- [Konformitätsmanifest und -vektoren](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/conformance)
- [Kryptografiemanifest und -vektoren für signierte Dokumente](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/cryptography)

Wenn dieser Leitfaden und ein normatives Artefakt voneinander abweichen, ist das
Artefakt im Protokoll-Repository maßgeblich.

## Version und Kennungen

Die aktuelle Protokollversion ist `0.1`. Ihr Wire-Namespace lautet
`missionweaveprotocol`:

- Protokollkennungen verwenden `urn:missionweaveprotocol:*`;
- integrierte Erweiterungsarten verwenden `ext.missionweaveprotocol.*`;
- Schema-Kennungen verwenden `https://missionweaveprotocol.dev/schemas/0.1/`.

Protokoll- und SDK-Releases werden unabhängig voneinander versioniert. Eine
Implementierung sollte ihre Kompatibilität deklarieren und eine veröffentlichte
Protokollversion oder einen genauen Commit pinnen, statt Kompatibilität aus
gleichen Versionsnummern abzuleiten.

## Empfohlene Lesereihenfolge

1. Beginne mit dem
   [Protokollglossar](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/CONTEXT.md),
   um das gemeinsame Vokabular kennenzulernen.
2. Lies die
   [normative Spezifikation](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md)
   für Anforderungen und Lebenszyklusregeln.
3. Verwende die [Schema-Referenz](../schemas/) für die Dokumentstruktur.
4. Führe die [Konformitätsvektoren](../conformance/) gegen eine Implementierung
   aus.
5. Folge dem [Quellleitfaden für das Python SDK](../../sdk/python/), um die
   Referenzimplementierung zu erproben.

Schema-Validierung belegt nur die Dokumentstruktur. Verhaltenskonformität
erfordert außerdem die Regeln der Spezifikation zu Zustandsmaschine,
Reihenfolge, Epoch, Lease, Budget, Hierarchie, Zeitstempel, Signatur,
Autorisierung und Replay.
