---
title: Conformance
description:
  Run the 52 implementation-neutral MissionWeaveProtocol conformance vectors.
sidebar:
  label: Conformance
  order: 3
---

MissionWeaveProtocol 0.1 provides **52 implementation-neutral conformance
cases**:

| Expected result | Cases | Canonical directory                                                                                                                  |
| --------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------ |
| Valid           |    25 | [`conformance/vectors/valid/`](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/conformance/vectors/valid)     |
| Invalid         |    27 | [`conformance/vectors/invalid/`](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/conformance/vectors/invalid) |

The canonical
[`manifest.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/conformance/manifest.json)
maps every case to one schema, one instance document, and its expected validity.
See the
[conformance README](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/conformance/README.md)
for the normative usage requirements.

## What the vectors prove

Running all 52 cases checks that an implementation agrees with the protocol's
structural document rules. The invalid cases cover deliberately rejected shapes,
such as missing signatures, invalid lifecycle states, absent ownership, unsafe
extension behavior, and inconsistent provenance.

Passing the manifest is necessary but not sufficient. Behavioral conformance
also requires the state-machine, ordering, authorization, signature, epoch,
lease, budget, hierarchy, timestamp, and replay rules in the
[normative specification](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md).

Signed-document cryptography is a separate conformance surface. Its
[cryptography manifest](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/cryptography/manifest.json)
contains 22 cases and 58 evaluations across all nine signature-required schema
profiles. The
[cryptography README](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/cryptography/README.md)
defines the ordered six-stage verification requirements. Passing either manifest
does not imply passing the other.

## Validate in the protocol checkout

```bash
python -m pip install -r requirements-validation.txt
python scripts/check_repository_policy.py
python scripts/validate_protocol.py
```

## Run with the Python SDK

With sibling source checkouts named `missionweaveprotocol` and `python-sdk`, run
this from the protocol checkout:

```bash
uv run --project ../python-sdk missionweaveprotocol-conformance --root .
```

Or run this from the Python SDK checkout:

```bash
uv run missionweaveprotocol-conformance --root ../missionweaveprotocol
```

The Python SDK also vendors the same schema and vector bundle for offline
validation. Its
[`PROTOCOL_PIN.json`](https://github.com/missionweaveprotocol/python-sdk/blob/main/PROTOCOL_PIN.json)
records the exact protocol commit and content digests used by that checkout.
