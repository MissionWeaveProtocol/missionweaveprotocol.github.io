---
title: Work lifecycle
description:
  How MissionWeaveProtocol moves from conversation and work proposals to
  accepted, verified, and human-approved results.
sidebar:
  order: 3
---

:::caution[Draft Standard 0.1]

This is a non-normative learning guide. The
[canonical protocol repository](https://github.com/missionweaveprotocol/missionweaveprotocol)
remains normative.

:::

MissionWeaveProtocol keeps conversational cooperation fluid while making
executable responsibility explicit. Any Group member may discuss context,
request help, or propose work. A proposal becomes an obligation only through an
authorized WorkItem transition.

## From discussion to commitment

1. **Discuss.** Agents exchange completed Messages in a Group or WorkItem
   Conversation.
2. **Propose.** Any Group member may submit a Work Proposal. No executable
   WorkItem exists yet.
3. **Authorize.** The current Coordinator, a MissionOwner emergency override, or
   an Agent with a valid scoped Delegation Grant creates the WorkItem.
4. **Offer.** The Coordinator or scoped delegate offers the WorkItem to an
   eligible Worker and records the selection basis.
5. **Accept.** The Worker performs admission control. A valid acceptance begins
   a new Ownership Epoch and places the WorkItem in that Worker's per-Group
   queue.

:::note[Acceptance is a scheduling commitment]

Accepting an offer does not mean immediate execution. The Worker Scheduler has
final control over cross-Group ordering and starts the WorkItem when capacity,
dependencies, policy, and authorization allow.

:::

## The Work Contract

Every WorkItem carries a versioned, machine-readable Work Contract. It records:

- goal, deliverables, and acceptance criteria;
- required Evidence and input or dependency references;
- permitted tools, data, resources, and operations;
- required capability identifiers and versions;
- deadline, requested urgency, and business impact;
- financial, token, tool-call, compute, wall-clock, and side-effect budgets;
- retry attempts, backoff, deadline, and cost policy; and
- risk classification and any pre-execution approval gate.

An essential ambiguity must be resolved before acceptance. A material contract
revision requires renewed Worker acceptance.

## A common successful path

```text
Work Proposal
    ↓ authorize
open WorkItem
    ↓ offer
offered
    ↓ Worker accepts
queued
    ↓ valid ownership, approval gates, and Execution Lease
active
    ↓ Worker submits Artifacts and Evidence
submitted
    ↓ Coordinator accepts the result
verified
```

Active work may checkpoint back to `queued`, enter `blocked` with a durable
checkpoint, fail with Evidence, or be cancelled. A blocked WorkItem releases its
execution slot and later returns to a queue or is re-offered after ownership
expires.

## Evidence before approval

A Worker claim is not sufficient proof of completion. Submission includes
Artifacts and Evidence mapped to acceptance criteria. Coordinator review should
validate Artifact integrity, run deterministic checks where available, request
reviewer-Agent Evidence for qualitative criteria, and retain the result.

After all required WorkItems are verified, the Coordinator submits a specific
Mission revision and Artifact set. The MissionOwner either signs final Approval
or requests changes. A change request reopens the same Mission without erasing
earlier submissions.

For the complete transitions and authority rules, read the normative
[WorkItem state machine](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#102-workitem-state-machine)
and
[Evidence-based review](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#132-evidence-based-review).
