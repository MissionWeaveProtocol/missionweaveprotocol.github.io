---
title: SDK
description:
  公式 MissionWeaveProtocol SDK を選択し、現在の適合性範囲を確認します。
sidebar:
  label: 概要
  order: 1
---

MissionWeaveProtocol は、完全な Python リファレンス実装と 5 つの公式プロトコル SDK を提供します。各 SDK は独立してバージョン管理され、実装対象となる正確なプロトコルコミットと Artifact ダイジェストを固定します。以下の件数はプロトコルコミット
[`6f10987`](https://github.com/missionweaveprotocol/missionweaveprotocol/commit/6f10987627d62fb296e3490ceceb5539b1e94b70)
に対応します。

## 機能とステータス

| SDK                                                                  | 現在の範囲             | プロトコルバインディング | Schema・ベクトル適合性 | 完全な振る舞いランタイム |
| -------------------------------------------------------------------- | ---------------------- | ------------------------ | ---------------------- | ------------------------ |
| [Python](https://github.com/missionweaveprotocol/python-sdk)         | 完全なリファレンス実装 | 対応                     | 52/52 ベクトル         | 対応                     |
| [Go](https://github.com/missionweaveprotocol/go-sdk)                 | 公式プロトコル SDK     | 対応                     | 52/52 ベクトル         | 非対応                   |
| [TypeScript](https://github.com/missionweaveprotocol/typescript-sdk) | 公式プロトコル SDK     | 対応                     | 52/52 ベクトル         | 非対応                   |
| [Java](https://github.com/missionweaveprotocol/java-sdk)             | 公式プロトコル SDK     | 対応                     | 52/52 ベクトル         | 非対応                   |
| [Rust](https://github.com/missionweaveprotocol/rust-sdk)             | 公式プロトコル SDK     | 対応                     | 52/52 ベクトル         | 非対応                   |
| [C++](https://github.com/missionweaveprotocol/cpp-sdk)               | 公式プロトコル SDK     | 対応                     | 52/52 ベクトル         | 非対応                   |

Schema・ベクトル適合性は、厳密な JSON 処理、固定された 21 個の Draft 2020-12
Schema に対するオフライン検証、正規 JSON とコンテンツ ID、Ed25519 署名、Frame 検証、および固定された 52 個の適合性ベクトルを対象とします。これだけでは、スケジューリング、永続化、リカバリー、トランスポート、その他のランタイム動作の適合性は証明されません。

## SDK を選ぶ

Core、Agent ランタイム、Worker
Scheduler、Group ゲートウェイ、ストレージアダプター、実行可能な POC を含む完全なリファレンスランタイムが必要な場合は、
[Python SDK ガイド](./python/)を使用してください。

ネイティブなプロトコルバインディング、検証、正規化、署名、Frame
Codec が必要な場合は、Go、TypeScript、Java、Rust、C++ の各リポジトリを使用してください。インストールと検証のコマンドは各リポジトリの README で管理されています。プロトコル仕様と適合性 Artifact が規範文書であることに変わりはありません。
