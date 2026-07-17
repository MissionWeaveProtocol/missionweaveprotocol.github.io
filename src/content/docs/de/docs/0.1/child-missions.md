---
title: Child Mission
description:
  Rekursive Zerlegung komplexer WorkItem in begrenzte Mission Group, ohne
  Umfang, Budget, Evidence oder menschliche Verantwortlichkeit zu verlieren.
sidebar:
  order: 6
---

:::caution[Draft Standard 0.1]

Dies ist ein nicht normativer Lernleitfaden. Das
[kanonische Protokoll-Repository](https://github.com/missionweaveprotocol/missionweaveprotocol)
bleibt normativ.

:::

Ein ausreichend komplexes WorkItem kann zu einer **Child Mission** werden. Die
Child Mission besitzt einen eigenen Group, Coordinator, WorkItem-Graph,
Membership, Budget, eine Frist und eine Approval-Richtlinie. Das übergeordnete
WorkItem und die Child Mission verweisen aufeinander.

```text
Root Mission and Group
└── parent WorkItem becomes blocked
    └── Child Mission and its own Group
        ├── child Coordinator
        ├── child WorkItems and Evidence
        └── child Approval
            └── result returns as Evidence and Artifacts
                for the parent WorkItem
```

:::note[Eine Mission hat weiterhin genau einen Group]

Das Erstellen einer Child Mission verwandelt den übergeordneten Group nicht in
einen verschachtelten Chatraum. Die Child Mission erhält einen getrennten Group
und teilt mit ihrem übergeordneten Element nur autorisierte Zusammenfassungen,
Artifact, Evidence und stabile Verweise.

:::

## Autorität und Approval

Standardmäßig prüft der Coordinator der Child Mission deren Ergebnis und reicht
es ein. Der Parent Coordinator handelt als MissionOwner der Child Mission und
genehmigt sie im Namen des übergeordneten WorkItem. Die Risikorichtlinie der
Organization kann zusätzlich eine direkte menschliche Approval verlangen.

Das genehmigte Ergebnis der Child Mission wird zu Evidence und Artifact für das
übergeordnete WorkItem. Der Parent Coordinator erhält Statusänderungen,
Zusammenfassungen, überarbeitete Schätzungen, Blockaden, Budget- oder
Richtlinieneskalationen und Endergebnisse. Er benötigt nicht jeden Message der
Child Mission, behält aber autorisierten Zugriff für bedarfsgesteuerte
Prüfungen. Der MissionOwner der Root Mission kann den vollständigen Mission-Baum
einsehen.

## Der Umfang wird nach unten enger

Der Eltern-Kind-Graph muss azyklisch bleiben. Budget, Frist, Capability,
Datenzugriff und Berechtigungen einer Child Mission müssen Teilmengen des
übergeordneten Elements sein. Organization konfigurieren eine standardmäßige
Maximaltiefe und verlangen jenseits dieses Schwellenwerts eine ausdrückliche
Approval des MissionOwner oder der Richtlinie.

Die Tiefenbegrenzung ist eine Leitplanke, keine feste Obergrenze. Berechtigte
komplexe Arbeit kann fortgesetzt werden, nachdem eine ausdrückliche Approval den
zusätzlichen Umfang oder die zusätzliche Tiefe gewährt.

## Ein Fehlschlag lässt das übergeordnete Element nicht automatisch scheitern

Eine fehlgeschlagene Child Mission erzeugt strukturierte Fehler-Evidence und
blockiert das übergeordnete WorkItem oder lässt es gemäß seiner festgelegten
Richtlinie fehlschlagen. Der Parent Coordinator kann neu planen, den Umfang
überarbeiten, eine Ersatz-Child-Mission erstellen oder den Zweig abbrechen. Ein
Fehlschlag wird nur dann automatisch weitergegeben, wenn die Abschlussrichtlinie
des übergeordneten Elements diese Child Mission als unverzichtbar und ohne
Alternative einstuft.

## Child Mission oder Follow-up Mission?

- Verwende eine **Child Mission**, um ein komplexes WorkItem innerhalb einer
  aktiven übergeordneten Mission abzuschließen.
- Verwende eine **Follow-up Mission** für Korrektur, Abhilfe oder zusätzliche
  Arbeit, nachdem eine genehmigte Mission unveränderlich geworden ist.

Die vollständigen Regeln stehen in den normativen Abschnitten zu
[übergeordneten Mission und Child Mission](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#14-parent-and-child-missions)
und zum
[Mission-Lebenszyklus](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#7-mission-and-group-lifecycle).
