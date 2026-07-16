---
title: Child Missions
description:
  Recursive decomposition of complex WorkItems into bounded Mission Groups
  without losing scope, budget, Evidence, or human accountability.
sidebar:
  order: 6
---

:::caution[Draft Standard 0.1]

This is a non-normative learning guide. The
[canonical protocol repository](https://github.com/MissionWeaveProject/missionweaveprotocol)
remains normative.

:::

A sufficiently complex WorkItem can become a **child Mission**. The child has
its own Group, Coordinator, WorkItem graph, Memberships, budget, deadline, and
approval policy. The parent WorkItem and child Mission link to each other.

```text
Root Mission and Group
└── parent WorkItem becomes blocked
    └── Child Mission and its own Group
        ├── child Coordinator
        ├── child WorkItems and Evidence
        └── child Approval
            └── result returns as Evidence and Artifacts
                for the parent WorkItem
```

:::note[One Mission still has one Group]

Creating a child Mission does not turn the parent Group into a nested chat room.
The child receives a separate Group and shares only authorized summaries,
Artifacts, Evidence, and stable links with its parent.

:::

## Authority and approval

By default, the child Coordinator reviews and submits the child result. The
Parent Coordinator acts as the child MissionOwner and approves the child on
behalf of the parent WorkItem. Organization risk policy may additionally require
direct human approval.

The approved child result becomes Evidence and Artifacts for the parent
WorkItem. The Parent Coordinator receives status changes, summaries, revised
estimates, blockers, budget or policy escalations, and final results. It does
not need every child Message, but it retains authorized on-demand inspection.
The root MissionOwner can inspect the complete Mission tree.

## Scope narrows downward

The parent-child graph must remain acyclic. A child's budget, deadline,
capabilities, data access, and permissions must be subsets of the parent.
Organizations configure a default maximum depth and require explicit
MissionOwner or policy approval beyond that threshold.

The depth limit is a guardrail, not a fixed ceiling. Legitimate complex work can
continue after explicit approval provides the additional scope or depth.

## Failure does not automatically consume the parent

A failed child Mission emits structured failure Evidence and blocks or fails the
parent WorkItem according to its declared policy. The Parent Coordinator may
replan, revise scope, create a replacement child, or cancel the branch. Failure
propagates automatically only when the parent completion policy declares that
child indispensable and provides no alternative.

## Child Mission or follow-up Mission?

- Use a **child Mission** to complete a complex WorkItem within an active parent
  Mission.
- Use a **follow-up Mission** for correction, remediation, or additional work
  after an approved Mission has become immutable.

For the complete rules, read the normative
[parent and child Missions](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/spec/PROTOCOL.md#14-parent-and-child-missions)
and
[Mission lifecycle](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/spec/PROTOCOL.md#7-mission-and-group-lifecycle)
sections.
