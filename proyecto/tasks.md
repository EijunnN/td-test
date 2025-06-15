---

# **Plan de Trabajo: Tower Defense Cooperativo (tasks.md)**

**Versión:** 1.0
**Fecha:** 25 de Octubre de 2023

Este documento desglosa el desarrollo del juego en tareas específicas, asignando responsabilidades, prioridades y dependencias para asegurar un flujo de trabajo lógico y eficiente.

---

### **Épica 1: Fundación del Proyecto y Configuración Inicial**

_Estas tareas son la base de todo el proyecto y deben completarse primero._

| ID      | Responsable | Descripción de la Tarea                                               | Prioridad | Dependencias | Módulo/Componente Afectado                                  | Complejidad | Estado     |
| :------ | :---------- | :-------------------------------------------------------------------- | :-------- | :----------- | :---------------------------------------------------------- | :---------- | :--------- |
| **T01** | Backend     | Inicializar el proyecto y configurar el servidor Bun con WebSocket.   | Alta      | -            | `server/`, `server/src/websocket/server.ts`                 | Baja        | Completado |
| **T02** | Frontend    | Inicializar el proyecto frontend (Next.js/Vite) e instalar Shadcn/ui. | Alta      | -            | `client/`, `client/src/components/ui/`                      | Baja        | Completado |
| **T03** | Backend     | Definir tipos y esquemas compartidos para la comunicación.            | Alta      | -            | `shared/types/`, `shared/validation/`                       | Media       | Completado |
| **T04** | Backend     | Implementar la carga de datos del juego desde archivos JSON.          | Alta      | T01          | `server/data/`, `server/src/game/services/GameService.ts`   | Media       | Completado |
| **T05** | Backend     | Implementar la gestión de sesiones de juego (salas).                  | Alta      | T01, T03     | `server/src/game/services/GameService.ts`, `GameSession.ts` | Media       | Completado |
| **T06** | Backend     | Implementar las clases/modelos de las entidades del juego.            | Alta      | T03, T04     | `server/src/game/models/` (Player, Tower, Monster)          | Media       | Completado |
| **T07** | Backend     | Implementar el enrutador de eventos WebSocket.                        | Media     | T05, T06     | `server/src/websocket/handlers.ts`                          | Media       | Completado |
| **T08** | Backend     | Crear el motor del juego (Game Engine) con el bucle principal.        | Alta      | T06          | `server/src/game/engine/GameEngine.ts`                      | Alta        | Completado |
| **T09** | Backend     | Implementar la lógica de movimiento de monstruos.                     | Alta      | T08          | `server/src/game/engine/GameEngine.ts`                      | Alta        | Completado |
| **T10** | Backend     | Implementar la lógica de ataque de las torres.                        | Alta      | T08, T09     | `server/src/game/engine/GameEngine.ts`                      | Alta        | Completado |
| **T11** | Backend     | Implementar la generación de oleadas de monstruos.                    | Alta      | T08          | `server/src/game/engine/WaveSpawner.ts`                     | Media       | Completado |
| **T12** | Backend     | Implementar la lógica de daño y muerte.                               | Alta      | T09, T10     | `GameSession.ts`, `Monster.ts`                              | Media       | Completado |
| **T13** | Backend     | Implementar condiciones de victoria y derrota.                        | Media     | T12          | `server/src/game/models/GameSession.ts`                     | Media       | Completado |
| **T14** | Frontend    | Inicializar el proyecto del cliente con Next.js y Shadcn/ui.          | Alta      |              | `client/`                                                   | Baja        | Completado |

**Detalles de Implementación:**

- **T01:** Crear la estructura de directorios. Instalar Bun. Crear un `server.ts` básico que inicie un servidor WebSocket y escuche en un puerto.
- **T02:** Usar `create-next-app` o `create-vite`. Seguir la guía de instalación de Shadcn/ui para configurar los estilos y componentes base.
- **T03:** Crear interfaces de TypeScript en la carpeta `shared/` para `Player`, `Tower`, `Monster`, `GameState`, etc. Configurar Zod para validar los payloads de los eventos WebSocket.
- **T04:** Escribir una utilidad en el servidor que lea los archivos `monsters.json`, `towers.json` y `maps/*.json` al iniciar y los cargue en una estructura de datos accesible (ej. un `Map`).
- **T05:** Crear un servicio que pueda crear una nueva `GameSession`, asignarle un ID, y añadir/quitar jugadores.
- **T06:** Crear clases en TS para `Player` (con su oro), `Tower` (con su dueño y estadísticas), y `Monster` (con su HP y posición).
- **T07:** Escribir la lógica en el servidor para manejar `join_game` y `start_game`.
- **T08:** Configurar un `setInterval` que actúe como el "tick" del juego. Este bucle orquestará las demás lógicas del motor.
- **T09:** En cada tick, actualizar la posición de cada monstruo a lo largo de los waypoints de su camino definidos en los datos del mapa.
- **T10:** En cada tick, cada torre debe escanear en busca de monstruos dentro de su rango, seleccionar un objetivo y simular un disparo. Los proyectiles deben seguir a los objetivos.
- **T11:** Al final de cada tick, el motor debe generar un "snapshot" del estado (posiciones de monstruos, vidas, etc.) y enviarlo a todos los clientes en la sesión a través del evento `game_state_update`.

---

### **Épica 2: Lógica Central del Servidor**

_Implementación del motor y las reglas del juego. El corazón del backend._

| ID      | Responsable | Descripción de la Tarea                                          | Prioridad | Dependencias | Módulo/Componente Afectado                                  | Complejidad | Estado     |
| :------ | :---------- | :--------------------------------------------------------------- | :-------- | :----------- | :---------------------------------------------------------- | :---------- | :--------- |
| **T05** | Backend     | Implementar la gestión de sesiones de juego (salas).             | Alta      | T01, T03     | `server/src/game/services/GameService.ts`, `GameSession.ts` | Media       | Completado |
| **T06** | Backend     | Implementar las clases/modelos de las entidades del juego.       | Alta      | T03, T04     | `server/src/game/models/` (Player, Tower, Monster)          | Media       | Completado |
| **T07** | Backend     | Implementar los manejadores de eventos WebSocket básicos (C2S).  | Alta      | T05          | `server/src/websocket/handlers.ts`                          | Media       | Completado |
| **T08** | Backend     | Crear el motor del juego (Game Engine) con el bucle principal.   | Alta      | T06          | `server/src/game/engine/GameEngine.ts`                      | Alta        | Completado |
| **T09** | Backend     | Implementar la lógica de movimiento de monstruos.                | Alta      | T08          | `GameEngine.ts`                                             | Media       | Completado |
| **T10** | Backend     | Implementar la lógica de ataque de las torres y cálculo de daño. | Alta      | T08, T09     | `GameEngine.ts`                                             | Alta        | Completado |
| **T11** | Backend     | Implementar el envío del estado del juego a los clientes (S2C).  | Alta      | T08          | `GameEngine.ts`, `GameSession.ts`                           | Media       | Completado |

**Detalles de Implementación:**

- **T05:** Crear un servicio que pueda crear una nueva `GameSession`, asignarle un ID, y añadir/quitar jugadores.
- **T06:** Crear clases en TS para `Player` (con su oro), `Tower` (con su dueño y estadísticas), y `Monster` (con su HP y posición).
- **T07:** Escribir la lógica en el servidor para manejar `join_game` y `start_game`.
- **T08:** Configurar un `setInterval` que actúe como el "tick" del juego. Este bucle orquestará las demás lógicas del motor.
- **T09:** En cada tick, actualizar la posición de cada monstruo a lo largo de los waypoints de su camino definidos en los datos del mapa.
- **T10:** En cada tick, cada torre debe escanear en busca de monstruos dentro de su rango, seleccionar un objetivo y simular un disparo. Los proyectiles deben seguir a los objetivos.
- **T11:** Al final de cada tick, el motor debe generar un "snapshot" del estado (posiciones de monstruos, vidas, etc.) y enviarlo a todos los clientes en la sesión a través del evento `game_state_update`.

---

### **Épica 3: Visualización y Conexión del Frontend**

_Hacer que el frontend se conecte al backend y muestre el estado del juego._

| ID      | Responsable | Descripción de la Tarea                                                     | Prioridad | Dependencias  | Módulo/Componente Afectado                 | Complejidad | Estado     |
| :------ | :---------- | :-------------------------------------------------------------------------- | :-------- | :------------ | :----------------------------------------- | :---------- | :--------- |
| **T12** | Frontend    | Crear el servicio WebSocket para conectar con el servidor.                  | Alta      | T07           | `client/src/services/websocketService.ts`  | Media       | Completado |
| **T13** | Frontend    | Implementar el gestor de estado (Zustand/Jotai).                            | Alta      | T03, T12      | `client/src/state/gameStore.ts`            | Media       | Completado |
| **T14** | Frontend    | Crear la vista principal del juego y el componente Canvas.                  | Alta      | T13           | `client/app/page.tsx`, `GameCanvas.tsx`    | Media       | Completado |
| **T15** | Frontend    | Renderizar el mapa, monstruos y torres en el Canvas.                        | Alta      | T11, T14      | `GameCanvas.tsx`                           | Alta        | Completado |
| **T16** | Frontend    | Implementar el HUD (Vidas, Oro, Oleada).                                    | Alta      | T13           | `client/src/components/game/HUD.tsx`       | Baja        | Completado |
| **T17** | Frontend    | Diseñar e implementar la UI de la Tienda de Torres.                         | Media     | T13, T16      | `client/src/components/game/TowerShop.tsx` | Media       | Completado |
| **T18** | Backend     | Implementar la lógica para construir torres (validación de oro y posición). | Media     | T07, T10      | `handlers.ts`, `GameSession.ts`            | Media       | Completado |
| **T19** | Frontend    | Implementar la acción de construir una torre desde la UI.                   | Media     | T12, T17, T18 | `TowerShop.tsx`, `GameCanvas.tsx`          | Media       | Completado |
| **T20** | Backend     | Implementar la lógica para mejorar y vender torres.                         | Media     | T18           | `handlers.ts`, `GameSession.ts`            | Media       | Completado |
| **T21** | Frontend    | Implementar la UI para seleccionar y vender/mejorar torres.                 | Media     | T19, T20      | `GameCanvas.tsx`, `HUD.tsx`                | Media       | Completado |
| **T22** | Ambos       | Implementar el sistema de Chat en tiempo real.                              | Media     | T07, T12      | `ChatBox.tsx`, `handlers.ts`               | Media       | Completado |
| **T23** | Backend     | Implementar las condiciones de victoria y derrota.                          | Media     | T10           | `GameEngine.ts`, `GameSession.ts`          | Baja        | Completado |
| **T24** | Frontend    | Implementar las pantallas de Victoria/Derrota.                              | Media     | T23           | `client/components/game/EndScreen.tsx`     | Baja        | Completado |

**Detalles de Implementación:**

- **T12:** Escribir una clase o conjunto de funciones que manejen la conexión, envío y recepción de eventos WebSocket.
- **T13:** Configurar el store para que guarde el estado del juego recibido del servidor. `websocketService` llamará a acciones de este store para actualizar los datos.
- **T14:** Montar la estructura básica de la página del juego, incluyendo el componente `GameCanvas` y el `HUD`.
- **T15:** Escribir la lógica de renderizado dentro de `GameCanvas` que lea el `gameStore` y dibuje cada entidad en su posición correcta.
- **T16:** Crear componentes React simples que se suscriban al `gameStore` y muestren los valores numéricos correspondientes.
- **T17:** Usar `Sheet` y `Card` de Shadcn para mostrar las torres disponibles (cargadas desde el `gameStore`).
- **T18:** El manejador `handleBuildTower` debe verificar el oro del jugador y que la ubicación no esté ocupada.
- **T19:** Permitir al jugador seleccionar una torre en la tienda y luego hacer clic en el canvas para enviar el evento `build_tower`.
- **T20:** Crear los manejadores `handleUpgradeTower` y `handleSellTower` que apliquen la lógica y actualicen el oro del jugador.
- **T21:** Al hacer clic en una torre propia en el canvas, mostrar botones de "Mejorar" y "Vender" en el HUD.
- **T22:** Crear el componente de UI del chat y los eventos `send_chat_message` (C2S) y `chat_message_received` (S2C).
- **T23:** En el bucle del juego, comprobar si las vidas son <= 0 o si la última oleada fue derrotada.
- **T24:** Mostrar un modal o una pantalla completa al recibir el evento `game_over` del servidor.
