---
title: Planung über mehrere Group
description:
  Group-spezifische Warteschlangen des Worker, globale Planung, isolierte
  Capacity Slot, Checkpoint-sichere Preemption und Replay in
  MissionWeaveProtocol 0.1.
sidebar:
  label: Planung
  order: 4
---

:::caution[Standardentwurf 0.1]

Dies ist ein nicht normativer Lernleitfaden. Das
[kanonische Protokoll-Repository](https://github.com/missionweaveprotocol/missionweaveprotocol)
bleibt normativ.

:::

Ein Worker kann vielen Mission Group angehören, ohne deren Kontexte zu
vermischen. Er verwaltet für jede Group einen eigenen Event-Posteingang, Cursor
und eine eigene Arbeitswarteschlange. Anschließend wählt ein Scheduler des
Worker geeignete WorkItem aus diesen Warteschlangen aus.

```text
Event von Group A → Warteschlange von Group A ┐
Event von Group B → Warteschlange von Group B ├→ Worker Scheduler → isolierte Ausführungsplätze
Event von Group C → Warteschlange von Group C ┘
```

## Wer die Priorität bestimmt

Der Coordinator gibt für seine Mission die gewünschte Dringlichkeit, Frist und
geschäftliche Auswirkung an. Der Worker Scheduler hat die letzte Kontrolle über
die Reihenfolge zwischen Group. Ein Coordinator kann seine Mission nicht vor
unabhängige Group zwingen; eine organisationsweite Prioritätsänderung erfolgt
über Richtlinien oder den MissionOwner.

Der Scheduler muss gewichtete Fairness bieten und Starvation verhindern. Seine
effektive Reihenfolge sollte Folgendes berücksichtigen:

- Prioritätsklasse der Organization;
- Fristen und Alter in der Warteschlange;
- Quoten pro Group;
- Risiko und Approval-Gate; sowie
- verfügbare Ressourcen und Capacity Slot.

Eine unbegrenzte Planung nach strikt höchster Priorität ist nicht konform, da
ein ausgelasteter oder dringender Group alle anderen Group aushungern könnte.

## Datenschutzwahrende Offenlegung

Wenn ein Worker ein Angebot annimmt oder seine Planung wesentlich ändert, sollte
er ein geschätztes Startfenster, den voraussichtlichen Abschluss, die
Zuverlässigkeit der Schätzung, den Kapazitätsstatus und den Berechnungszeitpunkt
veröffentlichen. Er darf weder Identität, Inhalt und Zuweisungen eines anderen
Group noch dessen genaue Position in der globalen Warteschlange offenlegen.

Jeder Capacity Slot isoliert Mission-Kontext, Anmeldedaten, Checkpoint,
Tool-Budgets und Seiteneffekt-Schlüssel von jedem anderen Capacity Slot.

## Ownership, Execution Lease und sichere Preemption

Die Annahme startet einen Ownership Epoch und eine Startfrist. Für den
Arbeitsbeginn ist außerdem eine Execution Lease erforderlich, die an Agent,
Session Epoch, WorkItem, Ownership Epoch und Ablaufzeit gebunden ist.

Prioritätsänderungen ordnen wartende Arbeit sofort neu. Aktive Arbeit wird nicht
an einem unsicheren Punkt unterbrochen. Kooperative Preemption folgt einer
dauerhaften Abfolge:

1. Der Scheduler fordert Preemption an.
2. Der Worker erreicht einen sicheren, idempotenten Checkpoint.
3. Der Worker zeichnet diesen Checkpoint auf und pausiert.
4. Der Capacity Slot wird freigegeben.
5. Das WorkItem kehrt zur späteren Fortsetzung in seine Group-Warteschlange
   zurück.

Beim Blockieren gilt dasselbe Sicherheitsprinzip: Checkpoint erstellen,
Blockierungsgrund ausgeben, Kapazität freigeben und dann gemäß den aktuellen
Ownership- und Execution-Lease-Regeln fortsetzen oder neu zuweisen.

## Wiederherstellung durch Replay

Group-spezifische Warteschlangen sind lokale Projektionen dauerhafter Group
Event. Ein neu gestarteter Worker stellt Cursor und Warteschlangen aus einem
Snapshot und geordnetem Replay wieder her. Event werden mindestens einmal
zugestellt, daher dedupliziert der Worker anhand der Event ID und setzt nur den
höchsten zusammenhängenden dauerhaften Cursor jeder Group fort.

MissionWeaveProtocol definiert eine Reihenfolge innerhalb einer Group, aber
keine globale Reihenfolge über mehrere Group.

Die vollständigen Regeln stehen in den normativen Abschnitten zu
[Planung, Ausführung und Wiederherstellung](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#11-scheduling-execution-and-recovery)
und zu
[Zustellung und Replay](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#16-delivery-replay-and-acknowledgement).
