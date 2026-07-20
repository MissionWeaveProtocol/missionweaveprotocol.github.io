---
title: 子任务
description:
  將複雜工作項（WorkItem）遞迴拆解為邊界明確、擁有獨立 Group 的子任务，
  同時保留範圍、預算、Evidence 和人類課責關係。
sidebar:
  order: 6
---

:::caution[0.1 草案標準]

這是一份非規範性學習指南。
[權威協定儲存庫](https://github.com/missionweaveprotocol/missionweaveprotocol)
仍是規範性來源。

:::

足夠複雜的工作項（WorkItem）可以轉化為一個**子任务（Child
Mission）**。子任务是獨立 Mission，不是 WorkItem；它擁有自己的 Group、Coordinator、工作項圖、Membership、預算、截止時間和核准策略。上層工作項與子任务相互連結。

```text
根 Mission 與 Group
└── 上層工作項進入 `blocked`
    └── 子任务及其獨立 Group
        ├── 子任务的 Coordinator
        ├── 子任务內的工作項與 Evidence
        └── 子任务的核准
            └── 結果作為 Evidence 和 Artifact 返回
                並關聯到上層工作項
```

:::note[一個 Mission 仍然只有一個 Group]

建立子任务不會把上層 Group 變成巢狀聊天室。子任务會獲得單獨的 Group，並且只與上層 Mission 共享經過授權的摘要、Artifact、Evidence 和穩定連結。

:::

## 權限與核准

預設情況下，子任务的 Coordinator 審查並提交結果。上層 Coordinator 充當子任务的 MissionOwner，並代表上層工作項核准子任务。Organization 風險策略可能還會要求人類直接核准。

已核准的子任务結果會成為上層工作項的 Evidence 和 Artifact。上層 Coordinator 會收到狀態變更、摘要、更新後的估算、阻礙因素、預算或策略升級以及最終結果。它不需要檢視子任务中的每條 Message，但保留視需要進行授權檢查的能力。根 MissionOwner 可以檢查完整的 Mission 樹。

## 範圍向下收窄

父子關係圖必須保持無環。子任务的預算、截止時間、能力、資料存取和權限必須是上層 Mission 對應範圍的子集。Organization 會設定預設最大深度，超過該門檻時需要 MissionOwner 或策略明確核准。

深度限制是一道安全護欄，而不是固定上限。明確核准額外範圍或深度後，合理的複雜工作可以繼續進行。

## 子任务失敗不會自動導致上層工作項失敗

失敗的子任务會發出結構化失敗 Evidence，並依據宣告的策略使上層工作項受阻或失敗。上層 Coordinator 可以重新規劃、修訂範圍、建立替代子任务或取消該分支。只有上層工作項的完成策略宣告該子任务不可或缺且沒有替代方案時，失敗才會自動傳播。

## 使用子任务還是 Follow-up Mission？

- 使用**子任务**在處於 `active` 狀態的上層 Mission 內完成複雜工作項。
- 使用 **Follow-up Mission**
  對已核准且不可變的 Mission 進行修正、補救或額外工作。

完整規則請閱讀規範性
[上層 Mission 與子任务](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#14-parent-and-child-missions)
和
[Mission 生命週期](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#7-mission-and-group-lifecycle)
章節。
