---
title: SDK
description:
  Elige un SDK oficial de MissionWeaveProtocol y conoce su alcance actual de
  conformidad.
sidebar:
  label: Resumen
  order: 1
---

MissionWeaveProtocol ofrece una implementación de referencia completa en Python
y cinco SDK oficiales del protocolo. Cada SDK se versiona de forma independiente
y fija el commit exacto del protocolo y los digests de los Artifact que
implementa. Las cifras siguientes corresponden al commit del protocolo
[`6f10987`](https://github.com/missionweaveprotocol/missionweaveprotocol/commit/6f10987627d62fb296e3490ceceb5539b1e94b70).

## Matriz de capacidades y estado

| SDK                                                                  | Alcance actual                        | Bindings del protocolo | Conformidad de schemas y vectores | Runtime de comportamiento completo |
| -------------------------------------------------------------------- | ------------------------------------- | ---------------------- | --------------------------------- | ---------------------------------- |
| [Python](https://github.com/missionweaveprotocol/python-sdk)         | Implementación de referencia completa | Sí                     | 52/52 vectores                    | Sí                                 |
| [Go](https://github.com/missionweaveprotocol/go-sdk)                 | SDK oficial del protocolo             | Sí                     | 52/52 vectores                    | No                                 |
| [TypeScript](https://github.com/missionweaveprotocol/typescript-sdk) | SDK oficial del protocolo             | Sí                     | 52/52 vectores                    | No                                 |
| [Java](https://github.com/missionweaveprotocol/java-sdk)             | SDK oficial del protocolo             | Sí                     | 52/52 vectores                    | No                                 |
| [Rust](https://github.com/missionweaveprotocol/rust-sdk)             | SDK oficial del protocolo             | Sí                     | 52/52 vectores                    | No                                 |
| [C++](https://github.com/missionweaveprotocol/cpp-sdk)               | SDK oficial del protocolo             | Sí                     | 52/52 vectores                    | No                                 |

La conformidad de schemas y vectores cubre el procesamiento JSON estricto, la
validación offline con los 21 schemas Draft 2020-12 fijados, JSON canónico e ID
de contenido, firmas Ed25519, validación de Frame y los 52 vectores de
conformidad fijados. Por sí sola no demuestra la conformidad de la
planificación, la persistencia, la recuperación, el transporte ni otros
comportamientos del runtime.

## Elegir un SDK

Usa la [guía de Python SDK](./python/) si necesitas el runtime de referencia
completo, incluidos Core, runtime de Agent, Worker Scheduler, gateway de Group,
adaptadores de almacenamiento y POC ejecutable.

Usa el repositorio de Go, TypeScript, Java, Rust o C++ si necesitas bindings
nativos del protocolo, validación, canonicalización, firma y Frame Codec. Los
comandos de instalación y verificación se mantienen en el README de cada
repositorio. La especificación del protocolo y los Artifact de conformidad
siguen siendo normativos.
