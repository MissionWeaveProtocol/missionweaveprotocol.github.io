---
title: 工作生命周期
description:
  MissionWeaveProtocol
  如何从对话和工作提议推进到已接收、已验证并经人类批准的结果。
sidebar:
  order: 3
---

:::caution[0.1 草案标准]

这是一份非规范性学习指南。
[权威协议仓库](https://github.com/missionweaveprotocol/missionweaveprotocol)
仍是规范性来源。

:::

MissionWeaveProtocol 让对话式协作保持灵活，同时明确可执行责任。任何 Group 成员都可以讨论上下文、请求帮助或提出工作。只有经过授权的 WorkItem 状态转换才能让提议成为义务。

## 从讨论到承诺

1. **讨论。** Agent 在 Group 或 WorkItem Conversation 中交换完整的 Message。
2. **提议。** 任何 Group 成员都可以提交 Work
   Proposal。此时还不存在可执行的 WorkItem。
3. **授权。** 当前 Coordinator、MissionOwner 的紧急干预，或持有有效 scoped
   Delegation Grant 的 Agent 创建 WorkItem。
4. **发出邀约。**
   Coordinator 或获得范围授权的受委托者向符合条件的 Worker 发出 WorkItem 邀约，并记录选择依据。
5. **接收。** Worker 执行准入控制。有效接收会开始新的 Ownership
   Epoch，并将 WorkItem 放入该 Worker 对应的 Group 队列。

:::note[接收代表调度承诺]

接收邀约不代表立即执行。Worker
Scheduler 对跨 Group 顺序拥有最终控制权，并在容量、依赖项、策略和授权均允许时启动 WorkItem。

:::

## Work Contract

每个 WorkItem 都带有版本化、机器可读的 Work Contract，其中记录：

- 目标、交付物和验收标准；
- 所需 Evidence，以及输入或依赖项引用；
- 允许使用的工具、数据、资源和操作；
- 所需能力标识符及其版本；
- 截止时间、请求的紧急程度和业务影响；
- 财务、token、工具调用、计算、实际用时和 side-effect 预算；
- 重试次数、退避、截止时间和成本策略；以及
- 风险分类和所有执行前批准关卡。

关键歧义必须在接收前解决。对 Work Contract 的实质性修订需要 Worker 重新接收。

## 常见的成功路径

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

执行中的工作可以 checkpoint 回 `queued`，携带持久 checkpoint 进入
`blocked`，带着 Evidence 失败，或被取消。处于 blocked 状态的 WorkItem 会释放其执行槽位，之后返回队列，或在 ownership 过期后重新获得邀约。

## 先提供 Evidence，再批准

Worker 的声明不足以证明完成。提交内容必须包含映射到验收标准的 Artifact 和 Evidence。Coordinator 评审应验证 Artifact 完整性，在可用时运行确定性检查，为定性标准请求 reviewer
Agent 提供 Evidence，并保留结果。

所有必需的 WorkItem 均验证完成后，Coordinator 提交特定 Mission 修订版本和 Artifact 集合。MissionOwner 随后签署最终 Approval 或请求变更。变更请求会重新打开同一个 Mission，而不会删除之前的提交。

完整状态转换和权限规则请阅读规范性
[WorkItem 状态机](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#102-workitem-state-machine)
和
[基于 Evidence 的评审](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#132-evidence-based-review)。
