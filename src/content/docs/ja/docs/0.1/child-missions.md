---
title: 子 Mission
description:
  scope、budget、Evidence、人間の説明責任を失わずに、複雑な WorkItem
  を範囲の定められた Mission Group へ再帰的に分解する仕組み。
sidebar:
  order: 6
---

:::caution[ドラフト標準 0.1]

これは非規範的な学習ガイドです。
[正式なプロトコルリポジトリ](https://github.com/missionweaveprotocol/missionweaveprotocol)
が引き続き規範となります。

:::

十分に複雑な WorkItem は、**子 Mission**
にできます。子 Mission は、独自の Group、Coordinator、WorkItem
graph、Membership、budget、deadline、approval
policy を持ちます。親 WorkItem と子 Mission は相互にリンクします。

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

:::note[1 つの Mission が持つ Group は引き続き 1 つです]

子 Mission を作成しても、親 Group が入れ子のチャットルームになるわけではありません。子 Mission には別の Group が与えられ、認可された要約、Artifact、Evidence、安定したリンクだけを親と共有します。

:::

## authority と Approval

デフォルトでは、子 Mission の Coordinator が結果を review して提出します。Parent
Coordinator は子 MissionOwner として、親 WorkItem を代表して子 Mission を承認します。Organization の risk
policy により、人間の直接 Approval が追加で必要になる場合もあります。

承認された子 Mission の結果は、親 WorkItem の Evidence と Artifact になります。Parent
Coordinator は、状態変更、要約、更新された見積もり、blocker、budget または policy
escalation、最終結果を受け取ります。すべての子 Mission の Message を受け取る必要はありませんが、authorized な必要時の inspection は引き続き可能です。ルート MissionOwner は、Mission
tree 全体を inspect できます。

## scope は下位ほど狭くなる

親子 graph は循環してはなりません。子 Mission の budget、deadline、capability、data
access、permission は、親の subset でなければなりません。Organization はデフォルトの maximum
depth を設定し、そのしきい値を超える場合は MissionOwner または policy の明示的な Approval を要求します。

depth
limit は guardrail であり、固定された上限ではありません。正当な複雑作業は、追加の scope または depth が明示的に承認されれば継続できます。

## failure が親全体を自動的に巻き込むわけではない

失敗した子 Mission は structured failure
Evidence を emit し、宣言済み policy に従って親 WorkItem を block または fail させます。Parent
Coordinator は、再計画、scope の revision、代替となる子 Mission の作成、branch の cancel を行えます。failure が自動的に propagate するのは、親の completion
policy が子 Mission を不可欠と宣言し、代替手段を提供していない場合だけです。

## 子 Mission と follow-up Mission の使い分け

- active な親 Mission 内の複雑な WorkItem を完了するには、**子 Mission**
  を使用します。
- approved Mission が immutable になった後の修正、remediation、追加作業には、
  **follow-up Mission** を使用します。

完全なルールについては、規範となる
[親 Mission と子 Mission](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#14-parent-and-child-missions)
および
[Mission lifecycle](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#7-mission-and-group-lifecycle)
を参照してください。
