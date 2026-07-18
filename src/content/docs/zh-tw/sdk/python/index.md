---
title: Python SDK
description: 從原始碼儲存庫設定並驗證 MissionWeaveProtocol Python SDK。
sidebar:
  label: Python
  order: 1
---

[MissionWeaveProtocol Python SDK](https://github.com/missionweaveprotocol/python-sdk)
是 MissionWeaveProtocol 0.1 的官方 Python 參考實作。它包括權威 Core、Agent
runtime、Worker Scheduler、Group
gateway、儲存轉接器、符合性測試執行器和可執行 POC。

以下說明使用 SDK 儲存庫的原始碼工作副本。

## 要求

- Python 3.12 或更高版本
- [`uv`](https://docs.astral.sh/uv/)
- Docker，用於可選的 PostgreSQL 整合測試

## 取得並準備 SDK

```bash
git clone https://github.com/missionweaveprotocol/python-sdk.git
cd python-sdk
uv sync --extra dev
```

原始碼包位於
[`src/missionweaveprotocol/`](https://github.com/missionweaveprotocol/python-sdk/tree/main/src/missionweaveprotocol)。專案 metadata 和命令入口點定義在
[`pyproject.toml`](https://github.com/missionweaveprotocol/python-sdk/blob/main/pyproject.toml)
中。

## 驗證原始碼工作副本

```bash
uv run pytest
uv run ruff check .
uv run ruff format --check .
uv run mypy
uv run missionweaveprotocol-conformance --root .
```

符合性命令針對內建的 21 個 Draft 2020-12
schema 檢查全部 52 個內建測試向量。協定儲存庫仍是規範性來源；
[`PROTOCOL_PIN.json`](https://github.com/missionweaveprotocol/python-sdk/blob/main/PROTOCOL_PIN.json)
記錄 SDK 使用的精確協定 commit 和 Artifact 內容摘要。

如需驗證同層目錄中的權威協定儲存庫工作副本，請改為執行：

```bash
git clone https://github.com/missionweaveprotocol/missionweaveprotocol.git ../missionweaveprotocol
uv run missionweaveprotocol-conformance --root ../missionweaveprotocol
```

## 執行 POC

```bash
uv run missionweaveprotocol-demo --workdir .missionweaveprotocol/poc
```

該命令產生一份規範化 JSON 報告；如果缺少任何必要行為，則以非零狀態退出。確定性場景涵蓋兩個同時進行的 Mission、共享 Worker、子任務、對等澄清、排程、僅限 checkpoint 的搶佔、復原、Coordinator 驗證和精確的人類核准。

## 執行 PostgreSQL 整合測試

```bash
docker compose up -d --wait postgres
MISSIONWEAVEPROTOCOL_TEST_POSTGRES_URL=postgresql://missionweaveprotocol:missionweaveprotocol@127.0.0.1:55432/missionweaveprotocol \
  uv run pytest tests/test_core.py -q
```

完成後停止本機服務：

```bash
docker compose down --volumes
```

## 執行開發 gateway

建立一次性開發金鑰和由 Organization 簽名的 Agent Registry：

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

`--allow-insecure` 僅可用於 loopback 開發。部署必須提供 `--tls-certfile` 和
`--tls-keyfile`；MissionWeaveProtocol 0.1 要求透過 TLS
1.3 使用安全的 WebSocket 傳輸。

## 建置本機產出物

```bash
uv build
```

產生的本機 wheel 包含
`py.typed`，以及用於 runtime 文件驗證的 21 個固定版本 schema。

實作細節、測試和目前相容性資訊請以權威
[SDK README](https://github.com/missionweaveprotocol/python-sdk/blob/main/README.md)
為準。
