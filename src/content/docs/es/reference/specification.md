---
title: MissionWeaveProtocol 0.1
description:
  Consulta la especificación normativa y el glosario del protocolo
  MissionWeaveProtocol.
sidebar:
  label: Especificación
  order: 1
banner:
  content:
    MissionWeaveProtocol 0.1 es un <strong>Draft Standard</strong>. Usa el
    repositorio canónico para consultar los requisitos normativos.
---

MissionWeaveProtocol 0.1 define la cooperación orientada a Group para Agent
autónomos que trabajan dentro de una Organization. Abarca identidad, Mission
Group, WorkItem explícitos, Message entre pares, planificación, autoridad, orden
duradero, Replay, verificación y Approval humana.

## Fuente normativa

Este sitio web explica MissionWeaveProtocol y enlaza a sus recursos, pero no es
la fuente normativa del protocolo. El
[repositorio `missionweaveprotocol`](https://github.com/missionweaveprotocol/missionweaveprotocol)
contiene los artefactos autoritativos:

- [Especificación MissionWeaveProtocol 0.1](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md)
- [Glosario del protocolo](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/CONTEXT.md)
- [JSON Schemas normativos](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/schemas)
- [Manifiesto y vectores de conformidad](https://github.com/missionweaveprotocol/missionweaveprotocol/tree/main/conformance)

Cuando esta guía y un artefacto normativo difieren, prevalece el artefacto del
repositorio del protocolo.

## Versión e identificadores

La versión actual del protocolo es `0.1`. Su espacio de nombres del wire es
`missionweaveprotocol`:

- los identificadores del protocolo usan `urn:missionweaveprotocol:*`;
- los tipos de extensiones integradas usan `ext.missionweaveprotocol.*`;
- los identificadores de schema usan
  `https://missionweaveprotocol.dev/schemas/0.1/`.

Las versiones del protocolo y del SDK se publican de forma independiente. Una
implementación debe declarar la compatibilidad y fijar una versión publicada del
protocolo o un commit exacto, en lugar de inferir compatibilidad por la
coincidencia de números de versión.

## Ruta de lectura

1. Empieza por el
   [glosario del protocolo](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/CONTEXT.md)
   para conocer el vocabulario compartido.
2. Lee la
   [especificación normativa](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md)
   para consultar los requisitos y las reglas del ciclo de vida.
3. Usa la [referencia de schemas](../schemas/) para conocer la estructura de los
   documentos.
4. Ejecuta los [vectores de conformidad](../conformance/) contra una
   implementación.
5. Sigue la [guía del código fuente de Python SDK](../../sdk/python/) para
   probar la implementación de referencia.

La validación de schemas demuestra únicamente la estructura de los documentos.
La conformidad de comportamiento también exige las reglas de máquina de estados,
orden, epoch, lease, presupuesto, jerarquía, timestamp, firma, autorización y
Replay de la especificación.
