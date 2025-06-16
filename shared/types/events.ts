import { GameState } from "./GameState";
import { Position, Tower } from "./entities";

/**
 * --- Eventos Cliente -> Servidor (C2S) ---
 * Acciones que un jugador envía al servidor.
 */

export interface C2S_JoinGamePayload {
  roomId: string;
}

export interface C2S_BuildTowerPayload {
  towerId: string; // ej. "arrow_tower_1"
  position: Position;
}

export interface C2S_UpgradeTowerPayload {
  towerInstanceId: string;
}

export interface C2S_SellTowerPayload {
  towerInstanceId: string;
}

export interface C2S_SendChatMessagePayload {
  message: string;
}

/**
 * --- Eventos Servidor -> Cliente (S2C) ---
 * Actualizaciones y notificaciones que el servidor envía a los clientes.
 */

export interface S2C_GameJoinedPayload {
  gameState: GameState;
  playerId: string; // Tu ID de jugador
  isHost: boolean;
}

export interface S2C_PlayerStateUpdatePayload {
  // Actualización específica para un jugador, como su oro.
  playerId: string;
  gold: number;
}

export interface S2C_TowerPlacedPayload {
  tower: Tower;
}

export interface S2C_TowerUpgradedPayload {
  tower: Tower;
}

export interface S2C_TowerSoldPayload {
  towerInstanceId: string;
}

export interface S2C_GameOverPayload {
  reason: "victory" | "defeat";
  // stats: any; // Se puede definir más adelante
}

export interface S2C_ChatMessageReceivedPayload {
  fromPlayer: string; // Nick del jugador
  message: string;
  timestamp: number;
}

export interface S2C_ErrorMessagePayload {
  message: string;
}
