---
title: MissionWeaveProtocol 0.1
description:
  Read the normative MissionWeaveProtocol specification and protocol glossary.
sidebar:
  label: Specification
  order: 1
banner:
  content:
    MissionWeaveProtocol 0.1 is a <strong>Draft Standard</strong>. Use the
    canonical repository for normative requirements.
---

MissionWeaveProtocol 0.1 defines group-oriented cooperation for autonomous
Agents working inside one Organization. It covers identity, Mission Groups,
explicit WorkItems, peer Messages, scheduling, authority, durable ordering,
replay, verification, and human approval.

## Normative source

This website explains and links to MissionWeaveProtocol, but it is not the
normative protocol source. The
[`missionweaveprotocol` repository](https://github.com/missionweaveprotocol/missionweaveprotocol)
owns the authoritative artifacts:

- [MissionWeaveProtocol 0.1 specification](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md)
- [Protocol glossary](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/CONTEXT.md)
- [Normative JSON Schemas](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/schemas)
- [Conformance manifest and vectors](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/conformance)

When this guide and a normative artifact differ, the artifact in the protocol
repository controls.

## Version and identifiers

The current protocol version is `0.1`. Its wire namespace is
`missionweaveprotocol`:

- protocol identifiers use `urn:missionweaveprotocol:*`;
- built-in extension kinds use `ext.missionweaveprotocol.*`;
- schema identifiers use `https://missionweaveprotocol.dev/schemas/0.1/`.

Protocol releases and SDK releases are versioned independently. An
implementation should declare compatibility and pin a released protocol version
or exact commit rather than infer compatibility from matching version numbers.

## Reading path

1. Start with the
   [protocol glossary](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/CONTEXT.md)
   for the shared vocabulary.
2. Read the
   [normative specification](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md)
   for requirements and lifecycle rules.
3. Use the [schema reference](../schemas/) for document structure.
4. Run the [conformance vectors](../conformance/) against an implementation.
5. Follow the [Python SDK source guide](../../sdk/python/) to exercise the
   reference implementation.

Schema validation proves document structure only. Behavioral conformance also
requires the specification's state-machine, ordering, epoch, lease, budget,
hierarchy, timestamp, signature, authorization, and replay rules.
