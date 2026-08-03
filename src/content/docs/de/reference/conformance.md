---
title: Konformität
description:
  Führe die 56 implementierungsneutralen Konformitätsvektoren von
  MissionWeaveProtocol aus.
sidebar:
  label: Konformität
  order: 3
---

MissionWeaveProtocol 0.1 stellt **56 implementierungsneutrale
Konformitätsfälle** bereit:

| Erwartetes Ergebnis | Fälle | Kanonisches Verzeichnis                                                                                                              |
| ------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------ |
| Gültig              |    26 | [`conformance/vectors/valid/`](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/conformance/vectors/valid)     |
| Ungültig            |    30 | [`conformance/vectors/invalid/`](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/conformance/vectors/invalid) |

Die kanonische Datei
[`manifest.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/conformance/manifest.json)
ordnet jeden Fall einem Schema, einem Instanzdokument und der erwarteten
Gültigkeit zu. Die normativen Nutzungsanforderungen stehen in der lokalen
[versionierten Konformitätsreferenz](../../0.1/reference/conformance/).

## Was die Vektoren belegen

Die Ausführung aller 56 Fälle prüft, ob eine Implementierung mit den
strukturellen Dokumentregeln des Protokolls übereinstimmt. Die ungültigen Fälle
decken bewusst abgelehnte Formen ab, darunter fehlende Signaturen, ungültige
Lebenszykluszustände, fehlendes Ownership, unsicheres Erweiterungsverhalten und
widersprüchliche Provenienz.

Das Bestehen des Manifests ist notwendig, aber nicht ausreichend.
Verhaltenskonformität erfordert außerdem die Regeln der
[normativen Spezifikation](../../0.1/reference/specification/) zu
Zustandsmaschine, Reihenfolge, Autorisierung, Signatur, Epoch, Lease, Budget,
Hierarchie, Zeitstempel und Replay.

Die Kryptografie signierter Dokumente ist ein eigenständiger
Konformitätsbereich. Ihr
[Kryptografiemanifest](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/cryptography/manifest.json)
enthält 22 Fälle und 58 Auswertungen für alle neun signaturpflichtigen
Schemaprofile. Die
[Kryptografie-Konformitätsreferenz](../../0.1/reference/conformance/cryptography/)
definiert die geordneten Anforderungen der sechsstufigen Verifikation. Das
Bestehen eines Manifests bedeutet nicht, dass auch das andere bestanden wurde.

## Im Protokoll-Checkout validieren

```bash
python -m pip install -r requirements-validation.txt
python scripts/check_repository_policy.py
python scripts/validate_protocol.py
```

## Mit dem Python SDK ausführen

Führe bei benachbarten Quell-Checkouts namens `missionweaveprotocol` und
`python-sdk` im Protokoll-Checkout Folgendes aus:

```bash
uv run --project ../python-sdk missionweaveprotocol-conformance --root .
```

Oder führe im Checkout des Python SDK Folgendes aus:

```bash
uv run missionweaveprotocol-conformance --root ../missionweaveprotocol
```

Das Python SDK enthält dasselbe Schema- und Vektorbündel auch für die
Offline-Validierung. Seine Datei
[`PROTOCOL_PIN.json`](https://github.com/missionweaveprotocol/python-sdk/blob/main/PROTOCOL_PIN.json)
zeichnet den genauen Protokoll-Commit und die von diesem Checkout verwendeten
Inhalts-Digests auf.
