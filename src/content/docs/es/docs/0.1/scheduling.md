---
title: Planificación entre Group
description:
  Colas del Worker por Group, planificación global, Capacity Slot aislados,
  preemption segura mediante Checkpoint y Replay en MissionWeaveProtocol 0.1.
sidebar:
  label: Planificación
  order: 4
---

:::caution[Draft Standard 0.1]

Esta es una guía de aprendizaje no normativa. El
[repositorio canónico del protocolo](https://github.com/missionweaveprotocol/missionweaveprotocol)
sigue siendo normativo.

:::

Un Worker puede pertenecer a muchos Mission Group sin mezclar sus contextos.
Mantiene una bandeja de entrada de Event, un Cursor y una cola de trabajo
distintos para cada Group, y después usa un Scheduler propiedad del Worker para
elegir WorkItem elegibles entre esas colas.

```text
Group A Events → Group A queue ┐
Group B Events → Group B queue ├→ Worker Scheduler → isolated execution slots
Group C Events → Group C queue ┘
```

## Quién controla la prioridad

El Coordinator indica la urgencia solicitada, el plazo y el impacto para el
negocio de su Mission. El Worker Scheduler tiene el control final del orden
entre Group. Un Coordinator no puede anteponer su Mission a Group no
relacionados; un cambio de prioridad a escala de la Organization se tramita
mediante la política o el MissionOwner.

El Scheduler debe proporcionar equidad ponderada y evitar la inanición. Su orden
efectivo debe tener en cuenta:

- la clase de prioridad de la Organization;
- los plazos y la antigüedad en cola;
- las cuotas por Group;
- el riesgo y los controles de Approval; y
- los recursos y Capacity Slot disponibles.

Una planificación sin límites que atienda siempre primero la prioridad máxima no
es conforme, porque un Group ocupado o urgente podría privar de recursos a todos
los demás Group.

## Divulgación que preserva la privacidad

Cuando un Worker acepta una oferta o cambia materialmente su planificación, debe
publicar un intervalo estimado de inicio, una finalización estimada, la
confianza, el estado de capacidad y la hora del cálculo. No debe revelar la
identidad, el contenido, las asignaciones ni la posición exacta en la cola
global de otro Group.

Cada Capacity Slot aísla el contexto de Mission, las credenciales, los
Checkpoint, los presupuestos de herramientas y las claves de efectos secundarios
respecto a cualquier otro Capacity Slot.

## Ownership, Execution Lease y preemption segura

La aceptación inicia un Ownership Epoch y un plazo límite para comenzar. Iniciar
el trabajo también requiere una Execution Lease. Esta se vincula al Agent, al
Session Epoch, al WorkItem, al Ownership Epoch y a una fecha de expiración.

Los cambios de prioridad reordenan inmediatamente el trabajo en cola. El trabajo
activo no se interrumpe en un punto inseguro. La preemption cooperativa sigue
una secuencia duradera:

1. el Scheduler solicita la preemption;
2. el Worker alcanza un Checkpoint seguro e idempotente;
3. el Worker registra ese Checkpoint y se pausa;
4. se libera el Capacity Slot; y
5. el WorkItem vuelve a la cola de su Group para reanudarse más adelante.

El bloqueo sigue el mismo principio de seguridad: crear un Checkpoint, registrar
la causa del bloqueo, liberar capacidad y luego reanudar o reasignar según las
reglas vigentes de Ownership y Execution Lease.

## Recuperación mediante Replay

Las colas por Group son proyecciones locales de Event duraderos del Group. Un
Worker reiniciado restaura sus Cursor y sus colas a partir de un Group Snapshot
y un Replay ordenado. La entrega de Event es al menos una vez, por lo que el
Worker deduplica por Event ID y solo avanza el Cursor duradero contiguo más alto
de cada Group.

MissionWeaveProtocol define el orden dentro de un Group, no un orden global
entre Group.

Para consultar todas las reglas, lee las secciones normativas sobre
[planificación, ejecución y recuperación](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#11-scheduling-execution-and-recovery)
y
[entrega y Replay](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#16-delivery-replay-and-acknowledgement).
