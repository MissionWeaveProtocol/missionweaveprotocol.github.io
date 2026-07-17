---
title: Child Mission
description:
  Descomposición recursiva de WorkItem complejos en Mission Group acotados sin
  perder alcance, presupuesto, Evidence ni responsabilidad humana.
sidebar:
  order: 6
---

:::caution[Draft Standard 0.1]

Esta es una guía de aprendizaje no normativa. El
[repositorio canónico del protocolo](https://github.com/missionweaveprotocol/missionweaveprotocol)
sigue siendo normativo.

:::

Un WorkItem suficientemente complejo puede convertirse en una **Child Mission**.
La Child Mission tiene su propio Group, Coordinator, grafo de WorkItem,
Membership, presupuesto, plazo y política de Approval. El WorkItem padre y la
Child Mission se enlazan entre sí.

```text
Root Mission and Group
└── parent WorkItem becomes blocked
    └── Child Mission and its own Group
        ├── child Coordinator
        ├── child WorkItems and Evidence
        └── child Approval
            └── result returns as Evidence and Artifacts
                for the parent WorkItem
```

:::note[Una Mission sigue teniendo un solo Group]

Crear una Child Mission no convierte el Group padre en una sala de chat anidada.
La Child Mission recibe un Group separado y comparte con su elemento padre
únicamente resúmenes autorizados, Artifact, Evidence y enlaces estables.

:::

## Autoridad y Approval

De forma predeterminada, el Coordinator de la Child Mission revisa y presenta el
resultado. El Parent Coordinator actúa como MissionOwner de la Child Mission y
la aprueba en nombre del WorkItem padre. La política de riesgo de la
Organization puede exigir además Approval humana directa.

El resultado aprobado de la Child Mission se convierte en Evidence y Artifact
para el WorkItem padre. El Parent Coordinator recibe cambios de estado,
resúmenes, estimaciones revisadas, bloqueos, escalados de presupuesto o de
política y resultados finales.

No necesita todos los Message de esa Child Mission. Sin embargo, conserva acceso
autorizado para inspeccionarlos cuando sea necesario. El MissionOwner raíz puede
inspeccionar el árbol completo de Mission.

## El alcance se reduce hacia abajo

El grafo padre-hijo debe permanecer acíclico. El presupuesto, el plazo, las
Capability, el acceso a datos y los permisos de una Child Mission deben ser
subconjuntos de los de su elemento padre. Cada Organization configura una
profundidad máxima predeterminada y exige la Approval explícita del MissionOwner
o del actor de política cuando se supera ese umbral.

El límite de profundidad es una protección, no un techo fijo. El trabajo
complejo legítimo puede continuar después de que una Approval explícita conceda
el alcance o la profundidad adicionales.

## El fallo no hace fracasar automáticamente al elemento padre

Una Child Mission fallida emite Evidence estructurada del fallo y bloquea o hace
fallar el WorkItem padre según su política declarada. El Parent Coordinator
puede replanificar, revisar el alcance, crear una Child Mission de reemplazo o
cancelar la rama. El fallo se propaga automáticamente solo cuando la política de
finalización del padre declara indispensable a esa Child Mission y no ofrece
ninguna alternativa.

## ¿Child Mission o Follow-up Mission?

- Usa una **Child Mission** para completar un WorkItem complejo dentro de una
  Mission padre activa.
- Usa una **Follow-up Mission** para correcciones, remediación o trabajo
  adicional después de que una Mission aprobada se haya vuelto inmutable.

Para consultar todas las reglas, lee las secciones normativas sobre
[Mission padre y Child Mission](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#14-parent-and-child-missions)
y
[ciclo de vida de Mission](https://github.com/missionweaveprotocol/missionweaveprotocol/blob/main/spec/PROTOCOL.md#7-mission-and-group-lifecycle).
