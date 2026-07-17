---
title: JSON Schema
description: 浏览 MissionWeaveProtocol 0.1 的 21 个规范性 JSON Schema。
sidebar:
  label: JSON Schema
  order: 2
---

MissionWeaveProtocol 0.1 定义了 **21 个规范性 JSON Schema Draft
2020-12 文件**。权威文件位于协议仓库的
[`schemas/` 目录](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/schemas)。

线协议属性名使用 lowerCamelCase。核心对象拒绝未知属性，获批的扩展数据只能通过明确的
`extensions` 成员承载。

## Schema 目录

| Schema                                                                                                                                          | 用途                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [`common.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/common.schema.json)                       | 供其他 schema 使用的共享协议定义                       |
| [`agent-card.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/agent-card.schema.json)               | 稳定、由 Organization 签名的 Agent 身份和已验证能力    |
| [`presence-record.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/presence-record.schema.json)     | 临时 Agent 可用性和容量                                |
| [`mission.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/mission.schema.json)                     | Mission 目标、ownership、预算和批准生命周期            |
| [`group.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/group.schema.json)                         | 属于一个 Mission 的临时协作 Group                      |
| [`group-snapshot.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/group-snapshot.schema.json)       | Group 历史的签名归档快照                               |
| [`membership.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/membership.schema.json)               | 将 Principal 连接到 Group 的范围受限授权               |
| [`conversation.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/conversation.schema.json)           | 可审计的 Group 或 WorkItem 对话线程                    |
| [`message.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/message.schema.json)                     | 不授予执行权限的已提交对话上下文                       |
| [`work-contract.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/work-contract.schema.json)         | 工作目标、交付物、标准、输入、权限、截止时间和重试预算 |
| [`work-item.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/work-item.schema.json)                 | 明确的 Mission 工作单元，包括生命周期和 ownership      |
| [`artifact.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/artifact.schema.json)                   | 不可变、按内容寻址的交付物 manifest                    |
| [`evidence.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/evidence.schema.json)                   | 依据验收标准评估的已记录事实                           |
| [`approval.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/approval.schema.json)                   | 对准确 Mission 结果的签名批准                          |
| [`context-package.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/context-package.schema.json)     | 带签名、范围受限且含溯源信息的 Mission 上下文          |
| [`command.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/command.schema.json)                     | 请求一次结构化状态转换的签名请求                       |
| [`event.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/event.schema.json)                         | Group 有序历史中不可变的已接受事实                     |
| [`error.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/error.schema.json)                         | 结构化协议错误文档                                     |
| [`lease.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/lease.schema.json)                         | 可续期、受 epoch fencing 的 execution lease            |
| [`extension-profile.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/extension-profile.schema.json) | 受治理的扩展定义和兼容性 metadata                      |
| [`websocket-frame.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/websocket-frame.schema.json)     | 规范化 WebSocket frame union                           |

权威
[schema README](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/README.md)
记录了共享验证规则。

## 验证协议仓库

在 `missionweaveprotocol` 源码检出目录中运行：

```bash
python -m pip install -r requirements-validation.txt
python scripts/check_repository_policy.py
python scripts/validate_protocol.py
```

validator 必须先按 `$id`
注册每个 schema，再解析引用。通过 schema 验证只证明结构符合性，不代表满足[协议说明](../specification/)中的行为要求。

[符合性 manifest](../conformance/)为这些 schema 提供预期有效和预期无效的实例。
