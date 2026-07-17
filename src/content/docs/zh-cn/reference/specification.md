---
title: MissionWeaveProtocol 0.1
description: 阅读规范性的 MissionWeaveProtocol 协议说明和协议术语表。
sidebar:
  label: 规范
  order: 1
banner:
  content:
    MissionWeaveProtocol 0.1
    是<strong>草案标准</strong>。规范性要求请以权威仓库为准。
---

MissionWeaveProtocol
0.1 定义了同一 Organization 内自主 Agent 的 Group 协作。它涵盖身份、Mission
Group、明确的 WorkItem、对等 Message、调度、权限、持久排序、replay、验证和人类批准。

## 规范性来源

本网站用于解释并链接 MissionWeaveProtocol，但不是协议的规范性来源。
[`missionweaveprotocol` 仓库](https://github.com/missionweaveprotocol/missionweaveprotocol)
拥有以下权威产物：

- [MissionWeaveProtocol 0.1 协议说明](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md)
- [协议术语表](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/CONTEXT.md)
- [规范性 JSON Schema](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/schemas)
- [符合性清单和测试向量](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/conformance)

本指南与规范性产物存在差异时，以协议仓库中的产物为准。

## 版本与标识符

当前协议版本为 `0.1`，wire namespace（线协议命名空间）为
`missionweaveprotocol`：

- 协议标识符使用 `urn:missionweaveprotocol:*`；
- 内置扩展类型使用 `ext.missionweaveprotocol.*`；
- schema 标识符使用 `https://missionweaveprotocol.dev/schemas/0.1/`。

协议发布版本和 SDK 发布版本独立版本化。实现应声明兼容性，并固定到已发布的协议版本或准确的 commit，而不是依据相同版本号推断兼容性。

## 阅读顺序

1. 先阅读
   [协议术语表](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/CONTEXT.md)
   了解共享词汇。
2. 阅读
   [规范性协议说明](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md)
   了解要求和生命周期规则。
3. 使用 [JSON Schema 参考](../schemas/)了解文档结构。
4. 针对实现运行[符合性测试向量](../conformance/)。
5. 按照 [Python SDK 源码指南](../../sdk/python/)操作参考实现。

schema 验证只能证明文档结构。行为符合性还要求满足协议说明中的状态机、排序、epoch、lease、预算、时间戳、签名、授权、层级和 replay 规则。
