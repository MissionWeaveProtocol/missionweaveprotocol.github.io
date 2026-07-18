---
title: JSON-Schemata
description:
  Durchsuche die 21 normativen JSON-Schemata von MissionWeaveProtocol 0.1.
sidebar:
  label: JSON-Schemata
  order: 2
---

MissionWeaveProtocol 0.1 definiert **21 normative Dateien nach JSON Schema Draft
2020-12**. Die kanonischen Dateien liegen im
[`schemas/`-Verzeichnis](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/schemas)
des Protokoll-Repository.

Wire-Property-Namen verwenden lower camel case. Kernobjekte lehnen unbekannte
Properties ab, und genehmigte Erweiterungsdaten werden nur in ausdrücklichen
`extensions`-Membern übertragen.

## Schema-Katalog

| Schema                                                                                                                                          | Zweck                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [`common.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/common.schema.json)                       | Gemeinsame Protokolldefinitionen für die anderen Schemas                                           |
| [`agent-card.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/agent-card.schema.json)               | Stabile, von der Organization signierte Agent-Identität und verifizierte Capability                |
| [`presence-record.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/presence-record.schema.json)     | Vorübergehende Verfügbarkeit und Kapazität eines Agent                                             |
| [`mission.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/mission.schema.json)                     | Ziel, Ownership, Budget und Approval-Lebenszyklus einer Mission                                    |
| [`group.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/group.schema.json)                         | Temporäre Kollaborations-Group, die zu einer Mission gehört                                        |
| [`group-snapshot.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/group-snapshot.schema.json)       | Signierter Archiv-Snapshot einer Group-Historie                                                    |
| [`membership.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/membership.schema.json)               | Begrenzte Autorisierung, die einen Principal mit einer Group verbindet                             |
| [`conversation.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/conversation.schema.json)           | Auditierbarer Conversation-Thread einer Group oder eines WorkItem                                  |
| [`message.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/message.schema.json)                     | Bestätigter Conversation-Kontext, der keine Ausführungsautorität erteilt                           |
| [`work-contract.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/work-contract.schema.json)         | Arbeitsziel, Liefergegenstände, Kriterien, Eingaben, Berechtigungen, Frist und Wiederholungsbudget |
| [`work-item.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/work-item.schema.json)                 | Ausdrückliche Arbeitseinheit einer Mission einschließlich Lebenszyklus und Ownership               |
| [`artifact.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/artifact.schema.json)                   | Unveränderliches Manifest eines inhaltsadressierten Liefergegenstands                              |
| [`evidence.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/evidence.schema.json)                   | Aufgezeichnete Tatsachen, die anhand von Akzeptanzkriterien bewertet werden                        |
| [`approval.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/approval.schema.json)                   | Signierte Approval eines genauen Mission-Ergebnisses                                               |
| [`context-package.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/context-package.schema.json)     | Signierter, begrenzter Mission-Kontext mit Provenienz                                              |
| [`command.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/command.schema.json)                     | Signierte Anforderung eines strukturierten Zustandsübergangs                                       |
| [`event.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/event.schema.json)                         | Unveränderliche akzeptierte Tatsache in der geordneten Historie einer Group                        |
| [`error.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/error.schema.json)                         | Strukturiertes Protokoll-Fehlerdokument                                                            |
| [`lease.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/lease.schema.json)                         | Erneuerbare, durch Epoch geschützte Execution Lease                                                |
| [`extension-profile.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/extension-profile.schema.json) | Kontrollierte Extension Profile-Definition und Kompatibilitätsmetadaten                            |
| [`websocket-frame.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/websocket-frame.schema.json)     | Kanonische WebSocket-Frame-Union                                                                   |

Die kanonische
[Schema-README](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/README.md)
dokumentiert die gemeinsamen Validierungsregeln.

## Das Protokoll-Repository validieren

Aus einem Quell-Checkout von `missionweaveprotocol`:

```bash
python -m pip install -r requirements-validation.txt
python scripts/check_repository_policy.py
python scripts/validate_protocol.py
```

Ein Validator muss jedes Schema über seine `$id` registrieren, bevor er
Referenzen auflöst. Das Bestehen der Schema-Validierung belegt strukturelle
Konformität, nicht die Verhaltensanforderungen der
[Spezifikation](../specification/).

Das [Konformitätsmanifest](../conformance/) stellt für diese Schemas erwartbar
gültige und ungültige Instanzen bereit.
