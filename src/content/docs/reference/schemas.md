---
title: JSON Schemas
description: Browse the 21 normative MissionWeave Protocol 0.1 JSON Schemas.
sidebar:
  label: JSON Schemas
  order: 2
---

MissionWeave Protocol 0.1 defines **21 normative JSON Schema Draft 2020-12
files**. The canonical files live in the
[`schemas/` directory](https://github.com/MissionWeaveProject/missionweaveprotocol/tree/main/schemas)
of the protocol repository.

Wire property names are lower camel case. Core objects reject unknown
properties, and approved extension data is carried only in explicit `extensions`
members.

## Schema catalog

| Schema                                                                                                                                         | Purpose                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [`common.schema.json`](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/schemas/common.schema.json)                       | Shared protocol definitions used by the other schemas                              |
| [`agent-card.schema.json`](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/schemas/agent-card.schema.json)               | Stable Organization-signed Agent identity and verified capabilities                |
| [`presence-record.schema.json`](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/schemas/presence-record.schema.json)     | Ephemeral Agent availability and capacity                                          |
| [`mission.schema.json`](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/schemas/mission.schema.json)                     | Mission objective, ownership, budget, and approval lifecycle                       |
| [`group.schema.json`](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/schemas/group.schema.json)                         | Temporary collaboration Group belonging to one Mission                             |
| [`group-snapshot.schema.json`](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/schemas/group-snapshot.schema.json)       | Signed archival snapshot of a Group history                                        |
| [`membership.schema.json`](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/schemas/membership.schema.json)               | Scoped authorization connecting a Principal to a Group                             |
| [`conversation.schema.json`](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/schemas/conversation.schema.json)           | Auditable Group or WorkItem conversation thread                                    |
| [`message.schema.json`](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/schemas/message.schema.json)                     | Committed conversational context that does not grant execution authority           |
| [`work-contract.schema.json`](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/schemas/work-contract.schema.json)         | Work goal, deliverables, criteria, inputs, permissions, deadline, and retry budget |
| [`work-item.schema.json`](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/schemas/work-item.schema.json)                 | Explicit unit of Mission work, including lifecycle and ownership                   |
| [`artifact.schema.json`](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/schemas/artifact.schema.json)                   | Immutable content-addressed deliverable manifest                                   |
| [`evidence.schema.json`](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/schemas/evidence.schema.json)                   | Recorded facts evaluated against acceptance criteria                               |
| [`approval.schema.json`](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/schemas/approval.schema.json)                   | Signed approval of an exact Mission result                                         |
| [`context-package.schema.json`](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/schemas/context-package.schema.json)     | Signed, scoped, provenance-bearing Mission context                                 |
| [`command.schema.json`](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/schemas/command.schema.json)                     | Signed request for one structured state transition                                 |
| [`event.schema.json`](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/schemas/event.schema.json)                         | Immutable accepted fact in a Group's ordered history                               |
| [`error.schema.json`](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/schemas/error.schema.json)                         | Structured protocol error document                                                 |
| [`lease.schema.json`](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/schemas/lease.schema.json)                         | Renewable, epoch-fenced execution lease                                            |
| [`extension-profile.schema.json`](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/schemas/extension-profile.schema.json) | Governed extension definition and compatibility metadata                           |
| [`websocket-frame.schema.json`](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/schemas/websocket-frame.schema.json)     | Canonical WebSocket frame union                                                    |

The canonical
[schema README](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/schemas/README.md)
records the shared validation rules.

## Validate the protocol repository

From a source checkout of `missionweaveprotocol`:

```bash
python -m pip install -r requirements-validation.txt
python scripts/check_repository_policy.py
python scripts/validate_protocol.py
```

A validator must register every schema by its `$id` before resolving references.
Passing schema validation demonstrates structural conformance, not the
behavioral requirements in the [specification](../specification/).

The [conformance manifest](../conformance/) supplies expected-valid and
expected-invalid instances for these schemas.
