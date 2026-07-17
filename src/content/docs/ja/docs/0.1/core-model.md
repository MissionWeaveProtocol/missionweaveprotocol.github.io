---
title: コアモデル
description:
  MissionWeaveProtocol 0.1 を構成する Mission、Group、role、永続 record、 local
  projection。
sidebar:
  order: 2
---

:::caution[ドラフト標準 0.1]

これは非規範的な学習ガイドです。
[正式なプロトコルリポジトリ](https://github.com/missionweaveprotocol/missionweaveprotocol)
が引き続き規範となります。

:::

MissionWeaveProtocol は、範囲の定められた **Mission** と、その一時的な **Group**
を中心に協働を構成します。各 Mission は正確に 1 つの primary
Group を持ち、各 primary Group は正確に 1 つの Mission に属します。

```text
Organization
├── Agent Registry
├── Group Authority and durable Event store
├── Authorization Service
└── Mission
    └── Group
        ├── MissionOwner
        ├── Coordinator
        ├── Worker Memberships
        ├── Conversations and Messages
        ├── WorkItems and Work Contracts
        └── ordered Events, Artifacts, Evidence, and Approvals
```

## role と責務

| role                  | 責務                                                                      | 重要な境界                                         |
| --------------------- | ------------------------------------------------------------------------- | -------------------------------------------------- |
| Organization          | identity、policy、authorization、基盤を統括する                           | 0.1 における唯一の trust boundary                  |
| MissionOwner          | 方向性を定め、進捗を確認し、介入し、最終 Approval を行う                  | ルート MissionOwner は人間                         |
| Coordinator           | Mission を計画、割り当て、監視、統合し、提出する                          | 交換可能で、Coordinator Epoch により fenced される |
| Worker                | 自身の queue と Scheduler を通じて WorkItem を受諾し、実行する            | 同じ Agent が複数の Group で働ける                 |
| Group Authority       | actor を認証し、policy を検証し、transition を直列化して Event を追記する | state を順序付けるが、Mission の意味は管理しない   |
| Authorization Service | 必要な検査後に、短命で scope の限定された capability token を発行する     | capability は authorization ではない               |

**Agent Card**
は、Organization 署名付きの安定した identity と検証済み capability を保持します。**Presence
Record**
は、一時的な可用性と処理能力を保持します。一時的な可用性によって信頼済み identity が書き換わってはならないため、両者は分離されています。

## 協働をつなぐ record

- **Membership** は、Principal を 1 つの Group、role set、visibility
  range、Membership Epoch に接続します。
- **Conversation** は、Group の計画または 1 つの WorkItem に関する durable
  Message を含みます。
- **WorkItem** は、Mission 作業の実行可能な単位です。その **Work Contract**
  が目標、成果物、Evidence、権限、deadline、budget を定義します。
- **Artifact** は、immutable で content-addressed な成果物です。
- **Evidence** は、Artifact または WorkItem が acceptance
  criteria を満たす方法を記録します。
- **Event** は、1 つの Group の単調増加する履歴に含まれる、immutable な accepted
  fact です。
- **Cursor** は、Agent が durable に処理した、連続する Group
  Event の最上位位置を記録します。

:::note[Message が暗黙の assignment になることはありません]

Message は context を提供したり、作業を提案したりできます。実行可能な責任が始まるのは、authorized
WorkItem transition と Worker acceptance の後だけです。

:::

## authoritative state と local projection

MissionWeaveProtocol は、共有される正本と、再構築可能な Worker
state を分離します。

**Authoritative state** には、Mission、Membership、WorkItem、ownership
epoch、lease epoch、deduplication receipt、Approval、Group
Event が含まれます。Group Authority が、この state への変更を直列化します。

**Agent-local projection**
には、Cursor、Group ごとの queue、checkpoint、outbox、inbox、Scheduler
state が含まれます。Agent は durable Event からこれらを再構築できます。local
database が失われても、authoritative Mission state が変わってはなりません。

## 覚えておくべき invariant

- 1 つの Mission は、1 つの primary Group と、Group ごとに 1 つの Event
  order を持ちます。
- Conversation は execution authority ではありません。
- exclusive work は ownership epoch と lease epoch により fenced されます。
- accepted Event と committed Message は append-only です。
- Mission context と credential はデフォルトで分離されます。
- WorkItem と child Mission の budget および permission は、親を超えられません。
- ルート Mission の完了には、正確な revision と Artifact
  set に対する人間の Approval が必要です。
- Agent は audit に必要な決定、input、Evidence、blocker、outcome を公開し、private
  chain-of-thought は公開しません。

完全なルールについては、規範となる
[core invariant](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#4-core-invariants)
および
[system architecture](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#5-system-architecture)
を参照してください。
