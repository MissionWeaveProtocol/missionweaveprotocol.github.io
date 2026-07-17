---
title: Terminología de MissionWeaveProtocol
description:
  Términos esenciales de MissionWeaveProtocol sobre identidad, colaboración,
  trabajo, planificación y Approval.
sidebar:
  badge:
    text: Draft 0.1
    variant: caution
---

Esta página es una referencia de aprendizaje compacta. El
[glosario canónico del protocolo](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/CONTEXT.md)
define el vocabulario normativo de MissionWeaveProtocol 0.1.

## Organization e identidad

**Organization**: El límite de gobierno de confianza que registra Agent,
autentica a las personas y define la política.

**Agent**: Un entorno de ejecución planificado de forma independiente, con una
identidad estable y, como máximo, una Session activa.

**Agent Card**: Una descripción de la identidad estable firmada por la
Organization y de las Capability verificadas y versionadas. No contiene permisos
ni credenciales reutilizables.

**Agent Registry**: La fuente controlada por la Organization para Agent Card,
claves de firma, Evidence de Capability y estado de validez.

**Presence Record**: Información efímera de disponibilidad, capacidad y latido
que se mantiene separada de la Agent Card estable.

**Group Authority**: Infraestructura de la Organization que valida identidad,
Membership, política y transiciones de estado estructuradas, y añade el
historial ordenado de Event del Group.

## Colaboración en una Mission

**Mission**: Un objetivo acotado con una definición de finalización,
presupuesto, plazo y ciclo de vida de Approval.

**Group**: El espacio de colaboración temporal y el historial compartido que
pertenecen exactamente a una Mission.

**MissionOwner**: El Principal responsable. Un MissionOwner raíz es humano y
posee la autoridad de Approval final, cancelación y reemplazo del Coordinator.

**Coordinator**: El Agent reemplazable responsable de planificar, asignar,
supervisar el progreso, integrar, verificar y presentar.

**Worker**: Un Agent que acepta y ejecuta WorkItem mediante sus propias colas y
Scheduler. Un Worker puede pertenecer a muchos Group.

**Membership**: La autorización de alcance limitado que conecta un Agent o
MissionOwner con un Group.

## Conversation y trabajo

**Conversation**: Un hilo auditable de Message cuyo alcance es un Group o un
WorkItem.

**Message**: Contexto de Conversation confirmado. Un Message nunca concede por
sí solo autoridad ejecutable.

**Work Proposal**: Solicitud no ejecutable de un miembro del Group para crear un
WorkItem.

**WorkItem**: Unidad explícita de trabajo de una Mission con propietario, ciclo
de vida, dependencias y Work Contract.

**Work Offer**: Invitación con vencimiento para que un Worker elegible acepte un
WorkItem después de su Admission Control local.

**Work Contract**: Objetivo, entregables, criterios de aceptación, entradas,
permisos, plazo y presupuesto de reintentos de un WorkItem.

**Artifact**: Entregable inmutable y direccionado por contenido que produce o
referencia el trabajo de una Mission.

**Evidence**: Hechos registrados que se usan para evaluar un Artifact o WorkItem
según sus criterios de aceptación.

**Context Package**: Resumen firmado y versionado, con procedencia, que
proporciona a un Agent contexto de Mission de alcance limitado.

## Coordinación y ejecución

**Command**: Solicitud firmada por un actor autorizado para realizar una
transición de estado estructurada.

**Event**: Hecho aceptado e inmutable en el historial monotónico de un Group.

**Cursor**: Posición contigua más alta de Event de un Group que un Agent ha
procesado de forma duradera.

**Ownership Lease**: Reserva acotada que mantiene un Worker asignado a un
WorkItem exclusivo.

**Execution Lease**: Concesión renovable y aislada que permite que una Session
de Worker y un Ownership Epoch ejecuten un WorkItem exclusivo.

**Scheduler**: Política propiedad del Worker que elige WorkItem elegibles entre
colas por Group y Capacity Slot.

**Checkpoint**: Referencia duradera de estado de ejecución, segura para
reanudar, que se utiliza para bloqueo, recuperación y preemption cooperativa.

**Approval**: Decisión firmada y duradera que acepta una revisión concreta de
una Mission y un conjunto exacto de Artifact. Una Mission raíz solo termina
después de una Approval humana.

## Jerarquía y extensiones

**Child Mission**: Una Mission creada para completar un WorkItem complejo de una
Mission padre, con presupuestos y autoridad más restringidos que los de su
elemento padre.

**Follow-up Mission**: Una nueva Mission enlazada a una Mission aprobada e
inmutable cuando después se necesita una corrección o trabajo adicional.

**Extension Profile**: Paquete de schema y semántica versionado y aprobado por
la Organization que no puede anular los invariantes centrales de
MissionWeaveProtocol.
