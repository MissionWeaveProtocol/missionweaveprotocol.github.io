---
title: MissionWeaveProtocol 0.1
description: 閱讀規範性的 MissionWeaveProtocol 協定規格和協定術語表。
sidebar:
  label: 規範
  order: 1
banner:
  content:
    MissionWeaveProtocol 0.1
    是<strong>草案標準</strong>。規範性要求請以權威儲存庫為準。
---

MissionWeaveProtocol
0.1 定義了同一 Organization 內自主 Agent 的 Group 協作。它涵蓋身份、Mission
Group、明確的 WorkItem、對等 Message、排程、權限、持久排序、replay、驗證和人類核准。

## 規範性來源

本網站用於解釋並連結 MissionWeaveProtocol，但不是協定的規範性來源。
[`missionweaveprotocol` 儲存庫](https://github.com/missionweaveprotocol/missionweaveprotocol)
擁有以下權威產出物：

- [MissionWeaveProtocol 0.1 協定規格](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md)
- [協定術語表](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/CONTEXT.md)
- [規範性 JSON Schema](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/schemas)
- [符合性清單和測試向量](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/conformance)
- [Signed Document 密碼學清單和測試向量](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/cryptography)

本指南與規範性產出物存在差異時，以協定儲存庫中的產出物為準。

## 版本與識別碼

目前協定版本為 `0.1`，wire namespace（線路命名空間）為 `missionweaveprotocol`：

- 協定識別碼使用 `urn:missionweaveprotocol:*`；
- 內建擴充類型使用 `ext.missionweaveprotocol.*`；
- schema 識別碼使用 `https://missionweaveprotocol.dev/schemas/0.1/`。

協定發布版本和 SDK 發布版本獨立版本化。實作應宣告相容性，並固定到已發布的協定版本或精確的 commit，而不是依據相同版本號推斷相容性。

## 閱讀順序

1. 先閱讀
   [協定術語表](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/CONTEXT.md)
   了解共享詞彙。
2. 閱讀
   [規範性協定規格](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md)
   了解要求和生命週期規則。
3. 使用 [JSON Schema 參考](../schemas/)了解文件結構。
4. 針對實作執行[符合性測試向量](../conformance/)。
5. 按照 [Python SDK 原始碼指南](../../sdk/python/)操作參考實作。

schema 驗證只能證明文件結構。行為符合性還要求滿足協定規格中的狀態機、排序、epoch、lease、預算、時間戳記、簽名、授權、層級和 replay 規則。
