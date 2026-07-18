---
title: Subtarea
description:
  Descomposición recursiva de WorkItem complejos mediante subtareas acotadas y
  con Group propio, sin perder alcance, presupuesto, Evidence ni responsabilidad
  humana.
sidebar:
  order: 6
---

:::caution[Estándar en borrador 0.1]

Esta es una guía de aprendizaje no normativa. El
[repositorio canónico del protocolo](https://github.com/missionweaveprotocol/missionweaveprotocol)
sigue siendo normativo.

:::

Un WorkItem suficientemente complejo puede convertirse en una **subtarea (Child
Mission)**. Aquí, «subtarea» designa una Mission independiente: no es un
WorkItem. Tiene su propio Group, Coordinator, grafo de WorkItem, Membership,
presupuesto, plazo y política de Approval. El WorkItem padre y la subtarea se
enlazan entre sí.

```text
Mission y Group raíz
└── el WorkItem padre pasa a `blocked`
    └── subtarea con su propio Group
        ├── Coordinator de la subtarea
        ├── WorkItem de la subtarea y Evidence
        └── Approval de la subtarea
            └── el resultado vuelve como Evidence y Artifact
                para el WorkItem padre
```

:::note[Una Mission sigue teniendo un solo Group]

Crear una subtarea no convierte el Group padre en una sala de chat anidada. La
subtarea recibe un Group separado y comparte con la Mission padre únicamente
resúmenes autorizados, Artifact, Evidence y enlaces estables.

:::

## Autoridad y Approval

De forma predeterminada, el Coordinator de la subtarea revisa y presenta el
resultado. El Coordinator de la Mission padre actúa como MissionOwner de la
subtarea y la aprueba en nombre del WorkItem padre. La política de riesgo de la
Organization puede exigir además Approval humana directa.

El resultado aprobado de la subtarea se convierte en Evidence y Artifact para el
WorkItem padre. El Coordinator de la Mission padre recibe cambios de estado,
resúmenes, estimaciones revisadas, bloqueos, escalados de presupuesto o de
política y resultados finales. No necesita todos los Message de la subtarea,
pero conserva acceso autorizado para inspeccionarlos cuando sea necesario. El
MissionOwner raíz puede inspeccionar el árbol completo de Mission.

## El alcance se reduce hacia abajo

El grafo padre-hijo debe permanecer acíclico. El presupuesto, el plazo, las
Capability, el acceso a datos y los permisos de una subtarea deben ser
subconjuntos de los de la Mission padre. Cada Organization configura una
profundidad máxima predeterminada y exige una Approval explícita del
MissionOwner o conforme a la política cuando se supera ese umbral.

El límite de profundidad es una protección, no un techo fijo. El trabajo
complejo legítimo puede continuar después de que una Approval explícita conceda
el alcance o la profundidad adicionales.

## El fallo no hace fracasar automáticamente al WorkItem padre

Una subtarea fallida emite Evidence estructurada del fallo y bloquea o hace
fallar el WorkItem padre según su política declarada. El Coordinator de la
Mission padre puede replanificar, revisar el alcance, crear una subtarea de
reemplazo o cancelar la rama. El fallo se propaga automáticamente solo cuando la
política de finalización del WorkItem padre declara indispensable a esa subtarea
y no ofrece ninguna alternativa.

## ¿Subtarea o Follow-up Mission?

- Usa una **subtarea** para completar un WorkItem complejo dentro de una Mission
  padre activa.
- Usa una **Follow-up Mission** para correcciones, remediación o trabajo
  adicional después de que una Mission aprobada se haya vuelto inmutable.

Para consultar todas las reglas, lee las secciones normativas sobre
[Mission padre y subtarea](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#14-parent-and-child-missions)
y
[ciclo de vida de Mission](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#7-mission-and-group-lifecycle).
