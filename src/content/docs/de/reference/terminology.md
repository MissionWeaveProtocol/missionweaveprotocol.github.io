---
title: MissionWeaveProtocol-Terminologie
description:
  Wesentliche MissionWeaveProtocol-Begriffe für Identität, Zusammenarbeit,
  Arbeit, Planung und Approval.
sidebar:
  badge:
    text: Draft 0.1
    variant: caution
---

Diese Seite ist eine kompakte Lernreferenz. Das
[kanonische Protokollglossar](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/CONTEXT.md)
definiert das normative Vokabular für MissionWeaveProtocol 0.1.

## Organization und Identität

**Organization**: Die vertrauenswürdige Governance-Grenze, die Agent
registriert, Menschen authentifiziert und Richtlinien definiert.

**Agent**: Ein unabhängig geplanter Runtime mit stabiler Identität und höchstens
einer aktiven Session.

**Agent Card**: Eine von der Organization signierte Beschreibung der stabilen
Identität und verifizierter, versionierter Capability. Sie enthält weder
Berechtigungen noch wiederverwendbare Anmeldedaten.

**Agent Registry**: Die von der Organization kontrollierte Quelle für Agent
Card, Signierschlüssel, Capability-Evidence und Gültigkeitsstatus.

**Presence Record**: Vorübergehende Informationen zu Verfügbarkeit, Kapazität
und Heartbeat, die getrennt von der stabilen Agent Card verwaltet werden.

**Group Authority**: Infrastruktur der Organization, die Identität, Membership,
Richtlinien und strukturierte Zustandsübergänge validiert und die geordnete
Group-Event-Historie fortschreibt.

## Zusammenarbeit in einer Mission

**Mission**: Ein begrenztes Ziel mit Abschlussdefinition, Budget, Frist und
Approval-Lebenszyklus.

**Group**: Der temporäre Kollaborationsraum und die gemeinsame Historie, die
genau zu einer Mission gehören.

**MissionOwner**: Der verantwortliche Principal. Ein MissionOwner einer Root
Mission ist ein Mensch und besitzt die Autorität für finale Approval, Abbruch
und Austausch des Coordinator.

**Coordinator**: Der austauschbare Agent, der für Planung, Zuweisung,
Fortschrittsüberwachung, Integration, Verifizierung und Einreichung
verantwortlich ist.

**Worker**: Ein Agent, der WorkItem über eigene Warteschlangen und seinen
Scheduler annimmt und ausführt. Ein Worker kann vielen Group angehören.

**Membership**: Die begrenzte Autorisierung, die einen Agent oder MissionOwner
mit einem Group verbindet.

## Conversation und Arbeit

**Conversation**: Ein auditierbarer Message-Thread, dessen Geltungsbereich ein
Group oder ein WorkItem ist.

**Message**: Bestätigter Conversation-Kontext. Ein Message erteilt niemals
eigenständig ausführbare Autorität.

**Work Proposal**: Eine nicht ausführbare Anforderung eines Group-Mitglieds, ein
WorkItem zu erstellen.

**WorkItem**: Eine ausdrückliche Arbeitseinheit einer Mission mit Eigentümer,
Lebenszyklus, Abhängigkeiten und Work Contract.

**Work Offer**: Eine ablaufende Einladung an einen geeigneten Worker, ein
WorkItem nach lokaler Admission Control anzunehmen.

**Work Contract**: Ziel, Liefergegenstände, Akzeptanzkriterien, Eingaben,
Berechtigungen, Frist und Wiederholungsbudget eines WorkItem.

**Artifact**: Ein unveränderlicher, inhaltsadressierter Liefergegenstand, der
durch Mission-Arbeit erzeugt oder referenziert wird.

**Evidence**: Aufgezeichnete Tatsachen, mit denen ein Artifact oder WorkItem
anhand seiner Akzeptanzkriterien bewertet wird.

**Context Package**: Eine signierte, versionierte Zusammenfassung mit
Provenienz, die einem Agent begrenzten Mission-Kontext bereitstellt.

## Koordination und Ausführung

**Command**: Eine signierte Anforderung eines autorisierten Akteurs für einen
strukturierten Zustandsübergang.

**Event**: Eine unveränderliche, akzeptierte Tatsache in der monotonen Historie
eines Group.

**Cursor**: Die höchste zusammenhängende Position eines Group Event, die ein
Agent dauerhaft verarbeitet hat.

**Ownership Lease**: Eine begrenzte Reservierung, die einen Worker einem
exklusiven WorkItem zugewiesen hält.

**Execution Lease**: Eine erneuerbare, geschützte Gewährung, die einer Worker
Session und einem Ownership Epoch die Ausführung eines exklusiven WorkItem
erlaubt.

**Scheduler**: Eine Richtlinie im Besitz des Worker, die geeignete WorkItem über
Group-spezifische Warteschlangen und Capacity Slot hinweg auswählt.

**Checkpoint**: Eine dauerhafte, sicher fortsetzbare Referenz auf den
Ausführungszustand, die für Blockierung, Wiederherstellung und kooperative
Preemption verwendet wird.

**Approval**: Eine dauerhafte signierte Entscheidung, die eine bestimmte
Mission-Revision und einen genauen Artifact-Satz akzeptiert. Eine Root Mission
wird erst nach menschlicher Approval abgeschlossen.

## Hierarchie und Erweiterung

**Child Mission**: Eine Mission, die zur Erledigung eines komplexen WorkItem
einer übergeordneten Mission erstellt wird und deren Budgets und Autorität enger
als beim übergeordneten Element begrenzt sind.

**Follow-up Mission**: Eine neue Mission, die mit einer unveränderlichen,
genehmigten Mission verknüpft wird, wenn später Korrektur oder zusätzliche
Arbeit erforderlich ist.

**Extension Profile**: Ein von der Organization genehmigtes, versioniertes
Schema- und Semantikpaket, das zentrale Invarianten von MissionWeaveProtocol
nicht außer Kraft setzen kann.
