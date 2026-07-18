---
title: サブタスク
description:
  複雑な WorkItem を、独自の Group を持つ範囲の限定されたサブタスクへ
  再帰的に分解し、スコープ、予算、Evidence、人間の説明責任を維持します。
sidebar:
  order: 6
---

:::caution[ドラフト標準 0.1]

これは非規範的な学習ガイドです。
[正式なプロトコルリポジトリ](https://github.com/missionweaveprotocol/missionweaveprotocol)
が引き続き規範となります。

:::

十分に複雑な WorkItem は、**サブタスク（Child
Mission）**にできます。ここでいうサブタスクは独立した Mission であり、WorkItem ではありません。独自の Group、Coordinator、WorkItem グラフ、Membership、予算、期限、Approval ポリシーを持ちます。親 WorkItem とサブタスクは相互にリンクします。

```text
ルート Mission と Group
└── 親 WorkItem が `blocked` になる
    └── サブタスクと専用 Group
        ├── サブタスクの Coordinator
        ├── サブタスク内の WorkItem と Evidence
        └── サブタスクの Approval
            └── 結果が Evidence と Artifact として
                親 WorkItem に戻る
```

:::note[1 つの Mission が持つ Group は引き続き 1 つです]

サブタスクを作成しても、親 Group が入れ子のチャットルームになるわけではありません。サブタスクには別の Group が与えられ、認可された要約、Artifact、Evidence、安定したリンクだけを親 Mission と共有します。

:::

## 権限と Approval

デフォルトでは、サブタスクの Coordinator が結果をレビューして提出します。親 Mission の Coordinator はサブタスクの MissionOwner として、親 WorkItem を代表してサブタスクを承認します。Organization のリスクポリシーにより、人間による直接の Approval が追加で必要になる場合もあります。

承認されたサブタスクの結果は、親 WorkItem の Evidence と Artifact になります。親 Mission の Coordinator は、状態変更、要約、更新された見積もり、ブロック理由、予算またはポリシーのエスカレーション、最終結果を受け取ります。サブタスク内のすべての Message を受け取る必要はありませんが、必要に応じて認可された範囲で確認できます。ルート MissionOwner は Mission ツリー全体を確認できます。

## 下位ほどスコープが狭くなります

親子グラフは循環してはなりません。サブタスクの予算、期限、Capability、データアクセス、権限は、親 Mission の範囲内でなければなりません。Organization はデフォルトの最大深度を設定し、そのしきい値を超える場合は MissionOwner またはポリシーによる明示的な Approval を要求します。

深度制限は安全のためのガードレールであり、固定上限ではありません。追加のスコープまたは深度が明示的に承認されれば、正当な複雑作業を継続できます。

## 失敗しても親 WorkItem が自動的に失敗するわけではありません

失敗したサブタスクは構造化された失敗 Evidence を発行し、宣言済みポリシーに従って親 WorkItem をブロックまたは失敗させます。親 Mission の Coordinator は、再計画、スコープの修正、代替サブタスクの作成、ブランチの中止を行えます。失敗が自動的に伝播するのは、親 WorkItem の完了ポリシーがサブタスクを不可欠と宣言し、代替手段を用意していない場合だけです。

## サブタスクと Follow-up Mission の使い分け

- `active`
  な親 Mission 内の複雑な WorkItem を完了するには、**サブタスク**を使用します。
- 承認済み Mission が不変になった後の修正、是正、追加作業には、 **Follow-up
  Mission** を使用します。

完全なルールについては、規範となる
[親 Mission とサブタスク](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#14-parent-and-child-missions)
および
[Mission のライフサイクル](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#7-mission-and-group-lifecycle)
を参照してください。
