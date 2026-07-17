---
title: JSON Schema
description: 瀏覽 MissionWeaveProtocol 0.1 的 21 個規範性 JSON Schema。
sidebar:
  label: JSON Schema
  order: 2
---

MissionWeaveProtocol 0.1 定義了 **21 個規範性 JSON Schema Draft
2020-12 檔案**。權威檔案位於協定儲存庫的
[`schemas/` 目錄](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/schemas)。

wire
property 名稱使用 lowerCamelCase。核心物件拒絕未知屬性，已核准的擴充資料只能透過明確的
`extensions` 成員承載。

## Schema 目錄

| Schema                                                                                                                                          | 用途                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [`common.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/common.schema.json)                       | 供其他 schema 使用的共享協定定義                         |
| [`agent-card.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/agent-card.schema.json)               | 穩定、由 Organization 簽名的 Agent 身份和已驗證能力      |
| [`presence-record.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/presence-record.schema.json)     | 臨時 Agent 可用性和容量                                  |
| [`mission.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/mission.schema.json)                     | Mission 目標、ownership、預算和核准生命週期              |
| [`group.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/group.schema.json)                         | 屬於一個 Mission 的臨時協作 Group                        |
| [`group-snapshot.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/group-snapshot.schema.json)       | Group 歷史的簽名歸檔快照                                 |
| [`membership.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/membership.schema.json)               | 將 Principal 連線到 Group 的範圍受限授權                 |
| [`conversation.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/conversation.schema.json)           | 可稽核的 Group 或 WorkItem 對話執行緒                    |
| [`message.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/message.schema.json)                     | 不授予執行權限的已提交對話上下文                         |
| [`work-contract.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/work-contract.schema.json)         | 工作目標、交付成果、標準、輸入、權限、截止時間和重試預算 |
| [`work-item.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/work-item.schema.json)                 | 明確的 Mission 工作單元，包括生命週期和 ownership        |
| [`artifact.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/artifact.schema.json)                   | 不可變、按內容定址的交付成果 manifest                    |
| [`evidence.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/evidence.schema.json)                   | 依據驗收標準評估的已記錄事實                             |
| [`approval.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/approval.schema.json)                   | 對精確 Mission 結果的簽名核准                            |
| [`context-package.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/context-package.schema.json)     | 帶簽名、範圍受限且含溯源資訊的 Mission 上下文            |
| [`command.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/command.schema.json)                     | 請求一次結構化狀態轉換的簽名請求                         |
| [`event.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/event.schema.json)                         | Group 有序歷史中不可變的已接受事實                       |
| [`error.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/error.schema.json)                         | 結構化協定錯誤文件                                       |
| [`lease.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/lease.schema.json)                         | 可續期、受 epoch fencing 的 execution lease              |
| [`extension-profile.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/extension-profile.schema.json) | 受治理的擴充定義和相容性 metadata                        |
| [`websocket-frame.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/websocket-frame.schema.json)     | 規範化 WebSocket frame union                             |

權威
[schema README](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/README.md)
記錄了共享驗證規則。

## 驗證協定儲存庫

在 `missionweaveprotocol` 原始碼工作副本中執行：

```bash
python -m pip install -r requirements-validation.txt
python scripts/check_repository_policy.py
python scripts/validate_protocol.py
```

validator 必須先按 `$id`
註冊每個 schema，再解析引用。透過 schema 驗證只證明結構符合性，不代表滿足[協定規格](../specification/)中的行為要求。

[符合性 manifest](../conformance/)為這些 schema 提供預期有效和預期無效的實例。
