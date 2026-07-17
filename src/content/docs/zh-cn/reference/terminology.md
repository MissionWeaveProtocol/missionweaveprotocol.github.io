---
title: MissionWeaveProtocol 术语
description: MissionWeaveProtocol 身份、协作、工作、调度和批准相关的核心术语。
sidebar:
  badge:
    text: 0.1 草案
    variant: caution
---

本页是一份精简的学习参考。
[权威协议术语表](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/CONTEXT.md)
定义了 MissionWeaveProtocol 0.1 的规范性词汇。

## Organization 与身份

**Organization**：注册 Agent、认证人类并制定策略的受信任治理边界。

**Agent**：具有稳定身份、独立接受调度的 runtime，最多只能有一个 active session。

**Agent
Card**：由 Organization 签名的稳定身份及已验证、版本化能力描述。它不包含权限或可复用凭据。

**Agent Registry**：由 Organization 控制，存储 Agent
Card、签名密钥、能力 Evidence 和有效性状态的权威来源。

**Presence Record**：与稳定 Agent Card 分离保存的临时可用性、容量和心跳信息。

**Group
Authority**：Organization 基础设施，负责验证身份、Membership、策略和结构化状态转换，同时追加有序的 Group
Event 历史。

## Mission 协作

**Mission**：边界明确的目标，包含完成定义、预算、截止时间和 Approval 生命周期。

**Group**：恰好属于一个 Mission 的临时协作空间和共享历史。

**MissionOwner**：承担问责责任的 Principal。根 MissionOwner 是人类，拥有最终 Approval、取消和替换 Coordinator 的权限。

**Coordinator**：可替换的 Agent，负责规划、分派、进度监控、集成、验证和提交。

**Worker**：使用自身队列和 Scheduler 接收并执行 WorkItem 的 Agent。一个 Worker 可以属于多个 Group。

**Membership**：将 Agent 或 MissionOwner 连接到一个 Group 的范围受限授权。

## 对话与工作

**Conversation**：范围限定为某个 Group 或 WorkItem、可审计的 Message 线程。

**Message**：已提交的对话上下文。Message 本身绝不授予可执行权限。

**Work Proposal**：Group 成员提出的不可执行请求，用于创建 WorkItem。

**WorkItem**：具有所有者、生命周期、依赖项和 Work
Contract 的明确 Mission 工作单元。

**Work
Offer**：发给符合条件的 Worker、带有到期时间的邀请，Worker 完成本地准入控制后可接收 WorkItem。

**Work
Contract**：WorkItem 的目标、交付物、验收标准、输入、权限、截止时间和重试预算。

**Artifact**：由 Mission 工作产出或引用的不可变、按内容寻址的交付物。

**Evidence**：用于依据验收标准评估 Artifact 或 WorkItem 的已记录事实。

**Context
Package**：带有溯源信息的签名、版本化摘要，为 Agent 提供范围受限的 Mission 上下文。

## 协调与执行

**Command**：已授权主体为进行一次结构化状态转换而发出的签名请求。

**Event**：Group 单调历史中不可变的已接受事实。

**Cursor**：Agent 已持久处理的最高连续 Group Event 位置。

**Ownership Lease**：使一个 Worker 保持被分派到排他 WorkItem 的有界预留。

**Execution Lease**：可续期、受 fencing 的授权，允许一个 Worker
session 和 Ownership Epoch 执行排他 WorkItem。

**Scheduler**：由 Worker 控制的策略，在各 Group 队列和容量槽位之间选择符合条件的 WorkItem。

**Checkpoint**：持久、可安全恢复的执行状态引用，用于阻塞、恢复和协作式抢占。

**Approval**：接受特定 Mission 修订版本和准确 Artifact 集合的持久签名决定。根 Mission 只有在人类 Approval 后才能完成。

## 层级与扩展

**Child
Mission**：为完成父级 Mission 的某个复杂 WorkItem 而创建的 Mission，其预算和权限相对父级收窄。

**Follow-up
Mission**：当不可变的已批准 Mission 后续需要纠正或追加工作时，与之链接的新 Mission。

**Extension
Profile**：由 Organization 批准、版本化的 schema 与语义包，不能覆盖 MissionWeaveProtocol 核心不变量。
