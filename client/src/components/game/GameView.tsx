"use client";

import { useGameStore } from "@/state/gameStore";
import { websocketService } from "@/services/websocketService";
import GameCanvas from "./GameCanvas";
import { useEffect, useState } from "react";
import type { GameState } from "@shared/types/GameState";
import type {
  S2C_GameOverPayload,
  S2C_TowerPlacedPayload,
  S2C_PlayerStateUpdatePayload,
  S2C_ErrorMessagePayload,
  S2C_ChatMessageReceivedPayload,
} from "@shared/types/events";
import HUD from "./HUD";
import { TowerShop } from "./TowerShop";
import { ChatBox } from "./ChatBox";
import { TowerControl } from "./TowerControl";
import { EndScreen } from "./EndScreen";

const GameView = () => {
  const {
    gameState,
    isHost,
    handleTowerPlaced,
    handlePlayerStateUpdate,
    setGameOver,
    setGameState,
    handleChatMessageReceived,
  } = useGameStore();
  const [systemMessages, setSystemMessages] = useState<string[]>([]);

  useEffect(() => {
    const handleGameStateUpdate = (payload: GameState) => {
      setGameState(payload);
    };

    const handleSystemMessage = (payload: { message: string }) => {
      setSystemMessages((prev) => [...prev, payload.message]);
    };
    const handleGameStarted = () => {
      setSystemMessages((prev) => [...prev, "¡La partida ha comenzado!"]);
    };
    const handleGameOver = (payload: S2C_GameOverPayload) => {
      setGameOver(payload.reason);
    };

    const handleTowerPlacedEvent = (payload: S2C_TowerPlacedPayload) => {
      handleTowerPlaced(payload.tower);
    };

    const handlePlayerUpdate = (payload: S2C_PlayerStateUpdatePayload) => {
      // No es necesario verificar el ID, el store ya lo hace si es necesario.
      handlePlayerStateUpdate(payload);
    };

    const handleError = (payload: S2C_ErrorMessagePayload) => {
      setSystemMessages((prev) => [...prev, `Error: ${payload.message}`]);
    };

    const handleChat = (payload: S2C_ChatMessageReceivedPayload) => {
      handleChatMessageReceived(payload);
    };

    websocketService.on("game_state_update", handleGameStateUpdate);
    websocketService.on("system_message", handleSystemMessage);
    websocketService.on("game_started", handleGameStarted);
    websocketService.on("game_over", handleGameOver);
    websocketService.on("tower_placed", handleTowerPlacedEvent);
    websocketService.on("player_state_update", handlePlayerUpdate);
    websocketService.on("error_message", handleError);
    websocketService.on("chat_message_received", handleChat);

    return () => {
      websocketService.off("game_state_update", handleGameStateUpdate);
      websocketService.off("system_message", handleSystemMessage);
      websocketService.off("game_started", handleGameStarted);
      websocketService.off("game_over", handleGameOver);
      websocketService.off("tower_placed", handleTowerPlacedEvent);
      websocketService.off("player_state_update", handlePlayerUpdate);
      websocketService.off("error_message", handleError);
      websocketService.off("chat_message_received", handleChat);
    };
  }, [
    handlePlayerStateUpdate,
    handleTowerPlaced,
    setGameOver,
    setGameState,
    handleChatMessageReceived,
  ]);

  const handleStartGame = () => {
    websocketService.send("start_game", {});
  };

  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-full">
        Cargando partida...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 text-white overflow-hidden">
      <div className="flex-grow relative">
        <HUD />
        <div className="absolute inset-0 flex items-center justify-center">
          <GameCanvas />
        </div>
        <TowerControl />
        <ChatBox />
        <EndScreen />
        <div className="absolute bottom-24 md:bottom-2 left-2 p-2 bg-black bg-opacity-50 rounded max-h-40 overflow-y-auto text-sm font-mono">
          {systemMessages.map((msg, index) => (
            <div key={index}>{msg}</div>
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 p-2 bg-gray-800 border-t border-gray-700">
        {gameState.status === "lobby" && isHost && (
          <div className="flex justify-center items-center h-full">
            <button
              onClick={handleStartGame}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-transform transform hover:scale-105"
            >
              Empezar Partida
            </button>
          </div>
        )}
        {gameState.status === "in_progress" && (
          <div className="w-full">
            <TowerShop />
          </div>
        )}
      </div>
    </div>
  );
};

export default GameView;
