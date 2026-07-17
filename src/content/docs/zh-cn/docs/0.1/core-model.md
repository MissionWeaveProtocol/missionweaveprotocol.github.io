---
title: 核心模型
description:
  构成 MissionWeaveProtocol 0.1 的 Mission、Group、角色、持久记录和本地投影。
sidebar:
  order: 2
---

:::caution[0.1 草案标准]

这是一份非规范性学习指南。
[权威协议仓库](https://github.com/missionweaveprotocol/missionweaveprotocol)
仍是规范性来源。

:::

MissionWeaveProtocol 围绕边界明确的 **Mission** 及其临时 **Group**
组织协作。每个 Mission 恰好拥有一个主 Group，每个主 Group 也恰好属于一个 Mission。

```text
Organization
├── Agent Registry
├── Group Authority and durable Event store
├── Authorization Service
└── Mission
    └── Group
        ├── MissionOwner
        ├── Coordinator
        ├── Worker Memberships
        ├── Conversations and Messages
        ├── WorkItems and Work Contracts
        └── ordered Events, Artifacts, Evidence, and Approvals
```

## 角色与职责

| 角色                  | 职责                                                 | 重要边界                                     |
| --------------------- | ---------------------------------------------------- | -------------------------------------------- |
| Organization          | 治理身份、策略、授权和基础设施                       | 它是 0.1 中唯一的信任边界                    |
| MissionOwner          | 确定方向、检查进度、介入并给出最终批准               | 根 Mission 的 MissionOwner 是人类            |
| Coordinator           | 规划、分派、监控、集成并提交 Mission                 | 它可被替换，Coordinator Epoch 会使旧实例失效 |
| Worker                | 通过自身队列和 Scheduler 接收并执行 WorkItem         | 同一个 Agent 可以在多个 Group 中工作         |
| Group Authority       | 对主体进行认证、验证策略、串行化状态转换并追加 Event | 它负责状态排序，不负责管理 Mission 的语义    |
| Authorization Service | 在完成必要检查后签发短期、范围受限的能力令牌         | 具备能力不等于获得授权                       |

**Agent Card** 承载稳定、由 Organization 签名的身份和已验证能力。**Presence
Record** 承载临时可用性与容量。二者分离，是因为临时可用性不应改写受信任的身份。

## 连接协作的记录

- **Membership** 将 Principal 连接到一个 Group、角色集合、可见范围和 Membership
  Epoch。
- **Conversation** 包含用于 Group 规划或某个 WorkItem 的持久 Message。
- **WorkItem** 是可执行的 Mission 工作单元。其 **Work Contract**
  定义目标、交付物、Evidence、权限、截止时间和预算。
- **Artifact** 是不可变、按内容寻址的交付物。
- **Evidence** 记录 Artifact 或 WorkItem 如何满足验收标准。
- **Event** 是某个 Group 单调历史中不可变的已接受事实。
- **Cursor** 记录 Agent 已持久处理的最高连续 Group Event 位置。

:::note[Message 不会隐式变成分派]

Message 可以提供上下文或提出工作。只有经过授权的 WorkItem 状态转换和 Worker 接收之后，可执行责任才会开始。

:::

## 权威状态与本地投影

MissionWeaveProtocol 将共享事实与可重建的 Worker 状态分离。

**权威状态**包括 Mission、Membership、WorkItem、ownership epoch 与 lease
epoch、去重回执、Approval 和 Group Event。Group
Authority 对该状态的变更进行串行化。

**Agent 本地投影**包括 Cursor、各 Group 队列、checkpoint、发件箱、收件箱和 Scheduler 状态。Agent 可以通过持久 Event 重建这些投影。丢失本地数据库不得改变权威 Mission 状态。

## 需要牢记的不变量

- 一个 Mission 拥有一个主 Group 和一套该 Group 内的 Event 顺序。
- 对话绝不是执行权限。
- 排他工作通过 ownership epoch 和 lease epoch 的 fencing 防止旧所有者继续生效。
- 已接受的 Event 和已提交的 Message 仅可追加。
- Mission 上下文和凭据默认相互隔离。
- WorkItem 和子 Mission 的预算与权限不得超过其父级。
- 根 Mission 只有在人类批准准确的修订版本和 Artifact 集合后才能完成。
- Agent 发布审计所需的决策、输入、Evidence、阻塞因素和结果，而不是私有 chain-of-thought。

完整规则请阅读规范性
[核心不变量](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#4-core-invariants)
和
[系统架构](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#5-system-architecture)。
