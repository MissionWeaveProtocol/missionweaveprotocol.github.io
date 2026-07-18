---
title: コアモデル
description:
  MissionWeaveProtocol 0.1 を構成する Mission、Group、役割、永続レコード、
  ローカル投影。
sidebar:
  order: 2
---

:::caution[ドラフト標準 0.1]

これは非規範的な学習ガイドです。
[正式なプロトコルリポジトリ](https://github.com/missionweaveprotocol/missionweaveprotocol)
が引き続き規範となります。

:::

MissionWeaveProtocol は、範囲の定められた **Mission** と、その一時的な **Group**
を中心に協働を構成します。各 Mission は正確に 1 つの主 Group を持ち、各主 Group は正確に 1 つの Mission に属します。

```text
Organization
├── Agent Registry
├── Group Authority と永続 Event ストア
├── Authorization Service
└── Mission
    └── Group
        ├── MissionOwner
        ├── Coordinator
        ├── Worker の Membership
        ├── Conversation と Message
        ├── WorkItem と Work Contract
        └── 順序付けられた Event、Artifact、Evidence、Approval
```

## 役割と責務

| 役割                  | 責務                                                                  | 重要な境界                                             |
| --------------------- | --------------------------------------------------------------------- | ------------------------------------------------------ |
| Organization          | アイデンティティ、ポリシー、認可、基盤を統括する                      | 0.1 における唯一の信頼境界                             |
| MissionOwner          | 方向性を定め、進捗を確認し、介入し、最終 Approval を行う              | ルート MissionOwner は人間                             |
| Coordinator           | Mission を計画、割り当て、監視、統合し、提出する                      | 交換可能で、Coordinator Epoch によりフェンシングされる |
| Worker                | 自身のキューと Scheduler を通じて WorkItem を受諾し、実行する         | 同じ Agent が複数の Group で働ける                     |
| Group Authority       | 実行主体を認証し、ポリシーを検証し、遷移を直列化して Event を追記する | 状態を順序付けるが、Mission の意味は管理しない         |
| Authorization Service | 必要な検査後に、短命で範囲の限定された Capability Token を発行する    | Capability は認可ではない                              |

**Agent Card**
は、Organization 署名付きの安定したアイデンティティと検証済み Capability を保持します。**Presence
Record**
は、一時的な可用性と処理能力を保持します。一時的な可用性によって信頼済みのアイデンティティが書き換わってはならないため、両者は分離されています。

## 協働をつなぐレコード

- **Membership** は、Principal を 1 つの Group、役割集合、可視範囲、Membership
  Epoch に接続します。
- **Conversation**
  は、Group の計画または 1 つの WorkItem に関する永続的な Message を含みます。
- **WorkItem** は、Mission 作業の実行可能な単位です。その **Work Contract**
  が目標、成果物、Evidence、権限、期限、予算を定義します。
- **Artifact** は、不変でコンテンツアドレス指定された成果物です。
- **Evidence**
  は、Artifact または WorkItem が受け入れ基準を満たす方法を記録します。
- **Event**
  は、1 つの Group の単調増加する履歴に含まれる、不変の受理済み事実です。
- **Cursor** は、Agent が永続的に処理した、連続する Group
  Event の最上位位置を記録します。

:::note[Message が暗黙の割り当てになることはありません]

Message はコンテキストを提供したり、作業を提案したりできます。実行可能な責任が始まるのは、認可された WorkItem 遷移と Worker の受諾の後だけです。

:::

## 権威状態とローカル投影

MissionWeaveProtocol は、共有される正本と、再構築可能な Worker の状態を分離します。

**権威状態**には、Mission、Membership、WorkItem、ownership と lease の epoch、重複排除レシート、Approval、Group
Event が含まれます。Group Authority が、この状態への変更を直列化します。

**Agent のローカル投影**には、Cursor、Group ごとのキュー、Checkpoint、送信箱、受信箱、Scheduler の状態が含まれます。Agent は永続的な Event からこれらを再構築できます。ローカルデータベースが失われても、権威 Mission 状態が変わってはなりません。

## 覚えておくべき不変条件

- 1 つの Mission は、1 つの主 Group と、Group ごとに 1 つの Event 順序を持ちます。
- Conversation は実行権限ではありません。
- 排他作業は ownership と lease の epoch によりフェンシングされます。
- 受理済み Event と確定済み Message は追記専用です。
- Mission のコンテキストと認証情報はデフォルトで分離されます。
- WorkItem とサブタスクの予算および権限は、親を超えられません。
- ルート Mission の完了には、正確な Mission リビジョンと Artifact セットに対する人間の Approval が必要です。
- Agent は監査に必要な決定、入力、Evidence、阻害要因、結果を公開し、非公開の思考過程は公開しません。

完全なルールについては、規範となる
[コア不変条件](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#4-core-invariants)
および
[システムアーキテクチャ](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#5-system-architecture)
を参照してください。
