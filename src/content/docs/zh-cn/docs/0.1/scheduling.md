---
title: 跨 Group 调度
description:
  MissionWeaveProtocol 0.1 中各 Group 的 Worker 队列、全局调度、隔离的执行槽位、
  checkpoint 安全抢占和 replay。
sidebar:
  label: 调度
  order: 4
---

:::caution[0.1 草案标准]

这是一份非规范性学习指南。
[权威协议仓库](https://github.com/missionweaveprotocol/missionweaveprotocol)
仍是规范性来源。

:::

Worker 可以属于多个 Mission
Group，而无需合并其上下文。它为每个 Group 维护独立的 Event 收件箱、Cursor 和工作队列，再由一个 Worker 自有的 Scheduler 从这些队列中选择符合条件的 WorkItem。

```text
Group A Events → Group A queue ┐
Group B Events → Group B queue ├→ Worker Scheduler → isolated execution slots
Group C Events → Group C queue ┘
```

## 谁控制优先级

Coordinator 为其 Mission 提供请求的紧急程度、截止时间和业务影响。Worker
Scheduler 对跨 Group 顺序拥有最终控制权。Coordinator 不能强制自己的 Mission 排在无关 Group 之前；Organization 级别的优先级变更必须通过策略或 MissionOwner 实施。

Scheduler 必须提供加权公平和防饥饿机制。其有效排序应考虑：

- Organization 优先级类别；
- 截止时间和队列等待时间；
- 各 Group 配额；
- 风险和批准关卡；以及
- 可用资源和执行槽位。

无限制地始终优先处理最高优先级不符合协议要求，因为繁忙或紧急的 Group 可能导致其他所有 Group 永远无法获得执行机会。

## 保护隐私的信息披露

Worker 接收邀约或实质性地调整调度时，应发布预计开始时间窗口、预计完成时间、置信度、容量状态和计算时间。它不得披露其他 Group 的身份、内容、分派或准确的全局队列位置。

每个执行槽位都将 Mission 上下文、凭据、checkpoint、工具预算和 side-effect
key 与其他所有槽位隔离。

## Ownership、lease 与安全抢占

接收会开始一个 Ownership
Epoch 和最迟启动期限。开始工作还需要一个绑定到 Agent、Session
Epoch、WorkItem、Ownership Epoch 和到期时间的 Execution Lease。

优先级变更会立即重新排序 queued 工作。active 工作不会在不安全的位置被中断。协作式抢占（preemption）遵循持久化序列：

1. Scheduler 请求抢占；
2. Worker 到达安全、幂等的 checkpoint；
3. Worker 记录该 checkpoint 并暂停；
4. 执行槽位被释放；以及
5. WorkItem 返回其 Group 队列，等待后续恢复。

blocking 遵循同样的安全原则：执行 checkpoint、发出阻塞原因、释放容量，再根据当前 ownership 和 lease 规则恢复或重新分派。

## 通过 replay 恢复

各 Group 队列是持久 Group
Event 的本地投影。重启后的 Worker 从快照和有序 replay 中恢复 Cursor 与队列。Event 交付为 at
least once，因此 Worker 按 Event
ID 去重，并且只推进每个 Group 中已持久化的最高连续 Cursor。

MissionWeaveProtocol 只定义 Group 内的顺序，不定义跨 Group 的全局顺序。

完整规则请阅读规范性
[调度、执行与恢复](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#11-scheduling-execution-and-recovery)
和
[交付与 replay](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#16-delivery-replay-and-acknowledgement)
章节。
