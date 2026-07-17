---
title: 子 Mission
description:
  將複雜 WorkItem 遞迴拆解為邊界明確的 Mission
  Group，同時保留範圍、預算、Evidence 和 人類課責關係。
sidebar:
  order: 6
---

:::caution[0.1 草案標準]

這是一份非規範性學習指南。
[權威協定儲存庫](https://github.com/missionweaveprotocol/missionweaveprotocol)
仍是規範性來源。

:::

足夠複雜的 WorkItem 可以成為一個
**子 Mission**。子 Mission 擁有自己的 Group、Coordinator、WorkItem 圖、Membership、預算、截止時間和核准策略。上層 WorkItem 與子 Mission 相互連結。

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

:::note[一個 Mission 仍然只有一個 Group]

建立子 Mission 不會把上層 Group 變成巢狀聊天室。子 Mission 會獲得單獨的 Group，並且只與上層共享經過授權的摘要、Artifact、Evidence 和穩定連結。

:::

## 權限與核准

預設情況下，子 Coordinator 評審並提交子 Mission 結果。Parent
Coordinator 充當子 MissionOwner，並代表上層 WorkItem 核准子 Mission。Organization 風險策略可能還會要求人類直接核准。

已核准的子 Mission 結果會成為上層 WorkItem 的 Evidence 和 Artifact。Parent
Coordinator 會收到狀態變更、摘要、更新後的估算、阻礙因素、預算或策略升級以及最終結果。它不需要檢視每條子 Message，但保留視需要進行授權檢查的能力。根 MissionOwner 可以檢查完整的 Mission 樹。

## 範圍向下收窄

父子關係圖必須保持無環。子 Mission 的預算、截止時間、能力、資料存取和權限必須是上層對應範圍的子集。Organization 會設定預設最大深度，超過該門檻時需要 MissionOwner 或策略明確核准。

深度限制是一道安全護欄，而不是固定上限。明確核准提供額外範圍或深度後，合理的複雜工作可以繼續進行。

## 子 Mission 失敗不會自動導致上層失敗

失敗的子 Mission 會發出結構化失敗 Evidence，並依據宣告的策略使上層 WorkItem 受阻或失敗。Parent
Coordinator 可以重新規劃、修訂範圍、建立替代子 Mission 或取消該分支。只有上層完成策略宣告該子 Mission 不可或缺且沒有替代方案時，失敗才會自動傳播。

## 使用子 Mission 還是 follow-up Mission？

- 使用 **子 Mission** 在 active 上層 Mission 內完成複雜 WorkItem。
- 使用 **follow-up Mission**
  對已核准且不可變的 Mission 進行修正、補救或額外工作。

完整規則請閱讀規範性
[parent 與子 Mission](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#14-parent-and-child-missions)
和
[Mission 生命週期](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#7-mission-and-group-lifecycle)
章節。
