---
title: Group を横断するスケジューリング
description:
  MissionWeaveProtocol 0.1 における Group ごとの Worker queue、global
  Scheduler、 分離された execution slot、checkpoint-safe preemption、replay。
sidebar:
  label: スケジューリング
  order: 4
---

:::caution[ドラフト標準 0.1]

これは非規範的な学習ガイドです。
[正式なプロトコルリポジトリ](https://github.com/missionweaveprotocol/missionweaveprotocol)
が引き続き規範となります。

:::

Worker は、各 Group の context を混在させることなく、複数の Mission
Group に所属できます。Group ごとに個別の Event inbox、Cursor、Work
queue を保持し、そのうえで 1 つの Worker-owned
Scheduler を使い、これらの queue を横断して適格な WorkItem を選択します。

```text
Group A の Event → Group A のキュー ┐
Group B の Event → Group B のキュー ├→ Worker Scheduler → 分離された実行スロット
Group C の Event → Group C のキュー ┘
```

## priority を決める主体

Coordinator は、自身の Mission について要求する urgency、deadline、business
impact を提示します。Group を横断する ordering は Worker
Scheduler が最終的に決定します。Coordinator は、自身の Mission を無関係な Group より強制的に優先できません。Organization 全体の priority
change は、policy または MissionOwner を通じて行います。

Scheduler は weighted
fairness と starvation 防止を提供しなければなりません。実効的な順序では、次の要素を考慮する必要があります。

- Organization の priority class
- deadline と queue aging
- Group ごとの quota
- risk と approval gate
- 利用可能な resource と execution slot

無制限の highest-priority-first
scheduling は、busy または urgent な Group が他のすべての Group を飢餓状態にする可能性があるため、適合しません。

## privacy を保つ情報開示

Worker が offer を受諾したとき、または schedule を大幅に変更したときは、推定開始時間帯、推定完了時刻、confidence、capacity
status、計算時刻を公開する必要があります。他の Group の identity、content、assignment、正確な global
queue position を開示してはなりません。

各 execution slot は、Mission context、credential、checkpoint、tool
budget、side-effect key を他のすべての slot から分離します。

## ownership、lease、安全な preemption

acceptance により Ownership Epoch と start-by
deadline が始まります。作業の開始には、Agent、Session Epoch、WorkItem、Ownership
Epoch、有効期限に bind された Execution Lease も必要です。

priority change は、queued work を直ちに並べ替えます。active work を unsafe
point で中断することはありません。cooperative preemption は、次の durable
sequence に従います。

1. Scheduler が preemption を request する。
2. Worker が safe で idempotent な checkpoint に到達する。
3. Worker が checkpoint を記録して pause する。
4. execution slot を release する。
5. WorkItem が後で resume できるよう Group queue に戻る。

blocking も同じ安全原則に従います。checkpoint を記録し、blocker を emit して capacity を release した後、現在の ownership
rule と lease rule に従って resume または reassign します。

## replay による recovery

Group ごとの queue は、durable Group Event の local
projection です。再起動した Worker は、snapshot と ordered
replay から Cursor と queue を復元します。Event delivery は at least
once であるため、Worker は Event
ID で重複を排除し、各 Group について durable かつ連続する最高 Cursor だけを進めます。

MissionWeaveProtocol が定義するのは Group 内の ordering であり、Group を横断する global
order ではありません。

完全なルールについては、規範となる
[scheduling, execution, and recovery](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#11-scheduling-execution-and-recovery)
および
[delivery and replay](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#16-delivery-replay-and-acknowledgement)
を参照してください。
