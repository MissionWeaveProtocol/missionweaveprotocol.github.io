---
title: 跨 Group 排程
description:
  MissionWeaveProtocol 0.1 中各 Group 的 Worker 佇列、全域排程、隔離的執行槽位、
  checkpoint 安全搶佔和 replay。
sidebar:
  label: 排程
  order: 4
---

:::caution[0.1 草案標準]

這是一份非規範性學習指南。
[權威協定儲存庫](https://github.com/missionweaveprotocol/missionweaveprotocol)
仍是規範性來源。

:::

Worker 可以屬於多個 Mission
Group，而無需合併其上下文。它為每個 Group 維護獨立的 Event 收件匣、Cursor 和工作佇列，再由一個 Worker 自有的 Scheduler 從這些佇列中選擇符合條件的 WorkItem。

```text
Group A 的 Event → Group A 佇列 ┐
Group B 的 Event → Group B 佇列 ├→ Worker Scheduler → 隔離的執行槽位
Group C 的 Event → Group C 佇列 ┘
```

## 誰控制優先順序

Coordinator 為其 Mission 提供請求的緊急程度、截止時間和業務影響。Worker
Scheduler 對跨 Group 順序擁有最終控制權。Coordinator 不能強制自己的 Mission 排在無關 Group 之前；Organization 層級的優先順序變更必須透過策略或 MissionOwner 實施。

Scheduler 必須提供加權公平和防飢餓機制。其有效排序應考慮：

- Organization 優先順序類別；
- 截止時間和佇列等待時間；
- 各 Group 配額；
- 風險和核准關卡；以及
- 可用資源和執行槽位。

無限制地始終優先處理最高優先順序不符合協定要求，因為繁忙或緊急的 Group 可能導致其他所有 Group 永遠無法獲得執行機會。

## 保護隱私的資訊披露

Worker 接收邀約或實質性地調整排程時，應發布預估開始時間視窗、預估完成時間、可信度、容量狀態和計算時間。它不得披露其他 Group 的身份、內容、分派或精確的全域佇列位置。

每個執行槽位都將 Mission 上下文、憑證、checkpoint、工具預算和 side-effect
key 與其他所有槽位隔離。

## Ownership、lease 與安全搶佔

接收會開始一個 Ownership
Epoch 和最遲啟動期限。開始工作還需要一個繫結到 Agent、Session
Epoch、WorkItem、Ownership Epoch 和到期時間的 Execution Lease。

優先順序變更會立即重新排序 queued 工作。active 工作不會在不安全的位置被中斷。協作式搶佔（preemption）遵循持久化序列：

1. Scheduler 請求搶佔；
2. Worker 到達安全、冪等的 checkpoint；
3. Worker 記錄該 checkpoint 並暫停；
4. 執行槽位被釋放；以及
5. WorkItem 返回其 Group 佇列，等待後續復原。

blocking 遵循同樣的安全原則：執行 checkpoint、發出阻礙原因、釋放容量，再依據目前 ownership 和 lease 規則復原或重新分派。

## 透過 replay 復原

各 Group 佇列是持久 Group
Event 的本機投影。重新啟動後的 Worker 從快照和有序 replay 中復原 Cursor 與佇列。Event 交付為 at
least once，因此 Worker 按 Event
ID 去重，並且只推進每個 Group 中已持久化的最高連續 Cursor。

MissionWeaveProtocol 只定義 Group 內的順序，不定義跨 Group 的全域順序。

完整規則請閱讀規範性
[排程、執行與復原](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#11-scheduling-execution-and-recovery)
和
[交付與 replay](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#16-delivery-replay-and-acknowledgement)
章節。
