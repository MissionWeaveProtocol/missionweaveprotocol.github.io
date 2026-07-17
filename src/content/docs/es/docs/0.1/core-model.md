---
title: Modelo central
description:
  Las Mission, los Group, los roles, los registros duraderos y las proyecciones
  locales que componen MissionWeaveProtocol 0.1.
sidebar:
  order: 2
---

:::caution[Draft Standard 0.1]

Esta es una guía de aprendizaje no normativa. El
[repositorio canónico del protocolo](https://github.com/missionweaveprotocol/missionweaveprotocol)
sigue siendo normativo.

:::

MissionWeaveProtocol organiza la cooperación alrededor de una **Mission**
acotada y su **Group** temporal. Cada Mission posee exactamente un Group
principal y cada Group principal pertenece exactamente a una Mission.

```text
Organization
├── Agent Registry
├── Group Authority and durable Event store
├── Authorization Service
└── Mission
    └── Group
        ├── MissionOwner
        ├── Coordinator
        ├── Worker Memberships
        ├── Conversations and Messages
        ├── WorkItems and Work Contracts
        └── ordered Events, Artifacts, Evidence, and Approvals
```

## Roles y responsabilidades

| Rol                   | Responsabilidad                                                                     | Límite importante                                          |
| --------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Organization          | Gobierna la identidad, la política, la autorización y la infraestructura            | Es el único límite de confianza en 0.1                     |
| MissionOwner          | Marca la dirección, inspecciona el progreso, interviene y da la Approval final      | Un MissionOwner raíz es humano                             |
| Coordinator           | Planifica, asigna, supervisa, integra y presenta la Mission                         | Es reemplazable y queda aislado por un Coordinator Epoch   |
| Worker                | Acepta y ejecuta WorkItem mediante sus propias colas y Scheduler                    | El mismo Agent puede trabajar en muchos Group              |
| Group Authority       | Autentica actores, valida políticas, serializa transiciones y añade Event           | Ordena el estado; no gestiona el significado de la Mission |
| Authorization Service | Emite Capability Token de corta duración y alcance limitado tras las comprobaciones | Una Capability no equivale a una autorización              |

Una **Agent Card** contiene identidad estable, firmada por la Organization, y
Capability verificadas. Un **Presence Record** contiene disponibilidad y
capacidad efímeras. Se mantienen separados porque la disponibilidad temporal no
debe reescribir una identidad de confianza.

## Los registros que conectan la cooperación

- Una **Membership** conecta un Principal con un Group, un conjunto de roles, un
  intervalo de visibilidad y un Membership Epoch.
- Una **Conversation** contiene Message duraderos para planificar en el Group o
  para un WorkItem.
- Un **WorkItem** es trabajo ejecutable de una Mission. Su **Work Contract**
  define el objetivo, los entregables, la Evidence, los permisos, el plazo y el
  presupuesto.
- Un **Artifact** es un entregable inmutable y direccionado por contenido.
- La **Evidence** registra cómo un Artifact o WorkItem satisface los criterios
  de aceptación.
- Un **Event** es un hecho aceptado e inmutable dentro del historial monotónico
  de un Group.
- Un **Cursor** registra la posición contigua más alta de Event del Group que un
  Agent ha procesado de forma duradera.

:::note[Los Message nunca se convierten implícitamente en asignaciones]

Un Message puede aportar contexto o proponer trabajo. La responsabilidad
ejecutable comienza solo después de una transición autorizada del WorkItem y la
aceptación del Worker.

:::

## Estado autoritativo y proyecciones locales

MissionWeaveProtocol separa la verdad compartida del estado reconstruible del
Worker.

El **estado autoritativo** incluye Mission, Membership y WorkItem. También
incluye Ownership Epoch, Execution Lease, recibos de deduplicación, Approval y
Event del Group. La Group Authority serializa los cambios de este estado.

Las **proyecciones locales del Agent** incluyen Cursor, colas por Group,
Checkpoint, bandejas de salida y entrada y estado del Scheduler. Un Agent puede
reconstruirlas a partir de Event duraderos. Perder una base de datos local no
debe cambiar el estado autoritativo de la Mission.

## Invariantes que conviene recordar

- Una Mission tiene un Group principal y un orden de Event por Group.
- La Conversation nunca constituye autoridad de ejecución.
- El trabajo exclusivo queda aislado por Ownership Epoch y Execution Lease.
- Los Event aceptados y los Message confirmados son append-only.
- El contexto y las credenciales de una Mission están aislados por defecto.
- Los presupuestos y permisos de un WorkItem y una Child Mission no pueden
  superar los de sus elementos padre.
- Completar una Mission raíz requiere la Approval humana de una revisión exacta
  y un conjunto exacto de Artifact.
- Los Agent publican las decisiones, entradas, Evidence, bloqueos y resultados
  necesarios para la auditoría, no su chain-of-thought privado.

Para consultar todas las reglas, lee las secciones normativas sobre
[invariantes centrales](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#4-core-invariants)
y
[arquitectura del sistema](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#5-system-architecture).
