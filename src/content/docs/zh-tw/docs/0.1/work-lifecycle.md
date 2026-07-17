---
title: 工作生命週期
description:
  MissionWeaveProtocol
  如何從對話和工作提議推進到已接收、已驗證並經人類核准的結果。
sidebar:
  order: 3
---

:::caution[0.1 草案標準]

這是一份非規範性學習指南。
[權威協定儲存庫](https://github.com/missionweaveprotocol/missionweaveprotocol)
仍是規範性來源。

:::

MissionWeaveProtocol 讓對話式協作保持靈活，同時明確可執行責任。任何 Group 成員都可以討論上下文、請求幫助或提出工作。只有經過授權的 WorkItem 狀態轉換才能讓提議成為義務。

## 從討論到承諾

1. **討論。** Agent 在 Group 或 WorkItem Conversation 中交換完整的 Message。
2. **提議。** 任何 Group 成員都可以提交 Work
   Proposal。此時還不存在可執行的 WorkItem。
3. **授權。** 目前 Coordinator、MissionOwner 的緊急干預，或持有有效 scoped
   Delegation Grant 的 Agent 建立 WorkItem。
4. **發出邀約。**
   Coordinator 或獲得範圍授權的受委託者向符合條件的 Worker 發出 WorkItem 邀約，並記錄選擇依據。
5. **接收。** Worker 執行允入控制。有效接收會開始新的 Ownership
   Epoch，並將 WorkItem 放入該 Worker 對應的 Group 佇列。

:::note[接收代表排程承諾]

接收邀約不代表立即執行。Worker
Scheduler 對跨 Group 順序擁有最終控制權，並在容量、相依項目、策略和授權均允許時啟動 WorkItem。

:::

## Work Contract

每個 WorkItem 都帶有版本化、機器可讀的 Work Contract，其中記錄：

- 目標、交付成果和驗收標準；
- 所需 Evidence，以及輸入或相依項目引用；
- 允許使用的工具、資料、資源和操作；
- 所需能力識別碼及其版本；
- 截止時間、請求的緊急程度和業務影響；
- 財務、token、工具呼叫、計算、實際用時和 side-effect 預算；
- 重試次數、退避、截止時間和成本策略；以及
- 風險分類和所有執行前核准關卡。

關鍵歧義必須在接收前解決。對 Work Contract 的實質性修訂需要 Worker 重新接收。

## 常見的成功路徑

```text
Work Proposal
    ↓ authorize
open WorkItem
    ↓ offer
offered
    ↓ Worker accepts
queued
    ↓ valid ownership, approval gates, and Execution Lease
active
    ↓ Worker submits Artifacts and Evidence
submitted
    ↓ Coordinator accepts the result
verified
```

執行中的工作可以 checkpoint 回 `queued`，攜帶持久 checkpoint 進入
`blocked`，帶著 Evidence 失敗，或被取消。處於 blocked 狀態的 WorkItem 會釋放其執行槽位，之後返回佇列，或在 ownership 過期後重新獲得邀約。

## 先提供 Evidence，再核准

Worker 的宣告不足以證明完成。提交內容必須包含對應到驗收標準的 Artifact 和 Evidence。Coordinator 評審應驗證 Artifact 完整性，在可用時執行確定性檢查，為定性標準請求 reviewer
Agent 提供 Evidence，並保留結果。

所有必需的 WorkItem 均驗證完成後，Coordinator 提交特定 Mission 修訂版本和 Artifact 集合。MissionOwner 隨後簽署最終 Approval 或請求變更。變更請求會重新開啟同一個 Mission，而不會刪除之前的提交。

完整狀態轉換和權限規則請閱讀規範性
[WorkItem 狀態機](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#102-workitem-state-machine)
和
[基於 Evidence 的評審](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#132-evidence-based-review)。
