---
title: 核心模型
description:
  構成 MissionWeaveProtocol 0.1 的 Mission、Group、角色、持久記錄和本機投影。
sidebar:
  order: 2
---

:::caution[0.1 草案標準]

這是一份非規範性學習指南。
[權威協定儲存庫](https://github.com/missionweaveprotocol/missionweaveprotocol)
仍是規範性來源。

:::

MissionWeaveProtocol 圍繞邊界明確的 **Mission** 及其臨時 **Group**
組織協作。每個 Mission 恰好擁有一個主 Group，每個主 Group 也恰好屬於一個 Mission。

```text
Organization
├── Agent Registry
├── Group Authority 與持久 Event 儲存區
├── Authorization Service
└── Mission
    └── Group
        ├── MissionOwner
        ├── Coordinator
        ├── Worker Membership
        ├── Conversation 與 Message
        ├── WorkItem 與 Work Contract
        └── 有序 Event、Artifact、Evidence 和 Approval
```

## 角色與職責

| 角色                  | 職責                                                 | 重要邊界                                     |
| --------------------- | ---------------------------------------------------- | -------------------------------------------- |
| Organization          | 治理身份、策略、授權和基礎設施                       | 它是 0.1 中唯一的信任邊界                    |
| MissionOwner          | 確定方向、檢查進度、介入並給出最終核准               | 根 Mission 的 MissionOwner 是人類            |
| Coordinator           | 規劃、分派、監控、整合並提交 Mission                 | 它可被替換，Coordinator Epoch 會使舊實例失效 |
| Worker                | 透過自身佇列和 Scheduler 接收並執行 WorkItem         | 同一個 Agent 可以在多個 Group 中工作         |
| Group Authority       | 對主體進行認證、驗證策略、序列化狀態轉換並追加 Event | 它負責狀態排序，不負責管理 Mission 的語義    |
| Authorization Service | 在完成必要檢查後核發短期、範圍受限的能力令牌         | 具備能力不等於獲得授權                       |

**Agent Card** 承載穩定、由 Organization 簽名的身份和已驗證能力。**Presence
Record** 承載臨時可用性與容量。二者分離，是因為臨時可用性不應改寫受信任的身份。

## 連線協作的記錄

- **Membership** 將 Principal 連線到一個 Group、角色集合、可見範圍和 Membership
  Epoch。
- **Conversation** 包含用於 Group 規劃或某個 WorkItem 的持久 Message。
- **WorkItem** 是可執行的 Mission 工作單元。其 **Work Contract**
  定義目標、交付成果、Evidence、權限、截止時間和預算。
- **Artifact** 是不可變、按內容定址的交付成果。
- **Evidence** 記錄 Artifact 或 WorkItem 如何滿足驗收標準。
- **Event** 是某個 Group 單調歷史中不可變的已接受事實。
- **Cursor** 記錄 Agent 已持久處理的最高連續 Group Event 位置。

:::note[Message 不會隱式變成分派]

Message 可以提供上下文或提出工作。只有經過授權的 WorkItem 狀態轉換和 Worker 接收之後，可執行責任才會開始。

:::

## 權威狀態與本機投影

MissionWeaveProtocol 將共享事實與可重建的 Worker 狀態分離。

**權威狀態**包括 Mission、Membership、WorkItem、ownership epoch 與 lease
epoch、去重回執、Approval 和 Group Event。Group
Authority 對該狀態的變更進行序列化。

**Agent 本機投影**包括 Cursor、各 Group 佇列、checkpoint、寄件匣、收件匣和 Scheduler 狀態。Agent 可以透過持久 Event 重建這些投影。丟失本機資料庫不得改變權威 Mission 狀態。

## 需要牢記的不變條件

- 一個 Mission 擁有一個主 Group 和一套該 Group 內的 Event 順序。
- 對話絕不是執行權限。
- 排他工作透過 ownership epoch 和 lease epoch 的 fencing 防止舊擁有者繼續生效。
- 已接受的 Event 和已提交的 Message 僅可追加。
- Mission 上下文和憑證預設相互隔離。
- WorkItem 和子任務的預算與權限不得超過其上層。
- 根 Mission 只有在人類核准精確的修訂版本和 Artifact 集合後才能完成。
- Agent 發布稽核所需的決策、輸入、Evidence、阻礙因素和結果，而不是私有 chain-of-thought。

完整規則請閱讀規範性
[核心不變條件](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#4-core-invariants)
和
[系統架構](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#5-system-architecture)。
