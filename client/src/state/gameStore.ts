import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  S2C_GameJoinedPayload,
  S2C_ChatMessageReceivedPayload,
  S2C_PlayerStateUpdatePayload,
} from "@shared/types/events";
import type { GameState } from "@shared/types/GameState";
import type { Player, Tower, TowerDefinition } from "@shared/types/entities";

interface GameStoreState {
  gameState: GameState | null;
  playerId: string | null;
  isHost: boolean;
  selectedTowerId: string | null;
  towerToBuild: TowerDefinition | null;
  chatMessages: S2C_ChatMessageReceivedPayload[];
  gameOverReason: "victory" | "defeat" | null;
}

interface GameStoreActions {
  setInitialState: (payload: {
    gameState: GameState | null;
    playerId: string | null;
    isHost: boolean;
  }) => void;
  setGameState: (gameState: GameState) => void;
  setGameJoined: (payload: S2C_GameJoinedPayload) => void;
  setGameOver: (reason: "victory" | "defeat") => void;
  selectTower: (towerId: string | null) => void;
  setTowerToBuild: (towerDef: TowerDefinition | null) => void;
  handleChatMessageReceived: (payload: S2C_ChatMessageReceivedPayload) => void;
  handleTowerPlaced: (tower: Tower) => void;
  handleTowerUpgraded: (tower: Tower) => void;
  handleTowerSold: (towerInstanceId: string) => void;
  handlePlayerStateUpdate: (payload: S2C_PlayerStateUpdatePayload) => void;
}

type GameStore = GameStoreState & GameStoreActions;

const initialState: GameStoreState = {
  gameState: null,
  playerId: null,
  isHost: false,
  selectedTowerId: null,
  towerToBuild: null,
  chatMessages: [],
  gameOverReason: null,
};

export const useGameStore = create<GameStore>()(
  devtools(
    (set) => ({
      ...initialState,
      setInitialState: (payload) => set(payload),
      setGameState: (gameState) => set({ gameState }),
      setGameJoined: (payload) =>
        set({
          gameState: payload.gameState,
          playerId: payload.playerId,
          isHost: payload.isHost,
        }),
      setGameOver: (reason) =>
        set((state) => ({
          gameOverReason: reason,
          gameState: state.gameState
            ? { ...state.gameState, status: "finished" }
            : null,
        })),
      selectTower: (towerId) =>
        set({ selectedTowerId: towerId, towerToBuild: null }),
      setTowerToBuild: (towerDef) =>
        set({ towerToBuild: towerDef, selectedTowerId: null }),
      handleChatMessageReceived: (payload) =>
        set((state) => ({
          chatMessages: [...state.chatMessages, payload],
        })),
      handleTowerPlaced: (tower) =>
        set((state) => {
          if (!state.gameState) return {};
          return {
            gameState: {
              ...state.gameState,
              towers: [...state.gameState.towers, tower],
            },
          };
        }),
      handleTowerUpgraded: (tower) =>
        set((state) => {
          if (!state.gameState) return {};
          return {
            gameState: {
              ...state.gameState,
              towers: state.gameState.towers.map((t: Tower) =>
                t.instanceId === tower.instanceId ? tower : t
              ),
            },
          };
        }),
      handleTowerSold: (towerInstanceId) =>
        set((state) => {
          if (!state.gameState) return {};
          return {
            gameState: {
              ...state.gameState,
              towers: state.gameState.towers.filter(
                (t: Tower) => t.instanceId !== towerInstanceId
              ),
            },
          };
        }),
      handlePlayerStateUpdate: (payload) =>
        set((state) => {
          if (!state.gameState || !state.gameState.players) return {};
          return {
            gameState: {
              ...state.gameState,
              players: state.gameState.players.map((p: Player) =>
                p.id === payload.playerId ? { ...p, gold: payload.gold } : p
              ),
            },
          };
        }),
    }),
    {
      name: "game-store",
    }
  )
);
