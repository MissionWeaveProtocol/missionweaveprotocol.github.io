---
title: 作業ライフサイクル
description:
  MissionWeaveProtocol が Conversation と Work Proposal から、受諾、検証され、
  人間に承認された結果へ進む仕組み。
sidebar:
  order: 3
---

:::caution[ドラフト標準 0.1]

これは非規範的な学習ガイドです。
[正式なプロトコルリポジトリ](https://github.com/missionweaveprotocol/missionweaveprotocol)
が引き続き規範となります。

:::

MissionWeaveProtocol は、会話による協働の柔軟さを保ちながら、実行責任を明示します。どの Group
member も、context を話し合い、支援を求め、作業を提案できます。提案が義務になるのは、authorized
WorkItem transition を経た場合だけです。

## 話し合いから正式な引き受けまで

1. **話し合う。**
   Agent は Group または WorkItem の Conversation で、完成した Message を交換します。
2. **提案する。** どの Group member も Work
   Proposal を提出できます。この時点では実行可能な WorkItem はまだ存在しません。
3. **認可する。**
   現在の Coordinator、MissionOwner による緊急 override、または有効で scope の限定された Delegation
   Grant を持つ Agent が WorkItem を作成します。
4. **offer する。**
   Coordinator または scope の限定された delegate が適格な Worker に WorkItem を offer し、選定根拠を記録します。
5. **受諾する。**
   Worker が受入判定を行います。有効な acceptance により新しい Ownership
   Epoch が始まり、その Worker の Group ごとの queue に WorkItem が追加されます。

:::note[acceptance はスケジューリング上の commitment です]

offer の受諾は、即時実行を意味しません。Group を横断する順序は Worker
Scheduler が最終的に決定し、処理能力、dependency、policy、authorization が許可した時点で WorkItem を開始します。

:::

## Work Contract

すべての WorkItem は、バージョン管理された機械可読の Work
Contract を持ちます。そこには次の内容が記録されます。

- 目標、成果物、acceptance criteria
- 必要な Evidence と input または dependency reference
- 許可される tool、data、resource、operation
- 必要な capability identifier と version
- deadline、要求された urgency、business impact
- financial、token、tool-call、compute、wall-clock、side-effect の各 budget
- retry attempt、backoff、deadline、cost policy
- risk classification と、必要な実行前 approval gate

本質的な曖昧さは acceptance 前に解消する必要があります。重要な contract
revision には、Worker による再度の acceptance が必要です。

## 一般的な成功経路

```text
Work Proposal
    ↓ 認可
open 状態の WorkItem
    ↓ offer
offered
    ↓ Worker が受諾
queued
    ↓ 有効な ownership、approval gate、Execution Lease
active
    ↓ Worker が Artifact と Evidence を提出
submitted
    ↓ Coordinator が結果を受諾
verified
```

active work は checkpoint を記録して `queued` に戻る、durable
checkpoint を伴って `blocked`
に入る、Evidence とともに fail する、または cancel される場合があります。blocked
WorkItem は execution
slot を解放し、その後 queue に戻るか、ownership の期限切れ後に再度 offer されます。

## Approval の前に Evidence を確認する

Worker の申告だけでは、完了の十分な証明になりません。submission には、acceptance
criteria に対応付けられた Artifact と Evidence が含まれます。Coordinator
review では、Artifact の integrity の検証、利用可能な deterministic
check の実行、定性的な criteria に対する reviewer
Agent の Evidence の要求、結果の保持を行う必要があります。

必要な WorkItem がすべて verified になると、Coordinator は特定の Mission
revision と Artifact set を提出します。MissionOwner は final
Approval に署名するか、変更を request します。change
request は過去の submission を消去せず、同じ Mission を再び開きます。

完全な transition と authority rule については、規範となる
[WorkItem state machine](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#102-workitem-state-machine)
および
[Evidence-based review](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#132-evidence-based-review)
を参照してください。
