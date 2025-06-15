---

# **Documento de Arquitectura: Tower Defense Cooperativo**

**Versión:** 1.0
**Fecha:** 25 de Octubre de 2023

## 1. Arquitectura General y Principios de Diseño

Este documento describe la arquitectura técnica para el juego Tower Defense cooperativo. La arquitectura se basa en un modelo **Cliente-Servidor Autoritativo**, donde el backend (servidor) es la única fuente de la verdad para toda la lógica y el estado del juego. Esto es crucial para prevenir trampas y asegurar una experiencia consistente para todos los jugadores.

*   **Backend:** Un servidor WebSocket construido con **Bun**. Gestionará todas las sesiones de juego, la lógica de las oleadas, el comportamiento de las torres y monstruos, y la sincronización del estado entre los clientes.
*   **Frontend:** Una Single Page Application (SPA) construida con un framework moderno como **Next.js** o **Vite+React**, utilizando **Shadcn/ui** para los componentes de la interfaz. Se comunicará exclusivamente con el backend a través de una conexión WebSocket persistente.
*   **Fuente de Datos del Juego:** Los datos de configuración (torres, monstruos, mapas) se cargarán desde archivos **JSON locales** en el servidor al iniciar, permitiendo un balanceo y expansión rápidos sin necesidad de tocar el código fuente.
*   **Persistencia de Datos (v1.0):** De acuerdo con el PRD, la v1.0 se centra en la sesión de juego única. **No se requiere una base de datos persistente para esta versión**, ya que no hay cuentas de usuario ni progresión entre partidas. El estado del juego vive y muere con la sesión en la memoria del servidor. Se diseñará una estructura para una futura integración de base de datos.

---

## 2. Estructura de Directorios Detallada

La estructura del proyecto estará organizada para separar claramente las responsabilidades del cliente y del servidor, permitiendo un desarrollo independiente.

```plaintext
tower-defense-coop/
├── client/                     # Frontend (Next.js / Vite + React)
│   ├── public/                 # Assets estáticos (iconos, sprites, fuentes)
│   ├── src/
│   │   ├── app/                # O pages/ en Next.js (Rutas y Vistas)
│   │   ├── components/
│   │   │   ├── ui/             # Componentes generados por Shadcn (Button, Card, Sheet...)
│   │   │   ├── game/           # Componentes específicos del juego
│   │   │   │   ├── GameCanvas.tsx  # Renderiza el mapa, torres, monstruos
│   │   │   │   ├── HUD.tsx         # Heads-Up Display (Vidas, Oro, Oleada)
│   │   │   │   ├── TowerShop.tsx   # Interfaz de la tienda de torres
│   │   │   │   └── ChatBox.tsx     # Componente del chat
│   │   │   └── common/           # Componentes reutilizables (Layout, LoadingSpinner)
│   │   ├── hooks/                # Hooks de React personalizados (e.g., useGameStore)
│   │   ├── services/
│   │   │   └── websocketService.ts # Lógica para conectar y gestionar la comunicación WebSocket
│   │   ├── state/
│   │   │   └── gameStore.ts      # Gestor de estado (Zustand/Jotai) para el estado del juego
│   │   ├── styles/               # Estilos globales
│   │   └── lib/                  # O utils/ (Funciones de utilidad, constantes)
│   └── package.json              # Dependencias del frontend
│
├── server/                     # Backend (Bun + WebSocket)
│   ├── data/
│   │   ├── monsters.json       # Definiciones de los monstruos
│   │   ├── towers.json         # Definiciones de las torres y sus mejoras
│   │   └── maps/
│   │       └── canyon.json     # Definición del mapa, caminos, portales, etc.
│   ├── src/
│   │   ├── game/
│   │   │   ├── engine/
│   │   │   │   └── GameEngine.ts # El corazón: bucle del juego, física, lógica de ticks
│   │   │   ├── models/           # Clases que representan entidades en tiempo de ejecución
│   │   │   │   ├── GameSession.ts
│   │   │   │   ├── Player.ts
│   │   │   │   ├── Tower.ts
│   │   │   │   └── Monster.ts
│   │   │   └── services/
│   │   │       └── GameService.ts  # Gestiona la creación y ciclo de vida de las GameSessions
│   │   ├── websocket/
│   │   │   ├── handlers.ts     # Manejadores para cada tipo de mensaje C2S
│   │   │   └── server.ts       # Configuración y arranque del servidor WebSocket
│   │   └── utils/                # Funciones de utilidad para el servidor
│   └── package.json              # Dependencias del backend
│
├── shared/                     # Código compartido entre cliente y servidor
│   ├── types/                    # Definiciones de tipos de TypeScript (e.g., GameState, Player)
│   └── validation/             # Esquemas de validación (Zod) para los mensajes de la API
│
└── package.json                # Script raíz para correr cliente y servidor a la vez
```

---

## 3. Descripción de Componentes Clave

#### Backend (server/)

*   **`server/src/websocket/server.ts`**: Punto de entrada del backend. Inicia el servidor Bun, abre el socket WebSocket y escucha las conexiones entrantes. Delega los nuevos jugadores al `GameService`.
*   **`server/src/game/services/GameService.ts`**: Orquestador de alto nivel. Mantiene un registro de todas las `GameSession` activas. Se encarga de crear nuevas sesiones (salas), añadir jugadores a ellas y destruirlas cuando terminan.
*   **`server/src/game/models/GameSession.ts`**: Representa una única partida. Contiene el estado completo de esa partida: el mapa, la lista de jugadores, las vidas compartidas, el número de oleada, y una instancia del `GameEngine`.
*   **`server/src/game/engine/GameEngine.ts`**: El motor del juego. Se ejecuta en un bucle (`setInterval` o similar) que representa los "ticks" del juego. En cada tick, se encarga de:
    1.  Mover los monstruos por sus caminos.
    2.  Hacer que las torres busquen objetivos y disparen.
    3.  Calcular colisiones de proyectiles y aplicar daño.
    4.  Comprobar condiciones de victoria/derrota.
    5.  Generar un "snapshot" del estado para enviar a los clientes.
*   **`server/src/websocket/handlers.ts`**: Contiene funciones que procesan los mensajes recibidos de los clientes (C2S), como `handleBuildTower` o `handleSendMessage`. Validan la acción y llaman a los métodos correspondientes en la `GameSession` del jugador.

#### Frontend (client/)

*   **`client/src/services/websocketService.ts`**: Encapsula toda la lógica de la API WebSocket. Establece la conexión, envía mensajes formateados al servidor y escucha los mensajes entrantes. Llama a las acciones del gestor de estado cuando recibe datos del servidor.
*   **`client/src/state/gameStore.ts`**: El estado global de la aplicación del lado del cliente, gestionado con una librería como **Zustand**. Almacena la representación local del estado del juego (posiciones de monstruos, oro del jugador, etc.). Los componentes de React se suscribirán a este store para re-renderizarse cuando cambie el estado.
*   **`client/src/components/game/GameCanvas.tsx`**: El componente de renderizado principal. Utilizará **HTML5 Canvas** o una librería como **Pixi.js** para dibujar el estado del juego (mapa, torres, monstruos, proyectiles) de forma eficiente, basándose en los datos del `gameStore`.
*   **`client/src/components/game/HUD.tsx`**: Muestra la información crítica de la partida (oro, vidas, oleada). Se suscribe directamente al `gameStore` para estar siempre actualizado.
*   **`client/src/components/game/TowerShop.tsx`**: Renderiza la tienda basándose en los datos de las torres recibidos del servidor. Cuando el jugador hace clic para comprar, invoca una función en `websocketService` para enviar el evento `build_tower` al servidor.

---

## 4. Diseño de API (Comunicación WebSocket)

La comunicación no es RESTful, sino **basada en eventos sobre un WebSocket**. Todos los mensajes, en ambas direcciones, seguirán un formato JSON estandarizado y serán validados con esquemas de Zod (definidos en `shared/validation`).

**Formato de Mensaje:**
```json
{
  "type": "NOMBRE_DEL_EVENTO",
  "payload": { ... }
}
```

### Eventos Cliente -> Servidor (C2S - Acciones del Jugador)

*   `{ type: "join_game", payload: { roomId: "AB12" } }`
*   `{ type: "start_game", payload: {} }` (Solo el anfitrión)
*   `{ type: "build_tower", payload: { towerId: "arrow_tower_1", position: { x: 100, y: 250 } } }`
*   `{ type: "upgrade_tower", payload: { towerInstanceId: "uuid-1234-abcd" } }`
*   `{ type: "sell_tower", payload: { towerInstanceId: "uuid-1234-abcd" } }`
*   `{ type: "send_chat_message", payload: { message: "¡Cuidado por el camino norte!" } }`

### Eventos Servidor -> Cliente (S2C - Actualizaciones de Estado)

*   `{ type: "game_joined", payload: { gameState, playerId, isHost } }` (Enviado a un jugador cuando se une)
*   `{ type: "game_state_update", payload: { monsters: [...], lives: 18, wave: 3 } }` (Enviado en cada tick a todos los jugadores)
*   `{ type: "player_state_update", payload: { gold: 500 } }` (Enviado a un jugador específico cuando su estado personal cambia)
*   `{ type: "tower_placed", payload: { towerData } }` (Broadcast a todos para que rendericen una nueva torre)
*   `{ type: "game_over", payload: { reason: "victory" | "defeat", stats: {...} } }`
*   `{ type: "chat_message_received", payload: { fromPlayer: "PlayerName", message: "..." } }`
*   `{ type: "error_message", payload: { message: "Oro insuficiente." } }` (Enviado a un jugador específico)

---

## 5. Esquema de la Base de Datos

### v1.0: Sin Base de Datos

Como se definió en los principios, la v1.0 no requiere una base de datos persistente. Todo el estado del juego se maneja en la memoria del servidor y se pierde al finalizar la sesión.

### Consideraciones para Futuras Versiones (Post-v1.0)

Para implementar funcionalidades futuras como cuentas de usuario, progresión y tablas de clasificación, se podría introducir una base de datos (ej. **PostgreSQL** o **SQLite** con Bun). La arquitectura estaría preparada para ello. El esquema podría ser el siguiente:

**Tabla `Users`**
*   `id` (UUID, PK)
*   `username` (VARCHAR(255), UNIQUE, NOT NULL)
*   `password_hash` (VARCHAR(255), NOT NULL)
*   `created_at` (TIMESTAMP, DEFAULT NOW())

**Tabla `GameStats`**
*   `id` (UUID, PK)
*   `user_id` (UUID, FK a `Users.id`, NOT NULL)
*   `map_id` (VARCHAR(255), NOT NULL)
*   `waves_survived` (INTEGER, NOT NULL)
*   `monsters_killed` (INTEGER, NOT NULL)
*   `gold_spent` (INTEGER, NOT NULL)
*   `is_victory` (BOOLEAN, NOT NULL)
*   `played_at` (TIMESTAMP, DEFAULT NOW())
*   `INDEX` en `user_id` para buscar rápidamente el historial de un jugador.

La integración se realizaría en el `GameService`. Al finalizar una `GameSession`, se tomarían las estadísticas finales y se insertarían en la tabla `GameStats` para cada jugador involucrado.