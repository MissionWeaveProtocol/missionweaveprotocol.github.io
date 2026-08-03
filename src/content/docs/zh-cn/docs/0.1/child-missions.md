---
title: 子任务
description:
  将复杂工作项（WorkItem）递归拆解为边界明确、拥有独立 Group 的子任务，
  同时保留范围、预算、Evidence 和人类问责关系。
sidebar:
  order: 6
---

:::caution[0.1 草案标准]

这是一份非规范性学习指南。
[权威协议仓库](https://github.com/missionweaveprotocol/missionweaveprotocol)
仍是规范性来源。

:::

足够复杂的工作项（WorkItem）可以转化为一个**子任务（Child
Mission）**。子任务是独立 Mission，不是 WorkItem；它拥有自己的 Group、Coordinator、工作项图、Membership、预算、截止时间和批准策略。父级工作项与子任务相互链接。

```text
根 Mission 与 Group
└── 父级工作项进入 `blocked`
    └── 子任务及其独立 Group
        ├── 子任务的 Coordinator
        ├── 子任务内的工作项与 Evidence
        └── 子任务的批准
            └── 结果作为 Evidence 和 Artifact 返回
                并关联到父级工作项
```

:::note[一个 Mission 仍然只有一个 Group]

创建子任务不会把父级 Group 变成嵌套聊天室。子任务会获得单独的 Group，并且只与父级 Mission 共享经过授权的摘要、Artifact、Evidence 和稳定链接。

:::

## 权限与批准

默认情况下，子任务的 Coordinator 审查并提交结果。父级 Coordinator 充当子任务的 MissionOwner，并代表父级工作项批准子任务。Organization 风险策略可能还会要求人类直接批准。

获批的子任务结果会成为父级工作项的 Evidence 和 Artifact。父级 Coordinator 会收到状态变更、摘要、更新后的估算、阻塞因素、预算或策略升级以及最终结果。它不需要查看子任务中的每条 Message，但保留按需进行授权检查的能力。根 MissionOwner 可以检查完整的 Mission 树。

## 范围向下收窄

父子关系图必须保持无环。子任务的预算、截止时间、能力、数据访问和权限必须是父级 Mission 对应范围的子集。Organization 会配置默认最大深度，超过该阈值时需要 MissionOwner 或策略明确批准。

深度限制是一道安全护栏，而不是固定上限。明确批准额外范围或深度后，合理的复杂工作可以继续进行。

## 子任务失败不会自动导致父级工作项失败

失败的子任务会发出结构化失败 Evidence，并依据声明的策略阻塞父级工作项或使其失败。父级 Coordinator 可以重新规划、修订范围、创建替代子任务或取消该分支。只有父级工作项的完成策略声明该子任务不可或缺且没有替代方案时，失败才会自动传播。

## 使用子任务还是 Follow-up Mission？

- 使用**子任务**在处于 `active` 状态的父级 Mission 内完成复杂工作项。
- 使用 **Follow-up Mission**
  对已获批且不可变的 Mission 进行纠正、补救或追加工作。

完整规则请阅读规范性
[父级 Mission 与子任务](../../../0.1/reference/specification/missions-groups-and-membership/#14-parent-and-child-missions)
和
[Mission 生命周期](../../../0.1/reference/specification/missions-groups-and-membership/#7-mission-and-group-lifecycle)
章节。
