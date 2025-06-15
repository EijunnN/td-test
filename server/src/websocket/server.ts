import { gameDataService } from "../game/services/GameDataService";
import { gameSessionManager } from "../game/services/GameService";
import { handleMessage } from "./handlers";
import type { S2C_GameJoinedPayload } from "@shared/types/events";
import type { PlayerConnection } from "../game/models/GameSession";

// Cargar los datos del juego al iniciar el servidor.
// Se usa un `await` en el nivel superior, una característica moderna de JS/TS.
await gameDataService.loadGameData();

// Define la configuración del servidor WebSocket.
const server = Bun.serve({
  port: 3001, // Usando el puerto 3001 para evitar conflictos con el servidor de desarrollo de Next.js (que suele ser 3000)

  fetch(req, server) {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin");

    // --- Manejo de CORS ---
    // Permitir cualquier origen para la demo.
    // En producción estricta, deberías poner aquí tu dominio de Vercel.
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // O "https://tu-dominio.vercel.app"
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Responder a las peticiones OPTIONS de pre-vuelo del navegador
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }
    // --- Fin de CORS ---

    // Manejar las solicitudes de actualización a WebSocket
    if (url.pathname === "/ws") {
      const nick =
        url.searchParams.get("nick") ||
        `user-${Math.random().toString(36).substring(7)}`;

      const success = server.upgrade(req, {
        headers: corsHeaders, // Añadir cabeceras CORS a la respuesta de upgrade
        data: {
          id: `player_${Math.random().toString(36).substring(2, 9)}`,
          nick: nick,
          gameSessionId: undefined, // Inicializar explícitamente
        },
      });

      if (success) return;

      return new Response("Falló la actualización a WebSocket", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Manejar solicitudes HTTP simples para comprobaciones de estado
    if (url.pathname === "/") {
      return new Response("Servidor de Tower Defense en funcionamiento.");
    }

    return new Response("No encontrado", { status: 404 });
  },

  websocket: {
    open(ws: PlayerConnection) {
      console.log(`Nueva conexión: ${ws.data.id} (${ws.data.nick})`);
      // La lógica de unión se ha movido a los manejadores de eventos.
      // El cliente debe enviar 'create_game' o 'join_game'.
    },
    message(ws: PlayerConnection, message) {
      // Delegar el manejo de mensajes al router
      handleMessage(ws, message);
    },
    close(ws: PlayerConnection) {
      console.log(`Conexión cerrada: ${ws.data.id} (${ws.data.nick})`);
      const session = gameSessionManager.findSession(ws.data.gameSessionId!);
      if (session) {
        session.removePlayer(ws.data.id);
        // Si la sesión queda vacía, la eliminamos.
        if (session.getPlayerCount() === 0) {
          gameSessionManager.removeSession(session.id);
        }
      }
    },
  },
});

console.log(
  `Servidor WebSocket de Tower Defense escuchando en el puerto ${server.port}...`
);
