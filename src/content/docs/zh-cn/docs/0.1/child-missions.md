---
title: 子 Mission
description:
  将复杂 WorkItem 递归拆解为边界明确的 Mission
  Group，同时保留范围、预算、Evidence 和 人类问责关系。
sidebar:
  order: 6
---

:::caution[0.1 草案标准]

这是一份非规范性学习指南。
[权威协议仓库](https://github.com/missionweaveprotocol/missionweaveprotocol)
仍是规范性来源。

:::

足够复杂的 WorkItem 可以成为一个
**子 Mission**。子 Mission 拥有自己的 Group、Coordinator、WorkItem 图、Membership、预算、截止时间和批准策略。父级 WorkItem 与子 Mission 相互链接。

```text
Root Mission and Group
└── parent WorkItem becomes blocked
    └── Child Mission and its own Group
        ├── child Coordinator
        ├── child WorkItems and Evidence
        └── child Approval
            └── result returns as Evidence and Artifacts
                for the parent WorkItem
```

:::note[一个 Mission 仍然只有一个 Group]

创建子 Mission 不会把父级 Group 变成嵌套聊天室。子 Mission 会获得单独的 Group，并且只与父级共享经过授权的摘要、Artifact、Evidence 和稳定链接。

:::

## 权限与批准

默认情况下，子 Coordinator 评审并提交子 Mission 结果。Parent
Coordinator 充当子 MissionOwner，并代表父级 WorkItem 批准子 Mission。Organization 风险策略可能还会要求人类直接批准。

获批的子 Mission 结果会成为父级 WorkItem 的 Evidence 和 Artifact。Parent
Coordinator 会收到状态变更、摘要、更新后的估算、阻塞因素、预算或策略升级以及最终结果。它不需要查看每条子 Message，但保留按需进行授权检查的能力。根 MissionOwner 可以检查完整的 Mission 树。

## 范围向下收窄

父子关系图必须保持无环。子 Mission 的预算、截止时间、能力、数据访问和权限必须是父级对应范围的子集。Organization 会配置默认最大深度，超过该阈值时需要 MissionOwner 或策略明确批准。

深度限制是一道安全护栏，而不是固定上限。明确批准提供额外范围或深度后，合理的复杂工作可以继续进行。

## 子 Mission 失败不会自动导致父级失败

失败的子 Mission 会发出结构化失败 Evidence，并依据声明的策略阻塞父级 WorkItem 或使其失败。Parent
Coordinator 可以重新规划、修订范围、创建替代子 Mission 或取消该分支。只有父级完成策略声明该子 Mission 不可或缺且没有替代方案时，失败才会自动传播。

## 使用子 Mission 还是 follow-up Mission？

- 使用 **子 Mission** 在 active 父级 Mission 内完成复杂 WorkItem。
- 使用 **follow-up Mission**
  对已获批且不可变的 Mission 进行纠正、补救或追加工作。

完整规则请阅读规范性
[parent 与子 Mission](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#14-parent-and-child-missions)
和
[Mission 生命周期](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#7-mission-and-group-lifecycle)
章节。
