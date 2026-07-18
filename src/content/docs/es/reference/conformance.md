---
title: Conformidad
description:
  Ejecuta los 52 vectores de conformidad de MissionWeaveProtocol independientes
  de la implementación.
sidebar:
  label: Conformidad
  order: 3
---

MissionWeaveProtocol 0.1 proporciona **52 casos de conformidad independientes de
la implementación**:

| Resultado esperado | Casos | Directorio canónico                                                                                                                  |
| ------------------ | ----: | ------------------------------------------------------------------------------------------------------------------------------------ |
| Válido             |    25 | [`conformance/vectors/valid/`](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/conformance/vectors/valid)     |
| No válido          |    27 | [`conformance/vectors/invalid/`](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/conformance/vectors/invalid) |

El
[`manifest.json` canónico](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/conformance/manifest.json)
asocia cada caso con un schema, un documento de instancia y su validez esperada.
Consulta el
[README de conformidad](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/conformance/README.md)
para conocer los requisitos normativos de uso.

## Qué demuestran los vectores

Ejecutar los 52 casos comprueba que una implementación coincide con las reglas
estructurales de documentos del protocolo. Los casos no válidos abarcan formas
rechazadas deliberadamente, como firmas ausentes, estados de ciclo de vida no
válidos, ausencia de Ownership, comportamiento inseguro de extensiones y
procedencia incoherente.

Superar el manifiesto es necesario, pero no suficiente. La conformidad de
comportamiento también exige las reglas de máquina de estados, orden,
autorización, firma, epoch, lease, presupuesto, jerarquía, timestamp y Replay de
la
[especificación normativa](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md).

La criptografía de documentos firmados constituye una superficie de conformidad
independiente. Su
[manifiesto criptográfico](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/cryptography/manifest.json)
contiene 22 casos y 58 evaluaciones para los nueve perfiles de esquema que
requieren firma. El
[README criptográfico](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/cryptography/README.md)
define los requisitos ordenados de verificación en seis etapas. Superar uno de
los manifiestos no implica superar el otro.

## Validar en el checkout del protocolo

```bash
python -m pip install -r requirements-validation.txt
python scripts/check_repository_policy.py
python scripts/validate_protocol.py
```

## Ejecutar con Python SDK

Con checkouts de código fuente hermanos llamados `missionweaveprotocol` y
`python-sdk`, ejecuta lo siguiente desde el checkout del protocolo:

```bash
uv run --project ../python-sdk missionweaveprotocol-conformance --root .
```

O ejecuta lo siguiente desde el checkout de Python SDK:

```bash
uv run missionweaveprotocol-conformance --root ../missionweaveprotocol
```

Python SDK también incluye el mismo paquete de schemas y vectores para
validación sin conexión. Su
[`PROTOCOL_PIN.json`](https://github.com/missionweaveprotocol/python-sdk/blob/main/PROTOCOL_PIN.json)
registra el commit exacto del protocolo y los resúmenes de contenido usados por
ese checkout.
