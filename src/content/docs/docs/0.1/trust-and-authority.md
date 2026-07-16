---
title: Trust and authority
description:
  How MissionWeave separates identity, conversation, assignment, execution,
  ordering, and final approval authority.
sidebar:
  order: 5
---

:::caution[Draft Standard 0.1]

This is a non-normative learning guide. The
[canonical protocol repository](https://github.com/MissionWeaveProject/missionweaveprotocol)
remains normative.

:::

MissionWeave 0.1 operates inside one trusted Organization. The Organization is
the governance root for Agent identity, policy, authorization, durable Group
ordering, and human accountability.

## Authority is deliberately split

| Concern                                           | Authority                                     |
| ------------------------------------------------- | --------------------------------------------- |
| Stable identity and verified capabilities         | Organization-controlled Agent Registry        |
| Mission direction and final approval              | MissionOwner                                  |
| Planning, assignment, integration, and submission | Current Coordinator Epoch                     |
| Cross-Group execution order                       | Worker-owned Scheduler                        |
| Transition validation and per-Group Event order   | Group Authority                               |
| Tool, data, resource, and side-effect permission  | Authorization Service and Organization policy |

The Group Authority is one logical authority for each Group. An implementation
may replicate it internally, but consensus, leader election, and replica
topology are not exposed as protocol semantics.

## Identity is not presence

An Agent Card is stable, versioned, Organization-signed identity. It includes
public keys, endpoints, supported protocol versions, verified capabilities, and
maximum concurrency. It contains no reusable credentials or tool permissions.

A Presence Record is ephemeral. It may report availability, open execution
slots, capability availability, estimated response latency, and heartbeat time.
A stale Presence Record is never an assignment acceptance or lease renewal.

:::note[Capability is not authorization]

A capability states what an Agent is verified to do. Authorization determines
whether that Agent may perform a specific operation on specific resources under
current Mission policy, ownership, lease, approval, and budget constraints.

:::

## Sessions and fencing

The WebSocket handshake uses an Organization-registered Ed25519 key and a fresh
challenge. A successful handshake issues a short-lived session token and a new
Session Epoch. Issuing epoch `n + 1` fences every runtime at epoch `n` or lower
for that Agent identity.

Additional epochs narrow authority further:

- a Membership Epoch fences an older version of one Group Membership;
- a Coordinator Epoch fences a replaced Coordinator and its grants;
- an Ownership Epoch fences previous owners of exclusive work; and
- an Execution Lease ID fences an expired or revoked execution period.

Durable Commands and Artifact manifests are individually signed over canonical
JSON. Accepted Events are signed by the Group Authority.

## From context to permitted side effect

```text
Message or Work Proposal
        ↓ explicit authorization
WorkItem and Work Contract
        ↓ Worker acceptance
Ownership Epoch
        ↓ current session, policy, budget, and approval checks
Execution Lease and scoped capability token
        ↓
Permitted operation
```

Messages, Agent Cards, Context Packages, Artifacts, and Group Events must not
carry secrets or reusable credentials. High-risk operations may require signed
human Execution Approval before the Authorization Service issues a capability
token.

The root Mission still requires a separate final human Approval after the
Coordinator verifies the results. Execution Approval permits a bounded risky
operation; final Approval accepts a completed Mission revision and Artifact set.

For the complete rules, read the normative
[identity and sessions](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/spec/PROTOCOL.md#6-identity-agent-registry-and-sessions),
[Membership and visibility](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/spec/PROTOCOL.md#8-membership-visibility-and-attention),
and
[authorization and budgets](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/spec/PROTOCOL.md#12-authorization-budgets-and-side-effects)
sections.
