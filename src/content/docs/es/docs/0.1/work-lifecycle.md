---
title: Ciclo de trabajo
description:
  Cómo MissionWeaveProtocol pasa de la Conversation y las Work Proposal a
  resultados aceptados, verificados y aprobados por una persona.
sidebar:
  order: 3
---

:::caution[Draft Standard 0.1]

Esta es una guía de aprendizaje no normativa. El
[repositorio canónico del protocolo](https://github.com/missionweaveprotocol/missionweaveprotocol)
sigue siendo normativo.

:::

MissionWeaveProtocol mantiene fluida la cooperación mediante Conversation y, al
mismo tiempo, hace explícita la responsabilidad ejecutable. Cualquier miembro
del Group puede debatir el contexto, pedir ayuda o proponer trabajo. Una
propuesta se convierte en obligación únicamente mediante una transición
autorizada de WorkItem.

## Del debate al compromiso

1. **Debatir.** Los Agent intercambian Message completos en una Conversation del
   Group o del WorkItem.
2. **Proponer.** Cualquier miembro del Group puede enviar una Work Proposal.
   Todavía no existe un WorkItem ejecutable.
3. **Autorizar.** El Coordinator actual, el MissionOwner mediante una anulación
   de emergencia o un Agent con una Delegation Grant válida y de alcance
   limitado crea el WorkItem.
4. **Ofrecer.** El Coordinator o el delegado con alcance limitado ofrece el
   WorkItem a un Worker elegible y registra la Selection Basis.
5. **Aceptar.** El Worker realiza el Admission Control. Una aceptación válida
   inicia un nuevo Ownership Epoch y coloca el WorkItem en la cola por Group de
   ese Worker.

:::note[La aceptación es un compromiso de planificación]

Aceptar una oferta no implica una ejecución inmediata. El Worker Scheduler tiene
el control final del orden entre Group e inicia el WorkItem cuando lo permiten
la capacidad, las dependencias, la política y la autorización.

:::

## El Work Contract

Cada WorkItem contiene un Work Contract versionado y legible por máquina. Este
registra:

- el objetivo, los entregables y los criterios de aceptación;
- la Evidence requerida y las referencias a entradas o dependencias;
- las herramientas, los datos, los recursos y las operaciones permitidos;
- las Capability requeridas, con sus identificadores y versiones;
- el plazo, la urgencia solicitada y el impacto para el negocio;
- los presupuestos financieros, de tokens, de llamadas a herramientas, de
  computación, de tiempo transcurrido y de efectos secundarios;
- los reintentos, el backoff, el plazo y la política de costes; y
- la clasificación de riesgo y cualquier requisito de Approval previa a la
  ejecución.

Toda ambigüedad esencial debe resolverse antes de la aceptación. Una revisión
material del contrato requiere que el Worker vuelva a aceptarlo.

## Una ruta habitual hacia el éxito

```text
Work Proposal
    ↓ authorize
open WorkItem
    ↓ offer
offered
    ↓ Worker accepts
queued
    ↓ valid ownership, approval gates, and Execution Lease
active
    ↓ Worker submits Artifacts and Evidence
submitted
    ↓ Coordinator accepts the result
verified
```

El trabajo activo puede guardar un Checkpoint y volver a `queued`, entrar en
`blocked` con un Checkpoint duradero, fallar con Evidence o cancelarse. Un
WorkItem bloqueado libera su Capacity Slot y después vuelve a una cola o se
ofrece de nuevo cuando caduca su Ownership Lease.

## Evidence antes de la Approval

La afirmación de un Worker no basta como prueba de finalización. El envío
incluye Artifact y Evidence vinculada a los criterios de aceptación. La revisión
del Coordinator debe validar la integridad de los Artifact, ejecutar
comprobaciones deterministas cuando estén disponibles, solicitar Evidence de un
Agent revisor para los criterios cualitativos y conservar el resultado.

Una vez verificados todos los WorkItem requeridos, el Coordinator presenta una
revisión concreta de la Mission y un conjunto de Artifact. El MissionOwner firma
la Approval final o solicita cambios. Una solicitud de cambios reabre la misma
Mission sin borrar los envíos anteriores.

Para consultar todas las transiciones y reglas de autoridad, lee las secciones
normativas sobre la
[máquina de estados de WorkItem](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#102-workitem-state-machine)
y la
[revisión basada en Evidence](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#132-evidence-based-review).
