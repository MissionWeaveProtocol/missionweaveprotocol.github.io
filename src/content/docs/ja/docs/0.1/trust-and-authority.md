---
title: 信頼と権限
description:
  MissionWeaveProtocol が
  identity、Conversation、assignment、execution、ordering、 final Approval の
  authority を分離する仕組み。
sidebar:
  order: 5
---

:::caution[ドラフト標準 0.1]

これは非規範的な学習ガイドです。
[正式なプロトコルリポジトリ](https://github.com/missionweaveprotocol/missionweaveprotocol)
が引き続き規範となります。

:::

MissionWeaveProtocol
0.1 は、1 つの信頼された Organization 内で動作します。Organization は、Agent
identity、policy、authorization、durable な Group
ordering、人間による accountability のガバナンスルートです。

## authority を意図的に分割する

| 対象                                         | authority                                    |
| -------------------------------------------- | -------------------------------------------- |
| 安定した identity と検証済み capability      | Organization-controlled Agent Registry       |
| Mission の方向性と final Approval            | MissionOwner                                 |
| 計画、assignment、統合、提出                 | 現在の Coordinator Epoch                     |
| Group を横断する execution order             | Worker-owned Scheduler                       |
| transition の検証と Group ごとの Event order | Group Authority                              |
| tool、data、resource、side effect の権限     | Authorization Service と Organization policy |

Group
Authority は、各 Group に対する 1 つの論理 authority です。実装は内部で複製できますが、consensus、leader
election、replica
topology がプロトコル semantics として公開されることはありません。

Registry と Session の bootstrap
Command および Event は Organization をスコープとし、Group の順序付けコンテキストを持ちません。既存 Group に対する Command は actor に適用される authority
epoch を持ち、Coordinator 専用 Command はさらに payload ではなくトップレベルに
`coordinatorEpoch` を持ちます。

## identity と presence は異なる

Agent
Card は、安定し、バージョン管理され、Organization によって署名された identity です。public
key、endpoint、対応プロトコルバージョン、検証済み capability、最大 concurrency を含みます。再利用可能な credential や tool の権限は含みません。

Presence Record は一時的です。可用性、空いている execution
slot、capability の可用性、推定 response latency、heartbeat
time を報告できます。stale な Presence Record が assignment acceptance や lease
renewal になることはありません。

:::note[capability は authorization ではありません]

capability は、Agent が何を実行できると検証されているかを示します。authorization は、現在の Mission
policy、ownership、lease、approval、budget の制約下で、その Agent が特定の resource に対して特定の operation を実行できるかを決定します。

:::

## session と fencing

WebSocket handshake では、Organization に登録された Ed25519
key と新しい challenge を使用します。handshake に成功すると、短命な session
token と新しい Session Epoch が発行されます。epoch `n + 1`
の発行により、その Agent identity について epoch `n`
以下で動作するすべての runtime が fenced されます。

追加の epoch によって authority はさらに限定されます。

- Membership Epoch は、1 つの Group Membership の古い version を fence します。
- Coordinator
  Epoch は、置き換えられた Coordinator とその grant を fence します。
- Ownership Epoch は、exclusive work の以前の owner を fence します。
- Execution Lease ID は、expired または revoked になった execution
  period を fence します。

durable Command と Artifact manifest は、canonical
JSON に対して個別に署名されます。accepted Event は Group
Authority によって署名されます。

## context から許可された side effect まで

```text
Message または Work Proposal
        ↓ 明示的な認可
WorkItem と Work Contract
        ↓ Worker の受諾
Ownership Epoch
        ↓ 現在の session、policy、budget、approval の確認
Execution Lease とスコープ付き capability token
        ↓
許可された操作
```

Message、Agent Card、Context Package、Artifact、Group
Event に、secret や再利用可能な credential を含めてはなりません。high-risk
operation では、Authorization Service が capability
token を発行する前に、署名済みの人間による Execution
Approval が必要になる場合があります。

Coordinator が result を検証した後も、ルート Mission には別の final human
Approval が必要です。Execution Approval は範囲の限定された risky
operation を許可し、final Approval は完了した Mission revision と Artifact
set を受諾します。

完全なルールについては、規範となる
[identity と session](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#6-identity-agent-registry-and-sessions)、
[Membership と visibility](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#8-membership-visibility-and-attention)、
[authorization と budget](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#12-authorization-budgets-and-side-effects)
を参照してください。
