---
title: Arbeitslebenszyklus
description:
  Wie MissionWeaveProtocol von Conversation und Work Proposal zu akzeptierten,
  verifizierten und von Menschen genehmigten Ergebnissen gelangt.
sidebar:
  order: 3
---

:::caution[Standardentwurf 0.1]

Dies ist ein nicht normativer Lernleitfaden. Das
[kanonische Protokoll-Repository](https://github.com/missionweaveprotocol/missionweaveprotocol)
bleibt normativ.

:::

MissionWeaveProtocol hält die Zusammenarbeit in Conversation flexibel und macht
ausführbare Verantwortung zugleich ausdrücklich. Jedes Mitglied einer Group kann
Kontext besprechen, um Hilfe bitten oder Arbeit vorschlagen. Ein Vorschlag wird
erst durch einen autorisierten WorkItem-Übergang zu einer Verpflichtung.

## Von der Diskussion zur Verpflichtung

1. **Besprechen.** Agent tauschen vollständige Message in einer Conversation des
   Group oder WorkItem aus.
2. **Vorschlagen.** Jedes Group-Mitglied kann eine Work Proposal einreichen. Es
   existiert noch kein ausführbares WorkItem.
3. **Autorisieren.** Der aktuelle Coordinator, ein MissionOwner mit
   Notfallübersteuerung oder ein Agent mit einer gültigen, begrenzten Delegation
   Grant erstellt das WorkItem.
4. **Anbieten.** Der Coordinator oder der begrenzte Delegierte bietet das
   WorkItem einem geeigneten Worker an und zeichnet die Selection Basis auf.
5. **Annehmen.** Der Worker führt Admission Control durch. Eine gültige Annahme
   startet einen neuen Ownership Epoch und legt das WorkItem in die
   Group-spezifische Warteschlange dieses Worker.

:::note[Die Annahme ist eine Planungsverpflichtung]

Die Annahme eines Angebots bedeutet keine sofortige Ausführung. Der Worker
Scheduler hat die letzte Kontrolle über die Reihenfolge zwischen Group und
startet das WorkItem, sobald Kapazität, Abhängigkeiten, Richtlinien und
Autorisierung dies zulassen.

:::

## Der Work Contract

Jedes WorkItem enthält einen versionierten, maschinenlesbaren Work Contract. Er
zeichnet Folgendes auf:

- Ziel, Liefergegenstände und Akzeptanzkriterien;
- erforderliche Evidence sowie Eingabe- oder Abhängigkeitsreferenzen;
- erlaubte Tools, Daten, Ressourcen und Vorgänge;
- erforderliche Capability-Kennungen und -Versionen;
- Frist, angeforderte Dringlichkeit und geschäftliche Auswirkungen;
- finanzielle Budgets sowie Budgets für Token, Tool-Aufrufe, Rechenzeit,
  verstrichene Zeit und Seiteneffekte;
- Wiederholungsversuche, Backoff, Frist und Kostenrichtlinie; sowie
- Risikoklassifizierung und ein möglicher Approval-Gate vor der Ausführung.

Eine wesentliche Unklarheit muss vor der Annahme geklärt werden. Eine materielle
Vertragsänderung erfordert eine erneute Annahme durch den Worker.

## Ein typischer erfolgreicher Ablauf

```text
Work Proposal
    ↓ autorisieren
WorkItem im Status open
    ↓ anbieten
offered
    ↓ Worker nimmt an
queued
    ↓ gültige Ownership, Approval-Gates und Execution Lease
active
    ↓ Worker reicht Artifact und Evidence ein
submitted
    ↓ Coordinator nimmt das Ergebnis an
verified
```

Aktive Arbeit kann per Checkpoint zu `queued` zurückkehren, mit einem
dauerhaften Checkpoint in `blocked` wechseln, mit Evidence fehlschlagen oder
abgebrochen werden. Ein blockiertes WorkItem gibt seinen Capacity Slot frei und
kehrt später in eine Warteschlange zurück oder wird nach Ablauf des Ownership
Lease erneut angeboten.

## Evidence vor Approval

Die Behauptung eines Worker genügt nicht als Abschlussnachweis. Eine Einreichung
enthält Artifact und Evidence, die Akzeptanzkriterien zugeordnet sind. Die
Prüfung durch den Coordinator sollte die Integrität der Artifact validieren,
verfügbare deterministische Prüfungen ausführen, für qualitative Kriterien
Evidence von einem prüfenden Agent anfordern und das Ergebnis aufbewahren.

Sind alle erforderlichen WorkItem verifiziert, reicht der Coordinator eine
bestimmte Mission-Revision und einen Artifact-Satz ein. Der MissionOwner
unterzeichnet entweder die finale Approval oder fordert Änderungen an. Eine
Änderungsanforderung öffnet dieselbe Mission erneut, ohne frühere Einreichungen
zu löschen.

Die vollständigen Übergänge und Autoritätsregeln stehen in den normativen
Abschnitten zur
[WorkItem-Zustandsmaschine](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#102-workitem-state-machine)
und zur
[Evidence-basierten Prüfung](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#132-evidence-based-review).
