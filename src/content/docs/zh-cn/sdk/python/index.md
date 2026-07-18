---
title: Python SDK
description: 从源码仓库设置并验证 MissionWeaveProtocol Python SDK。
sidebar:
  label: Python
  order: 1
---

[MissionWeaveProtocol Python SDK](https://github.com/missionweaveprotocol/python-sdk)
是 MissionWeaveProtocol 0.1 的官方 Python 参考实现。它包括权威 Core、Agent
runtime、Worker Scheduler、Group
gateway、存储适配器、符合性测试运行器和可执行 POC。

以下说明使用 SDK 仓库的源码检出目录。

## 要求

- Python 3.12 或更高版本
- [`uv`](https://docs.astral.sh/uv/)
- Docker，用于可选的 PostgreSQL 集成测试

## 检出并准备 SDK

```bash
git clone https://github.com/missionweaveprotocol/python-sdk.git
cd python-sdk
uv sync --extra dev
```

源码包位于
[`src/missionweaveprotocol/`](https://github.com/missionweaveprotocol/python-sdk/tree/main/src/missionweaveprotocol)。项目 metadata 和命令入口点定义在
[`pyproject.toml`](https://github.com/missionweaveprotocol/python-sdk/blob/main/pyproject.toml)
中。

## 验证源码检出目录

```bash
uv run pytest
uv run ruff check .
uv run ruff format --check .
uv run mypy
uv run missionweaveprotocol-conformance --root .
```

符合性命令针对内置的 21 个 Draft 2020-12
schema 检查全部 52 个内置测试向量。协议仓库仍是规范性来源；
[`PROTOCOL_PIN.json`](https://github.com/missionweaveprotocol/python-sdk/blob/main/PROTOCOL_PIN.json)
记录 SDK 使用的准确协议 commit 和 Artifact 内容摘要。

如需验证同级目录中的权威协议仓库检出目录，请改为运行：

```bash
git clone https://github.com/missionweaveprotocol/missionweaveprotocol.git ../missionweaveprotocol
uv run missionweaveprotocol-conformance --root ../missionweaveprotocol
```

## 运行 POC

```bash
uv run missionweaveprotocol-demo --workdir .missionweaveprotocol/poc
```

该命令生成一份规范化 JSON 报告；如果缺少任何必需行为，则以非零状态退出。确定性场景涵盖两个并发 Mission、共享 Worker、子任务、对等澄清、调度、仅限 checkpoint 的抢占、恢复、Coordinator 验证和准确的人类批准。

## 运行 PostgreSQL 集成测试

```bash
docker compose up -d --wait postgres
MISSIONWEAVEPROTOCOL_TEST_POSTGRES_URL=postgresql://missionweaveprotocol:missionweaveprotocol@127.0.0.1:55432/missionweaveprotocol \
  uv run pytest tests/test_core.py -q
```

完成后停止本地服务：

```bash
docker compose down --volumes
```

## 运行开发 gateway

创建一次性开发密钥和由 Organization 签名的 Agent Registry：

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

`--allow-insecure` 仅可用于 loopback 开发。部署必须提供 `--tls-certfile` 和
`--tls-keyfile`；MissionWeaveProtocol 0.1 要求通过 TLS
1.3 使用安全的 WebSocket 传输。

## 构建本地产物

```bash
uv build
```

生成的本地 wheel 包含
`py.typed`，以及用于 runtime 文档验证的 21 个固定版本 schema。

实现细节、测试和当前兼容性信息请以权威
[SDK README](https://github.com/missionweaveprotocol/python-sdk/blob/main/README.md)
为准。
