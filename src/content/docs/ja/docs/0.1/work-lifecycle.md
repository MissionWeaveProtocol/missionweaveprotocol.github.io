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

MissionWeaveProtocol は、会話による協働の柔軟さを保ちながら、実行責任を明示します。どの Group メンバーも、コンテキストを話し合い、支援を求め、作業を提案できます。提案が義務になるのは、認可された WorkItem 遷移を経た場合だけです。

## 話し合いから正式な引き受けまで

1. **話し合う。**
   Agent は Group または WorkItem の Conversation で、確定済みの Message を交換します。
2. **提案する。** どの Group メンバーも Work
   Proposal を提出できます。この時点では実行可能な WorkItem はまだ存在しません。
3. **認可する。**
   現在の Coordinator、MissionOwner による緊急オーバーライド、または有効で範囲の限定された Delegation
   Grant を持つ Agent が WorkItem を作成します。
4. **提示する。**
   Coordinator または範囲の限定された委任先が、適格な Worker に WorkItem を提示し、選定根拠を記録します。
5. **受諾する。** Worker が受入判定を行います。有効な受諾により新しい Ownership
   Epoch が始まり、その Worker の Group ごとのキューに WorkItem が追加されます。

:::note[受諾はスケジューリング上のコミットメントです]

Work Offer の受諾は、即時実行を意味しません。Group を横断する順序は Worker
Scheduler が最終的に決定し、処理能力、依存関係、ポリシー、認可が許可した時点で WorkItem を開始します。

:::

## Work Contract

すべての WorkItem は、バージョン管理された機械可読の Work
Contract を持ちます。そこには次の内容が記録されます。

- 目標、成果物、受け入れ基準
- 必要な Evidence と入力または依存関係の参照
- 許可されるツール、データ、リソース、操作
- 必要な Capability 識別子とバージョン
- 期限、要求された緊急度、ビジネスへの影響
- 金銭、トークン、ツール呼び出し、計算、実時間、副作用の各予算
- 再試行回数、バックオフ、期限、コストポリシー
- リスク分類と、必要な実行前承認ゲート

本質的な曖昧さは受諾前に解消する必要があります。Work
Contract の重要なリビジョンには、Worker による再度の受諾が必要です。

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

実行中の作業は、Checkpoint を記録して `queued`
に戻る、永続的な Checkpoint を伴って `blocked`
に入る、Evidence とともに失敗する、または取り消される場合があります。ブロックされた WorkItem は実行スロットを解放し、その後キューに戻るか、所有権の期限切れ後に再度提示されます。

## Approval の前に Evidence を確認する

Worker の申告だけでは、完了の十分な証明になりません。提出には、受け入れ基準に対応付けられた Artifact と Evidence が含まれます。Coordinator のレビューでは、Artifact の完全性を検証し、利用可能な決定論的チェックを実行し、定性的な基準についてレビュー担当 Agent の Evidence を要求し、結果を保持することが望まれます。

必要な WorkItem がすべて verified になると、Coordinator は特定の Mission リビジョンと Artifact セットを提出します。MissionOwner は最終 Approval に署名するか、変更を要求します。変更要求は過去の提出を消去せず、同じ Mission を再び開きます。

完全な遷移と権限規則については、規範となる
[WorkItem 状態機械](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#102-workitem-state-machine)
および
[Evidence に基づくレビュー](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#132-evidence-based-review)
を参照してください。
