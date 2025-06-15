import type { GameState } from "./GameState";
import type {
  C2S_BuildTowerPayload,
  C2S_JoinGamePayload,
  C2S_SellTowerPayload,
  C2S_SendChatMessagePayload,
  C2S_UpgradeTowerPayload,
  S2C_ChatMessageReceivedPayload,
  S2C_ErrorMessagePayload,
  S2C_GameJoinedPayload,
  S2C_GameOverPayload,
  S2C_PlayerStateUpdatePayload,
  S2C_TowerPlacedPayload,
  S2C_TowerSoldPayload,
  S2C_TowerUpgradedPayload,
} from "./events";

// --- Eventos Cliente -> Servidor (C2S) ---

export interface C2S_Events {
  start_game: (payload?: {}) => void;
  create_game: (payload?: {}) => void;
  join_game: (payload: C2S_JoinGamePayload) => void;
  build_tower: (payload: C2S_BuildTowerPayload) => void;
  upgrade_tower: (payload: C2S_UpgradeTowerPayload) => void;
  sell_tower: (payload: C2S_SellTowerPayload) => void;
  send_chat_message: (payload: C2S_SendChatMessagePayload) => void;
}

export type C2S_Event = keyof C2S_Events;

// --- Eventos Servidor -> Cliente (S2C) ---

export interface S2C_Events {
  connect: (payload?: {}) => void;
  disconnect: (payload?: {}) => void;
  error_message: (payload: S2C_ErrorMessagePayload) => void;
  game_joined: (payload: S2C_GameJoinedPayload) => void;
  game_state_update: (payload: GameState) => void;
  game_started: (payload?: {}) => void;
  game_over: (payload: S2C_GameOverPayload) => void;
  system_message: (payload: { message: string }) => void;
  tower_placed: (payload: S2C_TowerPlacedPayload) => void;
  tower_upgraded: (payload: S2C_TowerUpgradedPayload) => void;
  tower_sold: (payload: S2C_TowerSoldPayload) => void;
  player_state_update: (payload: S2C_PlayerStateUpdatePayload) => void;
  chat_message_received: (payload: S2C_ChatMessageReceivedPayload) => void;
}

export type S2C_Event = keyof S2C_Events;

// --- Mapeo de Payloads ---

export type C2S_Payload<T extends C2S_Event> = Parameters<C2S_Events[T]>[0];
export type S2C_Payload<T extends S2C_Event> = Parameters<S2C_Events[T]>[0];
