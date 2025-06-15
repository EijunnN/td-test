import type { ServerWebSocket } from "bun";
import { gameSessionManager } from "../game/services/GameService";
import type { C2S_Event, C2S_Payload } from "@shared/types/socket";
import type {
  C2S_BuildTowerPayload,
  S2C_GameJoinedPayload,
  C2S_JoinGamePayload,
  C2S_SellTowerPayload,
  C2S_UpgradeTowerPayload,
  C2S_SendChatMessagePayload,
} from "@shared/types/events";
import type { PlayerConnection } from "../game/models/GameSession";

// --- Manejadores Específicos ---

function handleCreateGame(
  ws: PlayerConnection,
  payload: C2S_Payload<"create_game">
) {
  const session = gameSessionManager.createSession(ws, "canyon_of_echoes");
  const response: S2C_GameJoinedPayload = {
    gameState: session.getGameStateForClient(),
    playerId: ws.data.id,
    isHost: true,
  };
  ws.send(JSON.stringify({ type: "game_joined", payload: response }));
}

function handleJoinGame(
  ws: PlayerConnection,
  payload: C2S_Payload<"join_game">
) {
  const session = gameSessionManager.joinSession(payload.roomId, ws);
  if (session) {
    const response: S2C_GameJoinedPayload = {
      gameState: session.getGameStateForClient(),
      playerId: ws.data.id,
      isHost: session.hostId === ws.data.id,
    };
    ws.send(JSON.stringify({ type: "game_joined", payload: response }));
  } else {
    // TODO: Enviar mensaje de error al cliente
    console.error(
      `Jugador ${ws.data.nick} no pudo unirse a la sala ${payload.roomId}`
    );
  }
}

function handleStartGame(
  ws: PlayerConnection,
  payload: C2S_Payload<"start_game">
) {
  const session = gameSessionManager.findSession(ws.data.gameSessionId!);
  if (session) {
    session.startGame(ws.data.id);
  }
}

function handleBuildTower(
  ws: PlayerConnection,
  payload: C2S_BuildTowerPayload
) {
  const session = gameSessionManager.findSession(ws.data.gameSessionId!);
  if (session) {
    session.buildTower(ws.data.id, payload.towerId, payload.position);
  }
}

function handleUpgradeTower(
  ws: PlayerConnection,
  payload: C2S_UpgradeTowerPayload
) {
  const session = gameSessionManager.findSession(ws.data.gameSessionId!);
  if (session) {
    session.upgradeTower(ws.data.id, payload.towerInstanceId);
  }
}

function handleSellTower(ws: PlayerConnection, payload: C2S_SellTowerPayload) {
  const session = gameSessionManager.findSession(ws.data.gameSessionId!);
  if (session) {
    session.sellTower(ws.data.id, payload.towerInstanceId);
  }
}

function handleSendChatMessage(
  ws: PlayerConnection,
  payload: C2S_SendChatMessagePayload
) {
  const session = gameSessionManager.findSession(ws.data.gameSessionId!);
  if (session) {
    session.handleChatMessage(ws.data.id, payload.message);
  }
}

// --- Router Principal de Mensajes ---

type MessageHandlers = {
  [K in C2S_Event]?: (ws: PlayerConnection, payload: C2S_Payload<K>) => void;
};

const messageHandlers: MessageHandlers = {
  create_game: handleCreateGame,
  join_game: handleJoinGame,
  start_game: handleStartGame,
  build_tower: handleBuildTower,
  upgrade_tower: handleUpgradeTower,
  sell_tower: handleSellTower,
  send_chat_message: handleSendChatMessage,
  // 'send_chat_message': handleSendChatMessage, (T22)
};

export function handleMessage(
  ws: PlayerConnection,
  rawMessage: string | Buffer
) {
  try {
    const message: { type: C2S_Event; payload: any } = JSON.parse(
      rawMessage.toString()
    );
    const { type, payload } = message;

    if (typeof type !== "string") {
      throw new Error("El tipo de mensaje no es un string válido.");
    }

    const handler = messageHandlers[type];
    if (handler) {
      handler(ws, payload);
    } else {
      console.warn(
        `No se encontró un manejador para el tipo de mensaje: ${type}`
      );
    }
  } catch (error) {
    console.error("Error al procesar el mensaje del WebSocket:", error);
    // Opcional: enviar un mensaje de error de vuelta al cliente
    // ws.send(JSON.stringify({ type: 'error', payload: { message: 'Mensaje inválido.' }}));
  }
}
