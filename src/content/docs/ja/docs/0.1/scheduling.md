---
title: Group を横断するスケジューリング
description:
  MissionWeaveProtocol 0.1 における Group ごとの Worker キュー、全体 Scheduler、
  分離された実行スロット、Checkpoint を用いた安全なプリエンプション、Replay。
sidebar:
  label: スケジューリング
  order: 4
---

:::caution[ドラフト標準 0.1]

これは非規範的な学習ガイドです。
[正式なプロトコルリポジトリ](https://github.com/missionweaveprotocol/missionweaveprotocol)
が引き続き規範となります。

:::

Worker は、各 Group のコンテキストを混在させることなく、複数の Mission
Group に所属できます。Group ごとに個別の Event 受信箱、Cursor、作業キューを保持し、そのうえで 1 つの Worker 管理の Scheduler を使い、これらのキューを横断して適格な WorkItem を選択します。

```text
Group A の Event → Group A のキュー ┐
Group B の Event → Group B のキュー ├→ Worker Scheduler → 分離された実行スロット
Group C の Event → Group C のキュー ┘
```

## 優先度を決める主体

Coordinator は、自身の Mission について要求する緊急度、期限、ビジネスへの影響を提示します。Group を横断する順序は Worker
Scheduler が最終的に決定します。Coordinator は、自身の Mission を無関係な Group より強制的に優先できません。Organization 全体の優先度変更は、ポリシーまたは MissionOwner を通じて行います。

Scheduler は重み付き公平性と飢餓防止を提供しなければなりません。実効的な順序では、次の要素を考慮することが望まれます。

- Organization の優先度クラス
- 期限とキュー待ち時間
- Group ごとの割当量
- リスクと承認ゲート
- 利用可能なリソースと実行スロット

無制限に最優先の作業だけを処理する方式は、多忙または緊急な Group が他のすべての Group を飢餓状態にする可能性があるため、適合しません。

## プライバシーを保つ情報開示

Worker が Work
Offer を受諾したとき、またはスケジュールを大幅に変更したときは、推定開始時間帯、推定完了時刻、確信度、処理能力の状態、計算時刻を公開することが望まれます。他の Group の身元、内容、割り当て、全体キュー内の正確な位置を開示してはなりません。

各実行スロットは、Mission のコンテキスト、認証情報、Checkpoint、ツール予算、副作用キーを他のすべてのスロットから分離します。

## 所有権、リース、安全なプリエンプション

受諾により Ownership
Epoch と開始期限が始まります。作業の開始には、Agent、Session
Epoch、WorkItem、Ownership Epoch、有効期限に紐付けられた Execution
Lease も必要です。

優先度変更は、キュー内の作業を直ちに並べ替えます。実行中の作業を危険な時点で中断することはありません。協調的プリエンプションは、次の永続化された手順に従います。

1. Scheduler がプリエンプションを要求する。
2. Worker が安全で冪等な Checkpoint に到達する。
3. Worker が Checkpoint を記録して一時停止する。
4. 実行スロットを解放する。
5. WorkItem が後で再開できるよう Group キューに戻る。

ブロック時も同じ安全原則に従います。Checkpoint を記録し、阻害要因を発行して処理能力を解放した後、現在の所有権とリースの規則に従って再開または再割り当てします。

## Replay による復旧

Group ごとのキューは、永続的な Group
Event のローカル投影です。再起動した Worker は、スナップショットと順序付き Replay から Cursor とキューを復元します。Event は少なくとも 1 回配信されるため、Worker は Event
ID で重複を排除し、各 Group について永続化された連続する最高 Cursor だけを進めます。

MissionWeaveProtocol が定義するのは Group 内の順序であり、Group を横断する全体順序ではありません。

完全なルールについては、規範となる
[スケジューリング、実行、復旧](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#11-scheduling-execution-and-recovery)
および
[配信と Replay](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#16-delivery-replay-and-acknowledgement)
を参照してください。
