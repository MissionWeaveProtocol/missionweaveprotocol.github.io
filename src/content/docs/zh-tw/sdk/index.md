---
title: SDK
description: 選擇官方 MissionWeaveProtocol SDK，並了解其目前的符合性範圍。
sidebar:
  label: 總覽
  order: 1
---

MissionWeaveProtocol 提供完整的 Python 參考實作和五種官方協定 SDK。各 SDK 獨立版本化，並固定其實作所對應的精確協定 commit 和 Artifact 摘要。下列數量對應協定 commit
[`6f10987`](https://github.com/missionweaveprotocol/missionweaveprotocol/commit/6f10987627d62fb296e3490ceceb5539b1e94b70)。

## 能力與狀態矩陣

| SDK                                                                  | 目前定位     | 協定綁定 | Schema 與測試向量符合性 | 完整行為 runtime |
| -------------------------------------------------------------------- | ------------ | -------- | ----------------------- | ---------------- |
| [Python](https://github.com/missionweaveprotocol/python-sdk)         | 完整參考實作 | 是       | 52/52 個向量            | 是               |
| [Go](https://github.com/missionweaveprotocol/go-sdk)                 | 官方協定 SDK | 是       | 52/52 個向量            | 否               |
| [TypeScript](https://github.com/missionweaveprotocol/typescript-sdk) | 官方協定 SDK | 是       | 52/52 個向量            | 否               |
| [Java](https://github.com/missionweaveprotocol/java-sdk)             | 官方協定 SDK | 是       | 52/52 個向量            | 否               |
| [Rust](https://github.com/missionweaveprotocol/rust-sdk)             | 官方協定 SDK | 是       | 52/52 個向量            | 否               |
| [C++](https://github.com/missionweaveprotocol/cpp-sdk)               | 官方協定 SDK | 是       | 52/52 個向量            | 否               |

Schema 與測試向量符合性涵蓋嚴格 JSON 處理、對固定的 21 個 Draft 2020-12
Schema 進行離線驗證、規範 JSON 與內容 ID、Ed25519 簽章、Frame 驗證，以及固定的 52 個符合性測試向量。僅通過這些測試並不能證明排程、持久化、復原、傳輸或其他 runtime 行為的符合性。

## 選擇 SDK

需要完整參考 runtime 時，請使用 [Python SDK 指南](./python/)。它包含 Core、Agent
runtime、Worker Scheduler、Group gateway、儲存轉接器和可執行 POC。

需要原生協定綁定、驗證、規範化、簽章和 Frame
Codec 時，請使用 Go、TypeScript、Java、Rust 或 C++ 儲存庫。安裝和驗證命令由各儲存庫 README 維護。協定規格和符合性 Artifact 始終是規範性依據。
