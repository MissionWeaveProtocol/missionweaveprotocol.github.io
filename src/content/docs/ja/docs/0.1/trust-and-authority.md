---
title: 信頼と権限
description:
  MissionWeaveProtocol
  がアイデンティティ、Conversation、割り当て、実行、順序付け、 最終 Approval
  の権限を分離する仕組み。
sidebar:
  order: 5
---

:::caution[ドラフト標準 0.1]

これは非規範的な学習ガイドです。
[正式なプロトコルリポジトリ](https://github.com/missionweaveprotocol/missionweaveprotocol)
が引き続き規範となります。

:::

MissionWeaveProtocol
0.1 は、1 つの信頼された Organization 内で動作します。Organization は、Agent のアイデンティティ、ポリシー、認可、永続的な Group の順序付け、人間による説明責任を担うガバナンスの根幹です。

## 権限を意図的に分割する

| 対象                                   | 権限主体                                     |
| -------------------------------------- | -------------------------------------------- |
| 安定したアイデンティティと検証済み能力 | Organization 管理の Agent Registry           |
| Mission の方向性と最終 Approval        | MissionOwner                                 |
| 計画、割り当て、統合、提出             | 現在の Coordinator Epoch                     |
| Group を横断する実行順序               | Worker 管理の Scheduler                      |
| 遷移の検証と Group ごとの Event 順序   | Group Authority                              |
| ツール、データ、リソース、副作用の権限 | Authorization Service と Organization policy |

Group
Authority は、各 Group に対する 1 つの論理的な権限主体です。実装は内部で複製できますが、合意形成、リーダー選出、レプリカ構成がプロトコルのセマンティクスとして公開されることはありません。

Registry と Session の初期化用 Command および Event は Organization をスコープとし、Group の順序付けコンテキストを持ちません。既存 Group に対する Command は actor に適用される authority
epoch を持ち、Coordinator 専用 Command はさらに payload ではなくトップレベルに
`coordinatorEpoch` を持ちます。

## アイデンティティと Presence は異なる

Agent
Card は、安定し、バージョン管理され、Organization によって署名されたアイデンティティです。公開鍵、エンドポイント、対応プロトコルバージョン、検証済み Capability、最大同時実行数を含みます。再利用可能な認証情報やツールの権限は含みません。

Presence
Record は一時的です。可用性、空いている実行スロット、Capability の可用性、推定応答遅延、ハートビート時刻を報告できます。古い Presence
Record が割り当ての受諾やリース更新になることはありません。

:::note[Capability は認可ではありません]

Capability は、Agent が何を実行できると検証されているかを示します。認可は、現在の Mission のポリシー、所有権、リース、Approval、予算の制約下で、その Agent が特定のリソースに対して特定の操作を実行できるかを決定します。

:::

## Session とフェンシング

WebSocket ハンドシェイクでは、Organization に登録された Ed25519 鍵と新しいチャレンジを使用します。ハンドシェイクに成功すると、短命な Session
Token と新しい Session Epoch が発行されます。Epoch `n + 1`
の発行により、その Agent アイデンティティについて Epoch `n`
以下で動作するすべてのランタイムが無効化されます。

追加の Epoch によって権限はさらに限定されます。

- Membership Epoch は、1 つの Group Membership の古いバージョンを無効化します。
- Coordinator Epoch は、置き換えられた Coordinator とその Grant を無効化します。
- Ownership Epoch は、排他作業の以前の所有者を無効化します。
- Execution Lease ID は、期限切れまたは取り消された実行期間を無効化します。

永続的な Command と Artifact マニフェストは、正規 JSON に対して個別に署名されます。受理済み Event は Group
Authority によって署名されます。

## コンテキストから許可された副作用まで

```text
Message または Work Proposal
        ↓ 明示的な認可
WorkItem と Work Contract
        ↓ Worker の受諾
Ownership Epoch
        ↓ 現在の Session、ポリシー、予算、Approval の確認
Execution Lease と範囲の限定された Capability Token
        ↓
許可された操作
```

Message、Agent Card、Context Package、Artifact、Group
Event に、秘密情報や再利用可能な認証情報を含めてはなりません。高リスク操作では、Authorization
Service が Capability Token を発行する前に、署名済みの人間による Execution
Approval が必要になる場合があります。

Coordinator が結果を検証した後も、ルート Mission には別の最終的な人間の Approval が必要です。Execution
Approval は範囲の限定された高リスク操作を許可し、最終 Approval は完了した Mission リビジョンと Artifact セットを受諾します。

完全なルールについては、規範となる
[identity と session](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#6-identity-agent-registry-and-sessions)、
[Membership と visibility](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#8-membership-visibility-and-attention)、
[authorization と budget](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#12-authorization-budgets-and-side-effects)
を参照してください。
