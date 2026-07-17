---
title: Core model
description:
  The Missions, Groups, roles, durable records, and local projections that make
  up MissionWeaveProtocol 0.1.
sidebar:
  order: 2
---

:::caution[Draft Standard 0.1]

This is a non-normative learning guide. The
[canonical protocol repository](https://github.com/missionweaveprotocol/missionweaveprotocol)
remains normative.

:::

MissionWeaveProtocol organizes cooperation around a bounded **Mission** and its
temporary **Group**. Each Mission owns exactly one primary Group, and each
primary Group belongs to exactly one Mission.

```text
Organization
├── Agent Registry
├── Group Authority and durable Event store
├── Authorization Service
└── Mission
    └── Group
        ├── MissionOwner
        ├── Coordinator
        ├── Worker Memberships
        ├── Conversations and Messages
        ├── WorkItems and Work Contracts
        └── ordered Events, Artifacts, Evidence, and Approvals
```

## Roles and responsibilities

| Role                  | Responsibility                                                                     | Important boundary                                  |
| --------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------- |
| Organization          | Governs identity, policy, authorization, and infrastructure                        | It is the sole trust boundary in 0.1                |
| MissionOwner          | Sets direction, inspects progress, intervenes, and gives final approval            | A root MissionOwner is human                        |
| Coordinator           | Plans, assigns, monitors, integrates, and submits the Mission                      | It is replaceable and fenced by a Coordinator Epoch |
| Worker                | Accepts and executes WorkItems through its own queues and Scheduler                | The same Agent may work in many Groups              |
| Group Authority       | Authenticates actors, validates policy, serializes transitions, and appends Events | It orders state; it does not manage Mission meaning |
| Authorization Service | Issues short-lived scoped capability tokens after required checks                  | Capability is not authorization                     |

An **Agent Card** carries stable, Organization-signed identity and verified
capabilities. A **Presence Record** carries ephemeral availability and capacity.
They are separate because temporary availability must not rewrite trusted
identity.

## The records that connect cooperation

- A **Membership** connects a Principal to one Group, role set, visibility
  range, and Membership Epoch.
- A **Conversation** contains durable Messages for Group planning or one
  WorkItem.
- A **WorkItem** is an executable unit of Mission work. Its **Work Contract**
  defines the goal, deliverables, Evidence, permissions, deadline, and budget.
- An **Artifact** is an immutable, content-addressed deliverable.
- **Evidence** records how an Artifact or WorkItem satisfies acceptance
  criteria.
- An **Event** is an immutable accepted fact in one Group's monotonic history.
- A **Cursor** records the highest contiguous Group Event durably processed by
  an Agent.

:::note[Messages never become assignments implicitly]

A Message can provide context or propose work. Executable responsibility begins
only after an authorized WorkItem transition and Worker acceptance.

:::

## Authoritative state and local projections

MissionWeaveProtocol separates shared truth from rebuildable Worker state.

**Authoritative state** includes Missions, Memberships, WorkItems, ownership and
lease epochs, deduplication receipts, Approvals, and Group Events. The Group
Authority serializes changes to this state.

**Agent-local projections** include Cursors, per-Group queues, checkpoints,
outboxes, inboxes, and Scheduler state. An Agent can rebuild them from durable
Events. Losing a local database must not change authoritative Mission state.

## Invariants worth remembering

- One Mission has one primary Group and one per-Group Event order.
- Conversation is never execution authority.
- Exclusive work is fenced by ownership and lease epochs.
- Accepted Events and committed Messages are append-only.
- Mission context and credentials are isolated by default.
- WorkItem and child-Mission budgets and permissions cannot exceed their
  parents.
- Root Mission completion requires human approval of an exact revision and
  Artifact set.
- Agents publish the decisions, inputs, Evidence, blockers, and outcomes needed
  for audit, not private chain-of-thought.

For the complete rules, read the normative
[core invariants](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#4-core-invariants)
and
[system architecture](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#5-system-architecture).
