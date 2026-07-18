---
title: 符合性
description: 运行 52 个与实现无关的 MissionWeaveProtocol 符合性测试向量。
sidebar:
  label: 符合性
  order: 3
---

MissionWeaveProtocol 0.1 提供 **52 个与实现无关的符合性用例**：

| 预期结果 | 用例 | 权威目录                                                                                                                             |
| -------- | ---: | ------------------------------------------------------------------------------------------------------------------------------------ |
| 有效     |   25 | [`conformance/vectors/valid/`](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/conformance/vectors/valid)     |
| 无效     |   27 | [`conformance/vectors/invalid/`](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/conformance/vectors/invalid) |

权威
[`manifest.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/conformance/manifest.json)
将每个用例映射到一个 schema、一个实例文档及其预期有效性。规范性使用要求请参阅
[符合性 README](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/conformance/README.md)。

## 测试向量证明什么

运行全部 52 个用例，可以检查实现是否遵循协议的结构化文档规则。无效用例涵盖刻意拒绝的结构，例如缺少签名、无效生命周期状态、缺少 ownership、不安全的扩展行为和不一致的溯源信息。

通过 manifest 是必要条件，但并不充分。行为符合性还要求满足
[规范性协议说明](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md)
中的状态机、排序、授权、签名、epoch、lease、预算、层级、时间戳和 replay 规则。

## 在协议检出目录中验证

```bash
python -m pip install -r requirements-validation.txt
python scripts/check_repository_policy.py
python scripts/validate_protocol.py
```

## 使用 Python SDK 运行

当同级源码检出目录分别命名为 `missionweaveprotocol` 和 `python-sdk`
时，在协议检出目录中运行：

```bash
uv run --project ../python-sdk missionweaveprotocol-conformance --root .
```

或者在 Python SDK 检出目录中运行：

```bash
uv run missionweaveprotocol-conformance --root ../missionweaveprotocol
```

Python SDK 还内置了相同的 schema 和测试向量 bundle，用于离线验证。其中的
[`PROTOCOL_PIN.json`](https://github.com/missionweaveprotocol/python-sdk/blob/main/PROTOCOL_PIN.json)
记录该检出目录使用的准确协议 commit 和内容摘要。
