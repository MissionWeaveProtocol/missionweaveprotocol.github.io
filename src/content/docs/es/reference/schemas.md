---
title: JSON Schemas
description:
  Consulta los 21 JSON Schemas normativos de MissionWeaveProtocol 0.1.
sidebar:
  label: JSON Schemas
  order: 2
---

MissionWeaveProtocol 0.1 define **21 archivos normativos de JSON Schema Draft
2020-12**. Los archivos canónicos se encuentran en el
[directorio `schemas/`](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/schemas)
del repositorio del protocolo.

Los nombres de propiedades del wire usan lower camel case. Los objetos centrales
rechazan las propiedades desconocidas y los datos de extensiones aprobadas solo
se transportan en miembros `extensions` explícitos.

## Catálogo de schemas

| Schema                                                                                                                                          | Propósito                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [`common.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/common.schema.json)                       | Definiciones compartidas del protocolo que utilizan los demás schemas                               |
| [`agent-card.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/agent-card.schema.json)               | Identidad estable del Agent firmada por la Organization y Capability verificadas                    |
| [`presence-record.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/presence-record.schema.json)     | Disponibilidad y capacidad efímeras del Agent                                                       |
| [`mission.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/mission.schema.json)                     | Objetivo, Ownership, presupuesto y ciclo de Approval de la Mission                                  |
| [`group.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/group.schema.json)                         | Group de colaboración temporal que pertenece a una Mission                                          |
| [`group-snapshot.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/group-snapshot.schema.json)       | Group Snapshot firmado para archivar el historial de un Group                                       |
| [`membership.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/membership.schema.json)               | Autorización de alcance limitado que conecta un Principal con un Group                              |
| [`conversation.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/conversation.schema.json)           | Hilo auditable de Conversation de un Group o WorkItem                                               |
| [`message.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/message.schema.json)                     | Contexto de Conversation confirmado que no concede autoridad de ejecución                           |
| [`work-contract.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/work-contract.schema.json)         | Objetivo, entregables, criterios, entradas, permisos, plazo y presupuesto de reintentos del trabajo |
| [`work-item.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/work-item.schema.json)                 | Unidad explícita de trabajo de una Mission, incluidos el ciclo de vida y Ownership                  |
| [`artifact.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/artifact.schema.json)                   | Manifiesto inmutable de un entregable direccionado por contenido                                    |
| [`evidence.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/evidence.schema.json)                   | Hechos registrados que se evalúan según los criterios de aceptación                                 |
| [`approval.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/approval.schema.json)                   | Approval firmada de un resultado exacto de Mission                                                  |
| [`context-package.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/context-package.schema.json)     | Contexto de Mission firmado, de alcance limitado y con procedencia                                  |
| [`command.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/command.schema.json)                     | Solicitud firmada de una transición de estado estructurada                                          |
| [`event.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/event.schema.json)                         | Hecho aceptado e inmutable en el historial ordenado de un Group                                     |
| [`error.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/error.schema.json)                         | Documento de error estructurado del protocolo                                                       |
| [`lease.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/lease.schema.json)                         | Execution Lease renovable y aislada por epoch                                                       |
| [`extension-profile.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/extension-profile.schema.json) | Definición gobernada de Extension Profile y metadatos de compatibilidad                             |
| [`websocket-frame.schema.json`](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/websocket-frame.schema.json)     | Unión canónica de frames WebSocket                                                                  |

El
[README canónico de schemas](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/schemas/README.md)
registra las reglas de validación compartidas.

## Validar el repositorio del protocolo

Desde un checkout del código fuente de `missionweaveprotocol`:

```bash
python -m pip install -r requirements-validation.txt
python scripts/check_repository_policy.py
python scripts/validate_protocol.py
```

Un validador debe registrar cada schema por su `$id` antes de resolver las
referencias. Superar la validación de schemas demuestra conformidad estructural,
no los requisitos de comportamiento de la [especificación](../specification/).

El [manifiesto de conformidad](../conformance/) proporciona instancias que se
espera que sean válidas y no válidas para estos schemas.
