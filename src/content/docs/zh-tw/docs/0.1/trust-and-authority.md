---
title: 信任與權限
description:
  MissionWeaveProtocol 如何分離身份、對話、分派、執行、排序和最終核准權限。
sidebar:
  order: 5
---

:::caution[0.1 草案標準]

這是一份非規範性學習指南。
[權威協定儲存庫](https://github.com/missionweaveprotocol/missionweaveprotocol)
仍是規範性來源。

:::

MissionWeaveProtocol
0.1 在一個受信任的 Organization 內執行。Organization 是 Agent 身份、策略、授權、持久 Group 排序和人類課責機制的治理根。

## 權限經過有意拆分

| 事項                                 | 權限主體                                   |
| ------------------------------------ | ------------------------------------------ |
| 穩定身份和已驗證能力                 | 由 Organization 控制的 Agent Registry      |
| Mission 方向和最終核准               | MissionOwner                               |
| 規劃、分派、整合和提交               | 目前 Coordinator Epoch                     |
| 跨 Group 執行順序                    | Worker 自有的 Scheduler                    |
| 狀態轉換驗證和各 Group 的 Event 順序 | Group Authority                            |
| 工具、資料、資源和 side-effect 權限  | Authorization Service 和 Organization 策略 |

每個 Group 都有一個邏輯 Group
Authority。實作可以在內部複製它，但共識、領導者選舉和副本拓撲不會作為協定語義暴露。

## 身份不等於線上狀態

Agent
Card 是穩定、版本化且由 Organization 簽名的身份。它包含公鑰、endpoint、支援的協定版本、已驗證能力和最大並行數，不包含可重複使用憑證或工具權限。

Presence
Record 是臨時記錄，可以報告可用性、空閒執行槽位、能力可用性、預估回應延遲和心跳時間。過期的 Presence
Record 絕不代表接受分派或續期 lease。

:::note[能力不等於授權]

能力表明 Agent 已被驗證能夠執行什麼。授權決定該 Agent 在目前 Mission 策略、ownership、lease、approval 和預算約束下，是否可以對特定資源執行特定操作。

:::

## Session 與 fencing

WebSocket 握手使用已向 Organization 註冊的 Ed25519 金鑰和新的質詢。成功握手會核發短期 session
token 和新的 Session Epoch。核發 epoch `n + 1` 後，該 Agent 身份下所有 epoch 為
`n` 或更低的 runtime 都會透過 fencing 失效。

其他 epoch 會進一步收窄權限：

- Membership Epoch 透過 fencing 使某個 Group Membership 的舊版本失效；
- Coordinator Epoch 透過 fencing 使被替換的 Coordinator 及其授權失效；
- Ownership Epoch 透過 fencing 使排他工作的前擁有者失效；以及
- Execution Lease ID 透過 fencing 使已過期或被撤銷的執行時段失效。

持久 Command 和 Artifact
manifest 分別對規範化 JSON 簽名。已接受的 Event 由 Group Authority 簽名。

## 從上下文到獲准的 side effect

```text
Message or Work Proposal
        ↓ explicit authorization
WorkItem and Work Contract
        ↓ Worker acceptance
Ownership Epoch
        ↓ current session, policy, budget, and approval checks
Execution Lease and scoped capability token
        ↓
Permitted operation
```

Message、Agent Card、Context Package、Artifact 和 Group
Event 不得攜帶 secret 或可重複使用憑證。高風險操作可能需要簽署的人類 Execution
Approval，Authorization Service 才會核發能力令牌。

在 Coordinator 驗證結果後，根 Mission 仍需要獨立的最終人類 Approval。Execution
Approval 允許執行邊界明確的高風險操作；最終 Approval 接受已完成的 Mission 修訂版本和 Artifact 集合。

完整規則請閱讀規範性
[身份與 session](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#6-identity-agent-registry-and-sessions)、
[Membership 與可見性](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#8-membership-visibility-and-attention)
和
[授權與預算](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#12-authorization-budgets-and-side-effects)
章節。
