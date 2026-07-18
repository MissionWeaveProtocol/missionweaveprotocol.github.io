---
title: Python SDK
description:
  ソースリポジトリから MissionWeaveProtocol Python SDK
  をセットアップし、検証します。
sidebar:
  label: Python
  order: 1
---

[MissionWeaveProtocol Python SDK](https://github.com/missionweaveprotocol/python-sdk)
は、MissionWeaveProtocol 0.1 の公式 Python リファレンス実装です。authoritative
Core、Agent runtime、Worker Scheduler、Group
gateway、ストレージアダプター、適合性テストランナー、実行可能な proof of
concept を含みます。

以下の手順では、SDK リポジトリのソース checkout を使用します。

## 要件

- Python 3.12 以降
- [`uv`](https://docs.astral.sh/uv/)
- optional な PostgreSQL integration test 用の Docker

## SDK を checkout して準備する

```bash
git clone https://github.com/missionweaveprotocol/python-sdk.git
cd python-sdk
uv sync --extra dev
```

ソースパッケージは
[`src/missionweaveprotocol/`](https://github.com/missionweaveprotocol/python-sdk/tree/main/src/missionweaveprotocol)
です。project metadata と command entry point は
[`pyproject.toml`](https://github.com/missionweaveprotocol/python-sdk/blob/main/pyproject.toml)
で定義されています。

## ソース checkout を検証する

```bash
uv run pytest
uv run ruff check .
uv run ruff format --check .
uv run mypy
uv run missionweaveprotocol-conformance --root .
```

適合性 command は、同梱された 52 個の vector すべてを、同梱された 21 個の Draft
2020-12 schema に対して検証します。プロトコルリポジトリが引き続き規範となり、
[`PROTOCOL_PIN.json`](https://github.com/missionweaveprotocol/python-sdk/blob/main/PROTOCOL_PIN.json)
には SDK が使用する正確な protocol commit と artifact
digest が記録されています。

代わりに、同じ階層へ checkout した正式なプロトコルリポジトリを検証するには、次を実行します。

```bash
git clone https://github.com/missionweaveprotocol/missionweaveprotocol.git ../missionweaveprotocol
uv run missionweaveprotocol-conformance --root ../missionweaveprotocol
```

## proof of concept を実行する

```bash
uv run missionweaveprotocol-demo --workdir .missionweaveprotocol/poc
```

この command は canonical JSON
report を 1 件生成し、必要な動作が欠けている場合は nonzero
status で終了します。deterministic scenario は、2 つの concurrent
Mission、共有 Worker、サブタスク、Agent 間の clarification、scheduling、checkpoint-only
preemption、recovery、Coordinator verification、正確な human
Approval を対象とします。

## PostgreSQL integration test を実行する

```bash
docker compose up -d --wait postgres
MISSIONWEAVEPROTOCOL_TEST_POSTGRES_URL=postgresql://missionweaveprotocol:missionweaveprotocol@127.0.0.1:55432/missionweaveprotocol \
  uv run pytest tests/test_core.py -q
```

終了したらローカルサービスを停止します。

```bash
docker compose down --volumes
```

## development gateway を実行する

使い捨ての開発用 key と、Organization 署名付きの Agent Registry を作成します。

```bash
uv run python examples/create_dev_registry.py
export MISSIONWEAVEPROTOCOL_ORGANIZATION_PUBLIC_KEY="$(uv run python -c \
  'import json; print(json.load(open(".missionweaveprotocol/dev-keys.json"))["organizationPublicKey"])')"
export MISSIONWEAVEPROTOCOL_AUTHORITY_PRIVATE_KEY="$(uv run python -c \
  'import json; print(json.load(open(".missionweaveprotocol/dev-keys.json"))["authorityPrivateKey"])')"
export MISSIONWEAVEPROTOCOL_SESSION_SECRET='development-only-session-secret-32-bytes'

uv run missionweaveprotocol-server \
  --registry .missionweaveprotocol/dev-registry.json \
  --database-url postgresql://missionweaveprotocol:missionweaveprotocol@127.0.0.1:55432/missionweaveprotocol \
  --organization-public-key "$MISSIONWEAVEPROTOCOL_ORGANIZATION_PUBLIC_KEY" \
  --allow-insecure
```

`--allow-insecure` はループバック上での開発専用です。deployment では
`--tls-certfile` と `--tls-keyfile`
を指定する必要があります。MissionWeaveProtocol 0.1 では TLS 1.3 上の secure
WebSocket transport が必須です。

## ローカル artifact を build する

```bash
uv build
```

生成されるローカル wheel には `py.typed` と、runtime document
validation に使用する pin 済みの 21 個の schema が含まれます。

実装の詳細、test、現在の compatibility 情報については、正式な
[SDK README](https://github.com/missionweaveprotocol/python-sdk/blob/main/README.md)
を参照してください。
