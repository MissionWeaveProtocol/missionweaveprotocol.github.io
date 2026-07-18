---
title: MissionWeaveProtocol 用語集
description:
  アイデンティティ、協働、作業、スケジューリング、承認に関する
  MissionWeaveProtocol の主要用語。
sidebar:
  badge:
    text: ドラフト 0.1
    variant: caution
---

このページは、学習用の簡潔なリファレンスです。
[正式なプロトコル用語集](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/CONTEXT.md)
が MissionWeaveProtocol 0.1 の規範となる用語体系を定義します。

## Organization とアイデンティティ

**Organization**：Agent を登録し、人間を認証し、policy を定める、信頼されたガバナンス境界。

**Agent**：安定した identity を持ち、active
session は同時に最大 1 つに限られる、独立してスケジュールされる実行主体。

**Agent
Card**：安定した identity と、検証済みでバージョン管理された capability を記述する、Organization 署名付きの文書。権限や再利用可能な認証情報は含みません。

**Agent Registry**：Agent
Card、署名鍵、capability の Evidence、有効状態を管理する、Organization が管理するソース。

**Presence Record**：安定した Agent
Card とは分離して保持される、一時的な可用性、処理能力、heartbeat の情報。

**Group Authority**：identity、Membership、policy、構造化された state
transition を検証しながら、順序付けられた Group
Event 履歴を追記する Organization の基盤。

## Mission における協働

**Mission**：完了条件、budget、deadline、Approval
lifecycle を持つ、範囲の定められた目的。

**Group**：正確に 1 つの Mission に属する、一時的な協働空間と共有履歴。

**MissionOwner**：説明責任を負う Principal。ルート MissionOwner は人間であり、最終 Approval、cancel、Coordinator
replacement の権限を持ちます。

**Coordinator**：計画、割り当て、進捗監視、統合、検証、提出を担当する、交換可能なAgent。

**Worker**：自身の queue と Scheduler を使って WorkItem を受諾し、実行する Agent。1 つの Worker が複数の Group に所属できます。

**Membership**：Agent または MissionOwner を 1 つの Group に接続する、範囲の限定された authorization。

## Conversation と作業

**Conversation**：Group または 1 つの WorkItem を対象とする、監査可能な Message
thread。

**Message**：commit された会話 context。Message だけで実行権限が付与されることはありません。

**Work Proposal**：Group
member が WorkItem の作成を求める、実行権限を伴わない request。

**WorkItem**：owner、lifecycle、dependency、Work
Contract を持つ、明示的な Mission 作業の単位。

**Work
Offer**：適格な Worker に対し、ローカルな受入判定の後で WorkItem を受諾するよう求める、有効期限付きの招待。

**Work Contract**：WorkItem の目標、成果物、acceptance
criteria、input、権限、deadline、retry budget。

**Artifact**：Mission 作業によって生成または参照される、immutable で content-addressed な成果物。

**Evidence**：Artifact または WorkItem を acceptance
criteria に照らして評価するために記録された事実。

**Context Package**：Agent に範囲の限定された Mission
context を提供する、provenance 付きで署名済み、バージョン管理された要約。

## 調整と実行

**Command**：権限を持つ actor が 1 つの構造化された state
transition を行うための、署名済み request。

**Event**：Group の単調増加する履歴に記録された、immutable な accepted fact。

**Cursor**：Agent が durable に処理した、連続する Group Event の最上位位置。

**Ownership Lease**：1 つの Worker を exclusive
WorkItem に割り当て続ける、範囲の定められた予約。

**Execution Lease**：1 つの Worker session と Ownership Epoch に exclusive
WorkItem の実行を許可する、更新可能で fenced な grant。

**Scheduler**：Group ごとの queue と capacity
slot を横断して適格な WorkItem を選択する、Worker が管理する policy。

**Checkpoint**：blocking、recovery、cooperative
preemption に使用する、durable で安全に再開できる execution state の参照。

**Approval**：特定の Mission revision と正確な Artifact
set を受諾する、durable で署名済みの決定。ルート Mission は人間の Approval 後にのみ完了します。

## 階層と extension

**サブタスク（Child
Mission）**：親 Mission の複雑な WorkItem を完了するために作成される独立した Mission。WorkItem ではなく、独自の Group を持ち、budget と権限は親より狭く設定されます。

**Follow-up
Mission**：後から修正または追加作業が必要になった場合に、immutable な approved
Mission にリンクして作成される新しい Mission。

**Extension Profile**：core MissionWeaveProtocol
invariant を上書きできない、Organization が承認し、バージョン管理する schema と semantics の package。
