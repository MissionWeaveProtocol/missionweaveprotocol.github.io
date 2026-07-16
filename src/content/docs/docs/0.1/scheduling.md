---
title: Scheduling across Groups
description:
  Per-Group Worker queues, global scheduling, isolated execution slots,
  checkpoint-safe preemption, and replay in MissionWeave Protocol 0.1.
sidebar:
  label: Scheduling
  order: 4
---

:::caution[Draft Standard 0.1]

This is a non-normative learning guide. The
[canonical protocol repository](https://github.com/MissionWeaveProject/missionweaveprotocol)
remains normative.

:::

A Worker can belong to many Mission Groups without merging their contexts. It
maintains a distinct Event inbox, Cursor, and Work queue for each Group, then
uses one Worker-owned Scheduler to select eligible WorkItems across those
queues.

```text
Group A Events → Group A queue ┐
Group B Events → Group B queue ├→ Worker Scheduler → isolated execution slots
Group C Events → Group C queue ┘
```

## Who controls priority

The Coordinator supplies requested urgency, deadline, and business impact for
its Mission. The Worker Scheduler has final control over cross-Group ordering. A
Coordinator cannot force its Mission ahead of unrelated Groups; an
Organization-level priority change goes through policy or the MissionOwner.

The Scheduler must provide weighted fairness and anti-starvation. Its effective
order should consider:

- Organization priority class;
- deadlines and queue aging;
- per-Group quotas;
- risk and approval gates; and
- available resources and execution slots.

Unbounded highest-priority-first scheduling is not conforming because a busy or
urgent Group could starve every other Group.

## Privacy-preserving disclosure

When a Worker accepts an offer or materially changes its schedule, it should
publish an estimated start window, estimated completion, confidence, capacity
status, and calculation time. It must not reveal another Group's identity,
content, assignments, or exact global queue position.

Each execution slot isolates Mission context, credentials, checkpoints, tool
budgets, and side-effect keys from every other slot.

## Ownership, leases, and safe preemption

Acceptance begins an Ownership Epoch and a start-by deadline. Starting work also
requires an Execution Lease bound to the Agent, Session Epoch, WorkItem,
Ownership Epoch, and expiry.

Priority changes immediately reorder queued work. Active work is not interrupted
at an unsafe point. Cooperative preemption follows a durable sequence:

1. the Scheduler requests preemption;
2. the Worker reaches a safe, idempotent checkpoint;
3. the Worker records that checkpoint and pauses;
4. the execution slot is released; and
5. the WorkItem returns to its Group queue for later resumption.

Blocking follows the same safety principle: checkpoint, emit the blocker,
release capacity, then resume or reassign under current ownership and lease
rules.

## Recovery by replay

Per-Group queues are local projections of durable Group Events. A restarted
Worker restores its Cursors and queues from a snapshot and ordered replay. Event
delivery is at least once, so the Worker deduplicates by Event ID and advances
only the highest contiguous durable Cursor for each Group.

MissionWeave defines ordering within a Group, not a global order across Groups.

For the complete rules, read the normative
[scheduling, execution, and recovery](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/spec/PROTOCOL.md#11-scheduling-execution-and-recovery)
and
[delivery and replay](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/spec/PROTOCOL.md#16-delivery-replay-and-acknowledgement)
sections.
