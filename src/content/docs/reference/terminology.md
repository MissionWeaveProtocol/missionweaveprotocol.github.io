---
title: MissionWeave terminology
description:
  Essential MissionWeave terms for identity, collaboration, work, scheduling,
  and approval.
sidebar:
  badge:
    text: Draft 0.1
    variant: caution
---

This page is a compact learning reference. The
[canonical protocol glossary](https://github.com/MissionWeaveProject/missionweaveprotocol/blob/main/CONTEXT.md)
defines the normative vocabulary for MissionWeave 0.1.

## Organization and identity

**Organization** : The trusted governance boundary that registers Agents,
authenticates humans, and defines policy.

**Agent** : One independently scheduled runtime with a stable identity and at
most one active session.

**Agent Card** : An Organization-signed description of stable identity and
verified, versioned capabilities. It does not contain permissions or reusable
credentials.

**Agent Registry** : The Organization-controlled source for Agent Cards, signing
keys, capability evidence, and validity status.

**Presence Record** : Ephemeral availability, capacity, and heartbeat
information kept separate from the stable Agent Card.

**Group Authority** : Organization infrastructure that validates identity,
Membership, policy, and structured state transitions while appending the ordered
Group Event history.

## Mission collaboration

**Mission** : A bounded objective with a definition of done, budget, deadline,
and Approval lifecycle.

**Group** : The temporary collaboration space and shared history belonging to
exactly one Mission.

**MissionOwner** : The accountable principal. A root MissionOwner is human and
holds final Approval, cancellation, and Coordinator-replacement authority.

**Coordinator** : The replaceable Agent responsible for planning, assignment,
progress monitoring, integration, verification, and submission.

**Worker** : An Agent that accepts and executes WorkItems using its own queues
and Scheduler. One Worker may belong to many Groups.

**Membership** : The scoped authorization that connects an Agent or MissionOwner
to one Group.

## Conversation and work

**Conversation** : An auditable thread of Messages scoped to a Group or one
WorkItem.

**Message** : Committed conversational context. A Message never grants
executable authority by itself.

**Work Proposal** : A non-executable request by a Group member to create a
WorkItem.

**WorkItem** : An explicit unit of Mission work with an owner, lifecycle,
dependencies, and Work Contract.

**Work Offer** : An expiring invitation for an eligible Worker to accept a
WorkItem after local admission control.

**Work Contract** : The goal, deliverables, acceptance criteria, inputs,
permissions, deadline, and retry budget for a WorkItem.

**Artifact** : An immutable, content-addressed deliverable produced or
referenced by Mission work.

**Evidence** : Recorded facts used to evaluate an Artifact or WorkItem against
its acceptance criteria.

**Context Package** : A signed, versioned summary with provenance that gives an
Agent scoped Mission context.

## Coordination and execution

**Command** : A signed request by an authorized actor to make one structured
state transition.

**Event** : An immutable accepted fact in a Group's monotonic history.

**Cursor** : The highest contiguous Group Event position durably processed by an
Agent.

**Ownership Lease** : A bounded reservation that keeps one Worker assigned to an
exclusive WorkItem.

**Execution Lease** : A renewable, fenced grant that allows one Worker session
and Ownership Epoch to execute an exclusive WorkItem.

**Scheduler** : Worker-owned policy that chooses eligible WorkItems across
per-Group queues and capacity slots.

**Checkpoint** : A durable, safe-to-resume execution state reference used for
blocking, recovery, and cooperative preemption.

**Approval** : A durable signed decision accepting a specific Mission revision
and exact Artifact set. A root Mission completes only after human Approval.

## Hierarchy and extension

**Child Mission** : A Mission created to complete one complex WorkItem of a
parent Mission, with budgets and authority narrowed from its parent.

**Follow-up Mission** : A new Mission linked to an immutable approved Mission
when later correction or additional work is required.

**Extension Profile** : An Organization-approved, versioned schema and semantics
package that cannot override core MissionWeave invariants.
