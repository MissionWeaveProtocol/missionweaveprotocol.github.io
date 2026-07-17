---
title: 適合性
description:
  実装に依存しない 43 個の MissionWeaveProtocol 適合性 vector を実行します。
sidebar:
  label: 適合性
  order: 3
---

MissionWeaveProtocol 0.1 は、**実装に依存しない 43 個の適合性 test
case**を提供します。

| 期待される結果 | case 数 | 正本ディレクトリ                                                                                                                     |
| -------------- | ------: | ------------------------------------------------------------------------------------------------------------------------------------ |
| Valid          |      22 | [`conformance/vectors/valid/`](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/conformance/vectors/valid)     |
| Invalid        |      21 | [`conformance/vectors/invalid/`](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/conformance/vectors/invalid) |

正本となる
[`manifest.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/conformance/manifest.json)
は、各 case を 1 つの schema、1 つの instance
document、期待される妥当性に対応付けます。規範となる使用要件については、
[conformance README](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/conformance/README.md)
を参照してください。

## vector が証明すること

43
case をすべて実行すると、実装がプロトコルの文書構造ルールと一致することを確認できます。invalid
case には、signature の欠落、無効な lifecycle
state、ownership の欠落、安全でない extension の動作、一貫しない provenance など、意図的に拒否される形式が含まれます。

manifest への合格は必要条件ですが、十分条件ではありません。動作上の適合性には、
[規範となる仕様](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md)
で定める state
machine、ordering、authorization、signature、epoch、lease、budget、hierarchy、timestamp、replay の各ルールへの準拠も必要です。

## プロトコル checkout で検証する

```bash
python -m pip install -r requirements-validation.txt
python scripts/check_repository_policy.py
python scripts/validate_protocol.py
```

## Python SDK で実行する

`missionweaveprotocol` と `python-sdk`
という名前のソース checkout を同じ階層に配置し、プロトコル checkout から次を実行します。

```bash
uv run --project ../python-sdk missionweaveprotocol-conformance --root .
```

または Python SDK checkout から次を実行します。

```bash
uv run missionweaveprotocol-conformance --root ../missionweaveprotocol
```

Python
SDK は、オフライン検証用に同じ schema と vector の bundle も同梱しています。SDK の
[`PROTOCOL_PIN.json`](https://github.com/missionweaveprotocol/python-sdk/blob/main/PROTOCOL_PIN.json)
には、その checkout が使用する正確なプロトコル commit と content
digest が記録されています。
