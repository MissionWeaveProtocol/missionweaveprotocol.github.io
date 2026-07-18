---
title: 信任与权限
description:
  MissionWeaveProtocol 如何分离身份、对话、分派、执行、排序和最终批准权限。
sidebar:
  order: 5
---

:::caution[0.1 草案标准]

这是一份非规范性学习指南。
[权威协议仓库](https://github.com/missionweaveprotocol/missionweaveprotocol)
仍是规范性来源。

:::

MissionWeaveProtocol
0.1 在一个受信任的 Organization 内运行。Organization 是 Agent 身份、策略、授权、持久 Group 排序和人类问责机制的治理根。

## 权限经过有意拆分

| 事项                                 | 权限主体                                   |
| ------------------------------------ | ------------------------------------------ |
| 稳定身份和已验证能力                 | 由 Organization 控制的 Agent Registry      |
| Mission 方向和最终批准               | MissionOwner                               |
| 规划、分派、集成和提交               | 当前 Coordinator Epoch                     |
| 跨 Group 执行顺序                    | Worker 自有的 Scheduler                    |
| 状态转换验证和各 Group 的 Event 顺序 | Group Authority                            |
| 工具、数据、资源和 side-effect 权限  | Authorization Service 和 Organization 策略 |

每个 Group 都有一个逻辑 Group
Authority。实现可以在内部复制它，但共识、领导者选举和副本拓扑不会作为协议语义暴露。

Registry 与 Session 引导阶段的 Command 和 Event 以 Organization 为作用域，不携带 Group 排序上下文。针对现有 Group 的 Command 必须携带适用于其 actor 的权限 epoch；仅 Coordinator 可发出的 Command 还必须在顶层携带
`coordinatorEpoch`，不得放在 payload 中。

## 身份不等于在线状态

Agent
Card 是稳定、版本化且由 Organization 签名的身份。它包含公钥、endpoint、支持的协议版本、已验证能力和最大并发数，不包含可复用凭据或工具权限。

Presence
Record 是临时记录，可以报告可用性、空闲执行槽位、能力可用性、预计响应延迟和心跳时间。过期的 Presence
Record 绝不代表接受分派或续期 lease。

:::note[能力不等于授权]

能力表明 Agent 已被验证能够执行什么。授权决定该 Agent 在当前 Mission 策略、ownership、lease、approval 和预算约束下，是否可以对特定资源执行特定操作。

:::

## Session 与 fencing

WebSocket 握手使用已向 Organization 注册的 Ed25519 密钥和新的质询。成功握手会签发短期 session
token 和新的 Session Epoch。签发 epoch `n + 1` 后，该 Agent 身份下所有 epoch 为
`n` 或更低的 runtime 都会通过 fencing 失效。

其他 epoch 会进一步收窄权限：

- Membership Epoch 通过 fencing 使某个 Group Membership 的旧版本失效；
- Coordinator Epoch 通过 fencing 使被替换的 Coordinator 及其授权失效；
- Ownership Epoch 通过 fencing 使排他工作的前所有者失效；以及
- Execution Lease ID 通过 fencing 使已过期或被撤销的执行时段失效。

持久 Command 和 Artifact
manifest 分别对规范化 JSON 签名。已接受的 Event 由 Group Authority 签名。

## 从上下文到获准的 side effect

```text
Message 或 Work Proposal
        ↓ 明确授权
WorkItem 与 Work Contract
        ↓ Worker 接收
Ownership Epoch
        ↓ 当前 session、policy、budget 和 approval 检查
Execution Lease 与范围受限的 capability token
        ↓
允许的操作
```

Message、Agent Card、Context Package、Artifact 和 Group
Event 不得携带 secret 或可复用凭据。高风险操作可能需要签署的人类 Execution
Approval，Authorization Service 才会签发能力令牌。

在 Coordinator 验证结果后，根 Mission 仍需要单独的最终人类 Approval。Execution
Approval 允许执行边界明确的高风险操作；最终 Approval 接受已完成的 Mission 修订版本和 Artifact 集合。

完整规则请阅读规范性
[身份与 session](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#6-identity-agent-registry-and-sessions)、
[Membership 与可见性](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#8-membership-visibility-and-attention)
和
[授权与预算](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#12-authorization-budgets-and-side-effects)
章节。
