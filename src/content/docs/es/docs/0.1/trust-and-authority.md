---
title: Confianza y autoridad
description:
  Cómo MissionWeaveProtocol separa la autoridad de identidad, Conversation,
  asignación, ejecución, orden y Approval final.
sidebar:
  order: 5
---

:::caution[Estándar en borrador 0.1]

Esta es una guía de aprendizaje no normativa. El
[repositorio canónico del protocolo](https://github.com/missionweaveprotocol/missionweaveprotocol)
sigue siendo normativo.

:::

MissionWeaveProtocol 0.1 funciona dentro de una Organization de confianza. La
Organization es la raíz de gobierno para la identidad de Agent, la política, la
autorización, el orden duradero por Group y la responsabilidad humana.

## La autoridad se divide deliberadamente

| Ámbito                                                | Autoridad                                           |
| ----------------------------------------------------- | --------------------------------------------------- |
| Identidad estable y Capability verificadas            | Agent Registry controlado por la Organization       |
| Dirección de la Mission y Approval final              | MissionOwner                                        |
| Planificación, asignación, integración y envío        | Coordinator Epoch actual                            |
| Orden de ejecución entre Group                        | Scheduler propiedad del Worker                      |
| Validación de transiciones y orden de Event por Group | Group Authority                                     |
| Permisos de herramientas, datos, recursos y efectos   | Authorization Service y política de la Organization |

La Group Authority es una autoridad lógica para cada Group. Una implementación
puede replicarla internamente, pero el consenso, la elección de líder y la
topología de réplicas no se exponen como semántica del protocolo.

Los Command y Event de arranque de Registry y Session tienen alcance de
Organization y no llevan contexto de orden del Group. Los Command para un Group
existente llevan los epochs de autoridad aplicables a su actor; los Command
exclusivos del Coordinator también llevan `coordinatorEpoch` en el nivel
superior, nunca dentro del payload.

## La identidad no es un Presence Record

Una Agent Card es identidad estable, versionada y firmada por la Organization.
Incluye claves públicas, endpoints, versiones de protocolo compatibles,
Capability verificadas y concurrencia máxima. No contiene credenciales
reutilizables ni permisos para herramientas.

Un Presence Record es efímero. Puede informar de disponibilidad general,
Capacity Slot disponibles, disponibilidad de Capability, latencia de respuesta
estimada y hora del latido. Un Presence Record obsoleto nunca supone aceptar una
asignación ni renovar una Execution Lease.

:::note[Capability no equivale a autorización]

Una Capability indica qué se ha verificado que puede hacer un Agent. La
autorización determina si ese Agent puede realizar una operación concreta sobre
recursos concretos bajo las restricciones vigentes de política, Ownership Epoch,
Execution Lease, Approval y presupuesto de la Mission.

:::

## Session y aislamiento de ejecuciones obsoletas

El handshake de WebSocket usa una clave Ed25519 registrada por la Organization y
un challenge nuevo. Un handshake correcto emite un session token de corta
duración y un nuevo Session Epoch. Emitir el epoch `n + 1` invalida todos los
runtime con epoch `n` o inferior para esa identidad de Agent.

Otros epochs restringen aún más la autoridad:

- un Membership Epoch invalida una versión anterior de una Membership de Group;
- un Coordinator Epoch invalida a un Coordinator reemplazado y sus concesiones;
- un Ownership Epoch invalida a los propietarios anteriores de trabajo
  exclusivo; y
- un Execution Lease ID invalida un periodo de ejecución caducado o revocado.

Los Command duraderos y los manifiestos de Artifact se firman individualmente
sobre JSON canónico. Los Event aceptados los firma la Group Authority.

## Del contexto al efecto secundario permitido

```text
Message o Work Proposal
        ↓ autorización explícita
WorkItem y Work Contract
        ↓ aceptación del Worker
Ownership Epoch
        ↓ comprobaciones vigentes de session, política, presupuesto y Approval
Execution Lease y Capability Token de alcance limitado
        ↓
Operación permitida
```

Los Message, Agent Card, Context Package, Artifact y Event del Group no deben
contener secretos ni credenciales reutilizables. Las operaciones de alto riesgo
pueden requerir una Execution Approval humana firmada antes de que la
Authorization Service emita un Capability Token.

La Mission raíz sigue necesitando una Approval humana final independiente
después de que el Coordinator verifique los resultados. La Execution Approval
permite una operación arriesgada y acotada; la Approval final acepta una
revisión concreta de la Mission completada y un conjunto de Artifact.

Para consultar todas las reglas, lee las secciones normativas sobre
[identidad y Session](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#6-identity-agent-registry-and-sessions),
[Membership y visibilidad](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#8-membership-visibility-and-attention)
y
[autorización y presupuestos](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#12-authorization-budgets-and-side-effects).
