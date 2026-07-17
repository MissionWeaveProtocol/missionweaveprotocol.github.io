---
title: JSON Schema
description:
  MissionWeaveProtocol 0.1 の規範となる 21 個の JSON Schema を参照します。
sidebar:
  label: JSON Schema
  order: 2
---

MissionWeaveProtocol 0.1 は、**JSON Schema Draft
2020-12 に準拠した 21 個の規範ファイル**を定義します。正本となるファイルは、プロトコルリポジトリの
[`schemas/` ディレクトリ](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/schemas)
にあります。

wire property name には lower camel case を使用します。core
object は未知の property を拒否し、承認済みの extension data は明示的な
`extensions` member にのみ格納されます。

## Schema カタログ

| Schema                                                                                                                                          | 用途                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [`common.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/common.schema.json)                       | 他の schema が使用する共有プロトコル定義                             |
| [`agent-card.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/agent-card.schema.json)               | Organization 署名付きの安定した Agent identity と検証済み capability |
| [`presence-record.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/presence-record.schema.json)     | 一時的な Agent の可用性と処理能力                                    |
| [`mission.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/mission.schema.json)                     | Mission の目的、ownership、budget、Approval lifecycle                |
| [`group.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/group.schema.json)                         | 1 つの Mission に属する一時的な協働 Group                            |
| [`group-snapshot.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/group-snapshot.schema.json)       | Group 履歴の署名済み archive snapshot                                |
| [`membership.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/membership.schema.json)               | Principal を Group に接続する、範囲の限定された authorization        |
| [`conversation.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/conversation.schema.json)           | 監査可能な Group または WorkItem の Conversation thread              |
| [`message.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/message.schema.json)                     | execution authority を付与しない、commit 済みの会話 context          |
| [`work-contract.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/work-contract.schema.json)         | 作業目標、成果物、条件、input、権限、deadline、retry budget          |
| [`work-item.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/work-item.schema.json)                 | lifecycle と ownership を含む、明示的な Mission 作業の単位           |
| [`artifact.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/artifact.schema.json)                   | immutable で content-addressed な成果物 manifest                     |
| [`evidence.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/evidence.schema.json)                   | acceptance criteria に照らして評価される記録済みの事実               |
| [`approval.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/approval.schema.json)                   | 正確な Mission result に対する署名済み Approval                      |
| [`context-package.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/context-package.schema.json)     | 署名済みで範囲が限定され、provenance を持つ Mission context          |
| [`command.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/command.schema.json)                     | 1 つの構造化された state transition を求める署名済み request         |
| [`event.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/event.schema.json)                         | Group の順序付き履歴に含まれる immutable な accepted fact            |
| [`error.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/error.schema.json)                         | 構造化されたプロトコル error document                                |
| [`lease.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/lease.schema.json)                         | renewable かつ epoch-fenced な execution lease                       |
| [`extension-profile.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/extension-profile.schema.json) | governance 対象となる extension definition と compatibility metadata |
| [`websocket-frame.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/websocket-frame.schema.json)     | canonical WebSocket frame union                                      |

正本となる
[schema README](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/README.md)
に共有 validation rule が記録されています。

## プロトコルリポジトリを検証する

`missionweaveprotocol` のソース checkout で実行します。

```bash
python -m pip install -r requirements-validation.txt
python scripts/check_repository_policy.py
python scripts/validate_protocol.py
```

validator は reference を解決する前に、すべての schema を `$id`
で登録する必要があります。schema validation が証明するのは構造上の適合性であり、
[仕様](../specification/)に定める動作要件ではありません。

[適合性 manifest](../conformance/)
は、これらの schema に対する expected-valid および expected-invalid
instance を提供します。
