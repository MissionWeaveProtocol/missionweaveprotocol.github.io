---
title: Kernmodell
description:
  Die Mission, Group, Rollen, dauerhaften Datensätze und lokalen Projektionen,
  aus denen MissionWeaveProtocol 0.1 besteht.
sidebar:
  order: 2
---

:::caution[Standardentwurf 0.1]

Dies ist ein nicht normativer Lernleitfaden. Das
[kanonische Protokoll-Repository](https://github.com/missionweaveprotocol/missionweaveprotocol)
bleibt normativ.

:::

MissionWeaveProtocol organisiert die Zusammenarbeit um eine begrenzte
**Mission** und ihren temporären **Group**. Jede Mission besitzt genau einen
primären Group, und jede primäre Group gehört genau zu einer Mission.

```text
Organization
├── Agent Registry
├── Group Authority und dauerhafter Event-Speicher
├── Authorization Service
└── Mission
    └── Group
        ├── MissionOwner
        ├── Coordinator
        ├── Worker-Membership
        ├── Conversation und Message
        ├── WorkItem und Work Contract
        └── geordnete Event, Artifact, Evidence und Approval
```

## Rollen und Verantwortlichkeiten

| Rolle                 | Verantwortung                                                                             | Wichtige Grenze                                                            |
| --------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Organization          | Regelt Identität, Richtlinien, Autorisierung und Infrastruktur                            | Sie ist die einzige Vertrauensgrenze in 0.1                                |
| MissionOwner          | Gibt die Richtung vor, prüft Fortschritt, greift ein und erteilt die finale Approval      | Ein MissionOwner der Root Mission ist ein Mensch                           |
| Coordinator           | Plant, weist zu, überwacht, integriert und reicht die Mission ein                         | Er ist austauschbar; ein Coordinator Epoch setzt den Vorgänger außer Kraft |
| Worker                | Nimmt WorkItem an und führt sie über eigene Warteschlangen und Scheduler aus              | Derselbe Agent kann in vielen Group arbeiten                               |
| Group Authority       | Authentifiziert Akteure, validiert Richtlinien, serialisiert Übergänge und hängt Event an | Sie ordnet Zustand, verwaltet aber nicht die Bedeutung der Mission         |
| Authorization Service | Stellt nach den erforderlichen Prüfungen kurzlebige, begrenzte Capability Token aus       | Capability ist keine Autorisierung                                         |

Eine **Agent Card** enthält eine stabile, von der Organization signierte
Identität und verifizierte Capability. Ein **Presence Record** enthält
vorübergehende Verfügbarkeit und Kapazität. Beides ist getrennt, weil
vorübergehende Verfügbarkeit die vertrauenswürdige Identität nicht neu schreiben
darf.

## Datensätze, die Zusammenarbeit verbinden

- Eine **Membership** verbindet einen Principal mit einer Group, einer
  Rollenmenge, einem Sichtbarkeitsbereich und einem Membership Epoch.
- Eine **Conversation** enthält dauerhafte Message für die Planung in der Group
  oder zu einem WorkItem.
- Ein **WorkItem** ist eine ausführbare Arbeitseinheit einer Mission. Sein
  **Work Contract** definiert Ziel, Liefergegenstände, Evidence, Berechtigungen,
  Frist und Budget.
- Ein **Artifact** ist ein unveränderlicher, inhaltsadressierter
  Liefergegenstand.
- **Evidence** dokumentiert, wie ein Artifact oder WorkItem seine
  Akzeptanzkriterien erfüllt.
- Ein **Event** ist eine unveränderliche, akzeptierte Tatsache in der monotonen
  Historie einer Group.
- Ein **Cursor** zeichnet die höchste zusammenhängende Position eines Group
  Event auf, die ein Agent dauerhaft verarbeitet hat.

:::note[Message werden niemals implizit zu Zuweisungen]

Ein Message kann Kontext liefern oder Arbeit vorschlagen. Ausführbare
Verantwortung beginnt erst nach einem autorisierten WorkItem-Übergang und der
Annahme durch den Worker.

:::

## Autoritativer Zustand und lokale Projektionen

MissionWeaveProtocol trennt die gemeinsame Wahrheit vom rekonstruierbaren
Zustand des Worker.

Zum **autoritativen Zustand** gehören Mission, Membership, WorkItem, Ownership
Epoch, Execution Lease, Deduplizierungsbelege, Approval und Group Event. Die
Group Authority serialisiert Änderungen an diesem Zustand.

Zu den **lokalen Projektionen des Agent** gehören Cursor, Group-spezifische
Warteschlangen, Checkpoint, Postausgang, Posteingang und Scheduler-Zustand. Ein
Agent kann sie aus dauerhaften Event rekonstruieren. Der Verlust einer lokalen
Datenbank darf den autoritativen Mission-Zustand nicht verändern.

## Wichtige Invarianten

- Eine Mission hat eine primäre Group und eine Event-Reihenfolge pro Group.
- Conversation ist niemals Ausführungsautorität.
- Ownership Epoch und Execution Lease setzen frühere Eigentümer beziehungsweise
  abgelaufene Ausführungszeiträume außer Kraft.
- Akzeptierte Event und bestätigte Message sind append-only.
- Mission-Kontext und Anmeldedaten sind standardmäßig isoliert.
- Eine Unteraufgabe darf mit ihren Budgets und Berechtigungen die übergeordnete
  Mission nicht überschreiten; dasselbe gilt für WorkItem.
- Der Abschluss einer Root Mission erfordert die menschliche Approval einer
  genauen Revision und eines genauen Artifact-Satzes.
- Agent veröffentlichen die für Audits erforderlichen Entscheidungen, Eingaben,
  Evidence, Blockaden und Ergebnisse, nicht ihre private Chain-of-Thought.

Die vollständigen Regeln stehen in den normativen Abschnitten zu
[Kerninvarianten](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#4-core-invariants)
und
[Systemarchitektur](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#5-system-architecture).
