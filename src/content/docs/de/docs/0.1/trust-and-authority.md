---
title: Vertrauen und Autorität
description:
  Wie MissionWeaveProtocol Autorität für Identität, Conversation, Zuweisung,
  Ausführung, Reihenfolge und finale Approval trennt.
sidebar:
  order: 5
---

:::caution[Standardentwurf 0.1]

Dies ist ein nicht normativer Lernleitfaden. Das
[kanonische Protokoll-Repository](https://github.com/missionweaveprotocol/missionweaveprotocol)
bleibt normativ.

:::

MissionWeaveProtocol 0.1 arbeitet innerhalb einer vertrauenswürdigen
Organization. Die Organization ist die Governance-Wurzel für Agent-Identität,
Richtlinien, Autorisierung, dauerhafte Group-Reihenfolge und menschliche
Verantwortlichkeit.

## Autorität wird bewusst aufgeteilt

| Bereich                                               | Autorität                                         |
| ----------------------------------------------------- | ------------------------------------------------- |
| Stabile Identität und verifizierte Capability         | Von der Organization kontrollierte Agent Registry |
| Mission-Ausrichtung und finale Approval               | MissionOwner                                      |
| Planung, Zuweisung, Integration und Einreichung       | Aktueller Coordinator Epoch                       |
| Ausführungsreihenfolge zwischen Group                 | Scheduler des Worker                              |
| Übergangsvalidierung und Event-Reihenfolge pro Group  | Group Authority                                   |
| Berechtigung für Tools, Daten, Ressourcen und Effekte | Authorization Service und Organization-Richtlinie |

Die Group Authority ist eine logische Autorität pro Group. Eine Implementierung
kann sie intern replizieren, doch Konsens, Leader Election und Replikattopologie
werden nicht als Protokollsemantik offengelegt.

Bootstrap-Command und -Event für Registry und Session haben Organization-weiten
Geltungsbereich und enthalten keinen Group-Reihenfolgekontext. Command für eine
bestehende Group tragen die für ihren Akteur geltenden Autoritäts-Epochen; nur
dem Coordinator vorbehaltene Command tragen zusätzlich `coordinatorEpoch` auf
der obersten Ebene und niemals im Payload.

## Identität ist kein Presence Record

Eine Agent Card ist eine stabile, versionierte und von der Organization
signierte Identität. Sie enthält öffentliche Schlüssel, Endpunkte, unterstützte
Protokollversionen, verifizierte Capability und maximale Nebenläufigkeit. Sie
enthält keine wiederverwendbaren Anmeldedaten oder Tool-Berechtigungen.

Ein Presence Record ist vorübergehend. Er kann Verfügbarkeit, freie Capacity
Slot, Verfügbarkeit von Capability, geschätzte Antwortlatenz und Heartbeat-Zeit
melden. Ein veralteter Presence Record bedeutet niemals die Annahme einer
Zuweisung oder die Verlängerung einer Lease.

:::note[Capability ist keine Autorisierung]

Eine Capability beschreibt, wozu ein Agent nachweislich fähig ist. Autorisierung
bestimmt, ob dieser Agent einen bestimmten Vorgang an bestimmten Ressourcen
unter den aktuellen Einschränkungen für Mission-Richtlinie, Ownership, Lease,
Approval und Budget ausführen darf.

:::

## Session und Fencing

Der WebSocket-Handshake verwendet einen bei der Organization registrierten
Ed25519-Schlüssel und eine neue Challenge. Ein erfolgreicher Handshake stellt
ein kurzlebiges Session Token und einen neuen Session Epoch aus. Die Ausgabe von
Epoch `n + 1` schützt die Agent-Identität vor jedem Runtime mit Epoch `n` oder
niedriger.

Weitere Epoch begrenzen die Autorität zusätzlich:

- Ein Membership Epoch schützt vor einer älteren Version einer Group Membership.
- Ein Coordinator Epoch schützt vor einem ersetzten Coordinator und dessen
  Grants.
- Ein Ownership Epoch schützt vor früheren Eigentümern exklusiver Arbeit.
- Eine Execution Lease ID schützt vor einem abgelaufenen oder widerrufenen
  Ausführungszeitraum.

Dauerhafte Command und Artifact-Manifeste werden einzeln über kanonischem JSON
signiert. Akzeptierte Event werden von der Group Authority signiert.

## Vom Kontext zum erlaubten Seiteneffekt

```text
Message oder Work Proposal
        ↓ ausdrückliche Autorisierung
WorkItem und Work Contract
        ↓ Annahme durch den Worker
Ownership Epoch
        ↓ Prüfung von Session, Richtlinie, Budget und Approval
Execution Lease und begrenztes Capability Token
        ↓
Erlaubter Vorgang
```

Message, Agent Card, Context Package, Artifact und Group Event dürfen keine
Geheimnisse oder wiederverwendbaren Anmeldedaten enthalten. Vorgänge mit hohem
Risiko können eine signierte menschliche Execution Approval erfordern, bevor der
Authorization Service ein Capability Token ausstellt.

Die Root Mission benötigt weiterhin eine getrennte finale menschliche Approval,
nachdem der Coordinator die Ergebnisse verifiziert hat. Execution Approval
erlaubt einen begrenzten riskanten Vorgang; finale Approval akzeptiert eine
abgeschlossene Mission-Revision und einen Artifact-Satz.

Die vollständigen Regeln stehen in den normativen Abschnitten zu
[Identität und Session](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#6-identity-agent-registry-and-sessions),
[Membership und Sichtbarkeit](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#8-membership-visibility-and-attention)
und
[Autorisierung und Budgets](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#12-authorization-budgets-and-side-effects).
