---
title: SDK
description:
  Wähle ein offizielles MissionWeaveProtocol SDK und prüfe seinen aktuellen
  Konformitätsumfang.
sidebar:
  label: Übersicht
  order: 1
---

MissionWeaveProtocol bietet eine vollständige Python-Referenzimplementierung und
fünf offizielle Protocol SDKs. Jedes SDK wird unabhängig versioniert und pinnt
den exakten Protokoll-Commit sowie die Digests der implementierten Artifact. Die
folgenden Zahlen beziehen sich auf den Protokoll-Commit
[`6f10987`](https://github.com/missionweaveprotocol/missionweaveprotocol/commit/6f10987627d62fb296e3490ceceb5539b1e94b70).

## Funktions- und Statusmatrix

| SDK                                                                  | Aktueller Umfang                     | Protokoll-Bindings | Schema- und Vektorkonformität | Vollständige verhaltensbezogene Runtime |
| -------------------------------------------------------------------- | ------------------------------------ | ------------------ | ----------------------------- | --------------------------------------- |
| [Python](https://github.com/missionweaveprotocol/python-sdk)         | Vollständige Referenzimplementierung | Ja                 | 52/52 Vektoren                | Ja                                      |
| [Go](https://github.com/missionweaveprotocol/go-sdk)                 | Offizielles Protocol SDK             | Ja                 | 52/52 Vektoren                | Nein                                    |
| [TypeScript](https://github.com/missionweaveprotocol/typescript-sdk) | Offizielles Protocol SDK             | Ja                 | 52/52 Vektoren                | Nein                                    |
| [Java](https://github.com/missionweaveprotocol/java-sdk)             | Offizielles Protocol SDK             | Ja                 | 52/52 Vektoren                | Nein                                    |
| [Rust](https://github.com/missionweaveprotocol/rust-sdk)             | Offizielles Protocol SDK             | Ja                 | 52/52 Vektoren                | Nein                                    |
| [C++](https://github.com/missionweaveprotocol/cpp-sdk)               | Offizielles Protocol SDK             | Ja                 | 52/52 Vektoren                | Nein                                    |

Schema- und Vektorkonformität umfasst strikte JSON-Verarbeitung, Offline-
Validierung anhand der 21 gepinnten Draft-2020-12-Schemas, kanonisches JSON und
Inhalts-IDs, Ed25519-Signaturen, Frame-Validierung sowie die 52 gepinnten
Konformitätsvektoren. Sie belegt allein keine Konformität für Planung,
Persistenz, Wiederherstellung, Transport oder anderes Runtime-Verhalten.

## Ein SDK auswählen

Nutze den [Leitfaden zum Python SDK](./python/), wenn du die vollständige
Referenz-Runtime einschließlich Core, Agent Runtime, Worker Scheduler, Group
Gateway, Speicheradaptern und ausführbarem POC benötigst.

Nutze das Go-, TypeScript-, Java-, Rust- oder C++-Repository, wenn du native
Protokoll-Bindings, Validierung, Kanonisierung, Signaturen und Frame Codecs
benötigst. Installations- und Prüfkommandos werden in der README des jeweiligen
Repository gepflegt. Die Protokollspezifikation und die Konformitäts-Artifact
bleiben normativ.
