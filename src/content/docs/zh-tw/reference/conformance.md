---
title: 符合性
description: 執行 52 個與實作無關的 MissionWeaveProtocol 符合性測試向量。
sidebar:
  label: 符合性
  order: 3
---

MissionWeaveProtocol 0.1 提供 **52 個與實作無關的符合性案例**：

| 預期結果 | 案例 | 權威目錄                                                                                                                             |
| -------- | ---: | ------------------------------------------------------------------------------------------------------------------------------------ |
| 有效     |   25 | [`conformance/vectors/valid/`](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/conformance/vectors/valid)     |
| 無效     |   27 | [`conformance/vectors/invalid/`](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/conformance/vectors/invalid) |

權威
[`manifest.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/conformance/manifest.json)
將每個案例對應到一個 schema、一個實例文件及其預期有效性。規範性使用要求請參閱
[符合性 README](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/conformance/README.md)。

## 測試向量證明什麼

執行全部 52 個案例，可以檢查實作是否遵循協定的結構化文件規則。無效案例涵蓋刻意拒絕的結構，例如缺少簽名、無效生命週期狀態、缺少 ownership、不安全的擴充行為和不一致的溯源資訊。

透過 manifest 是必要條件，但並不充分。行為符合性還要求滿足
[規範性協定規格](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md)
中的狀態機、排序、授權、簽名、epoch、lease、預算、層級、時間戳記和 replay 規則。

## 在協定工作副本中驗證

```bash
python -m pip install -r requirements-validation.txt
python scripts/check_repository_policy.py
python scripts/validate_protocol.py
```

## 使用 Python SDK 執行

當同層原始碼工作副本分別命名為 `missionweaveprotocol` 和 `python-sdk`
時，在協定工作副本中執行：

```bash
uv run --project ../python-sdk missionweaveprotocol-conformance --root .
```

或者在 Python SDK 工作副本中執行：

```bash
uv run missionweaveprotocol-conformance --root ../missionweaveprotocol
```

Python SDK 還內建了相同的 schema 和測試向量 bundle，用於離線驗證。其中的
[`PROTOCOL_PIN.json`](https://github.com/missionweaveprotocol/python-sdk/blob/main/PROTOCOL_PIN.json)
記錄該工作副本使用的精確協定 commit 和內容摘要。
