---
title: MissionWeaveProtocol 0.1
description:
  規範となる MissionWeaveProtocol の仕様とプロトコル用語集を参照します。
sidebar:
  label: 仕様
  order: 1
banner:
  content:
    MissionWeaveProtocol 0.1 は
    <strong>ドラフト標準</strong>です。規範要件については
    正式なリポジトリを参照してください。
---

MissionWeaveProtocol
0.1 は、1 つの Organization 内で働く自律 Agent のための Group 指向の協働を定義します。アイデンティティ、Mission
Group、明示的な WorkItem、Agent 間の Message、スケジューリング、権限、永続的な順序付け、リプレイ、検証、人間による承認を対象とします。

## 規範となるソース

この Web サイトは MissionWeaveProtocol を解説し、関連資料へのリンクを提供しますが、規範となるプロトコルソースではありません。
[`missionweaveprotocol` リポジトリ](https://github.com/missionweaveprotocol/missionweaveprotocol)
が次の正本となる成果物を管理します。

- [MissionWeaveProtocol 0.1 仕様](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md)
- [プロトコル用語集](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/CONTEXT.md)
- [規範となる JSON Schema](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/schemas)
- [適合性 manifest と vector](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/conformance)
- [Signed Document 暗号マニフェストとベクトル](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/cryptography)

このガイドと規範成果物の内容が異なる場合は、プロトコルリポジトリ内の成果物が優先されます。

## バージョンと識別子

現在のプロトコルバージョンは `0.1` です。wire namespace は
`missionweaveprotocol` です。

- プロトコル識別子は `urn:missionweaveprotocol:*` を使用します。
- 組み込み extension kind は `ext.missionweaveprotocol.*` を使用します。
- schema 識別子は `https://missionweaveprotocol.dev/schemas/0.1/` を使用します。

プロトコルリリースと SDK リリースは独立してバージョニングされます。実装は、バージョン番号の一致から互換性を推測するのではなく、互換性を宣言し、リリース済みのプロトコルバージョンまたは正確な commit に固定する必要があります。

## 推奨する読み進め方

1. 共有の用語体系を理解するために、
   [プロトコル用語集](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/CONTEXT.md)
   から始めます。
2. 要件とライフサイクル規則について、
   [規範となる仕様](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md)
   を読みます。
3. 文書構造について [schema リファレンス](../schemas/) を参照します。
4. 実装に対して [適合性 vector](../conformance/) を実行します。
5. リファレンス実装を動かすには、 [Python SDK ソースガイド](../../sdk/python/)
   に従います。

schema
validation が証明するのは文書構造だけです。動作上の適合性には、仕様で定める state
machine、ordering、epoch、lease、budget、hierarchy、timestamp、signature、authorization、replay の各ルールへの準拠も必要です。
