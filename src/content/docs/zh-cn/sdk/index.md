---
title: SDK
description: 选择官方 MissionWeaveProtocol SDK，并了解其当前符合性范围。
sidebar:
  label: 概览
  order: 1
---

MissionWeaveProtocol 提供完整的 Python 参考实现和五种官方协议 SDK。各 SDK 独立版本化，并固定其实现所对应的准确协议 commit 和 Artifact 摘要。下列数量对应协议 commit
[`6f10987`](https://github.com/missionweaveprotocol/missionweaveprotocol/commit/6f10987627d62fb296e3490ceceb5539b1e94b70)。

## 能力与状态矩阵

| SDK                                                                  | 当前定位     | 协议绑定 | Schema 与测试向量符合性 | 完整行为运行时 |
| -------------------------------------------------------------------- | ------------ | -------- | ----------------------- | -------------- |
| [Python](https://github.com/missionweaveprotocol/python-sdk)         | 完整参考实现 | 是       | 52/52 个向量            | 是             |
| [Go](https://github.com/missionweaveprotocol/go-sdk)                 | 官方协议 SDK | 是       | 52/52 个向量            | 否             |
| [TypeScript](https://github.com/missionweaveprotocol/typescript-sdk) | 官方协议 SDK | 是       | 52/52 个向量            | 否             |
| [Java](https://github.com/missionweaveprotocol/java-sdk)             | 官方协议 SDK | 是       | 52/52 个向量            | 否             |
| [Rust](https://github.com/missionweaveprotocol/rust-sdk)             | 官方协议 SDK | 是       | 52/52 个向量            | 否             |
| [C++](https://github.com/missionweaveprotocol/cpp-sdk)               | 官方协议 SDK | 是       | 52/52 个向量            | 否             |

Schema 与测试向量符合性涵盖严格 JSON 处理、对固定的 21 个 Draft 2020-12
Schema 进行离线验证、规范 JSON 与内容 ID、Ed25519 签名、Frame 验证，以及固定的 52 个符合性测试向量。仅通过这些测试并不能证明调度、持久化、恢复、传输或其他运行时行为的符合性。

## 选择 SDK

需要完整参考运行时时，请使用
[Python SDK 指南](./python/)。它包含 Core、Agent 运行时、Worker
Scheduler、Group 网关、存储适配器和可执行 POC。

需要原生协议绑定、验证、规范化、签名和 Frame
Codec 时，请使用 Go、TypeScript、Java、Rust 或 C++ 仓库。安装和验证命令由各仓库 README 维护。协议规范和符合性 Artifact 始终是规范性依据。
