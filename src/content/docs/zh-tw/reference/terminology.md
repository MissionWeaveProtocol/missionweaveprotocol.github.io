---
title: MissionWeaveProtocol 術語
description: MissionWeaveProtocol 身份、協作、工作、排程和核准相關的核心術語。
sidebar:
  badge:
    text: 0.1 草案
    variant: caution
---

本頁是一份精簡的學習參考。
[權威協定術語表](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/CONTEXT.md)
定義了 MissionWeaveProtocol 0.1 的規範性詞彙。

## Organization 與身份

**Organization**：註冊 Agent、認證人類並制定策略的受信任治理邊界。

**Agent**：具有穩定身份、獨立接受排程的 runtime，最多只能有一個 active session。

**Agent
Card**：由 Organization 簽名的穩定身份及已驗證、版本化能力描述。它不包含權限或可重複使用憑證。

**Agent Registry**：由 Organization 控制，儲存 Agent
Card、簽名金鑰、能力 Evidence 和有效性狀態的權威來源。

**Presence Record**：與穩定 Agent Card 分離儲存的臨時可用性、容量和心跳資訊。

**Group
Authority**：Organization 基礎設施，負責驗證身份、Membership、策略和結構化狀態轉換，同時追加有序的 Group
Event 歷史。

## Mission 協作

**Mission**：邊界明確的目標，包含完成定義、預算、截止時間和 Approval 生命週期。

**Group**：恰好屬於一個 Mission 的臨時協作空間和共享歷史。

**MissionOwner**：承擔課責責任的 Principal。根 MissionOwner 是人類，擁有最終 Approval、取消和替換 Coordinator 的權限。

**Coordinator**：可替換的 Agent，負責規劃、分派、進度監控、整合、驗證和提交。

**Worker**：使用自身佇列和 Scheduler 接收並執行 WorkItem 的 Agent。一個 Worker 可以屬於多個 Group。

**Membership**：將 Agent 或 MissionOwner 連線到一個 Group 的範圍受限授權。

## 對話與工作

**Conversation**：範圍限定為某個 Group 或 WorkItem、可稽核的 Message 執行緒。

**Message**：已提交的對話上下文。Message 本身絕不授予可執行權限。

**Work Proposal**：Group 成員提出的不可執行請求，用於建立 WorkItem。

**WorkItem**：具有擁有者、生命週期、相依項目和 Work
Contract 的明確 Mission 工作單元。

**Work
Offer**：發給符合條件的 Worker、帶有到期時間的邀請，Worker 完成本機允入控制後可接收 WorkItem。

**Work
Contract**：WorkItem 的目標、交付成果、驗收標準、輸入、權限、截止時間和重試預算。

**Artifact**：由 Mission 工作產出或引用的不可變、按內容定址的交付成果。

**Evidence**：用於依據驗收標準評估 Artifact 或 WorkItem 的已記錄事實。

**Context
Package**：帶有溯源資訊的簽名、版本化摘要，為 Agent 提供範圍受限的 Mission 上下文。

## 協調與執行

**Command**：已授權主體為進行一次結構化狀態轉換而發出的簽名請求。

**Event**：Group 單調歷史中不可變的已接受事實。

**Cursor**：Agent 已持久處理的最高連續 Group Event 位置。

**Ownership Lease**：使一個 Worker 保持被分派到排他 WorkItem 的有界預留。

**Execution Lease**：可續期、受 fencing 的授權，允許一個 Worker
session 和 Ownership Epoch 執行排他 WorkItem。

**Scheduler**：由 Worker 控制的策略，在各 Group 佇列和容量槽位之間選擇符合條件的 WorkItem。

**Checkpoint**：持久、可安全復原的執行狀態引用，用於受阻處理、復原和協作式搶佔。

**Approval**：接受特定 Mission 修訂版本和精確 Artifact 集合的持久簽名決定。根 Mission 只有在人類 Approval 後才能完成。

## 層級與擴充

**Child
Mission**：為完成上層 Mission 的某個複雜 WorkItem 而建立的 Mission，其預算和權限相對上層收窄。

**Follow-up
Mission**：當不可變的已核准 Mission 後續需要修正或新增工作時，與之連結的新 Mission。

**Extension
Profile**：由 Organization 核准、版本化的 schema 與語義包，不能覆蓋 MissionWeaveProtocol 核心不變條件。
