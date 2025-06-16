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
import { TowerQuickBar } from "./TowerQuickBar";

const GameView = () => {
  const {
    gameState,
    isHost,
    selectedTowerId,
    towerToBuild,
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
      <div className="flex items-center justify-center h-full text-white bg-gray-900">
        Cargando partida...
      </div>
    );
  }

  const renderGameFooter = () => {
    if (gameState.status === "finished") {
      return null;
    }

    // Durante el lobby, el host ve el botón de empezar y todos tienen acceso a la tienda completa (Drawer).
    if (gameState.status === "lobby") {
      return (
        <div className="w-full h-full flex items-center justify-between gap-4">
          <div className="flex-grow">
            <TowerShop />
          </div>
          {isHost && (
            <div className="flex-shrink-0 pr-4">
              <button
                onClick={handleStartGame}
                className="px-6 py-4 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg transition-transform transform hover:scale-105 shadow-lg"
              >
                Iniciar
              </button>
            </div>
          )}
        </div>
      );
    }

    // En partida, se muestra la barra rápida o los controles de torre.
    if (gameState.status === "in_progress") {
      const showTowerControls = selectedTowerId && !towerToBuild;
      return showTowerControls ? <TowerControl /> : <TowerQuickBar />;
    }
    return null;
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-800 text-white overflow-hidden">
      <main className="flex-grow relative">
        <GameCanvas />
        <HUD />
        <ChatBox />
        <EndScreen />

        {/* System Messages Log */}
        <div className="absolute bottom-4 left-4 p-2 bg-black bg-opacity-50 rounded max-h-40 w-1/3 max-w-sm overflow-y-auto text-sm font-mono pointer-events-none">
          {systemMessages.map((msg, index) => (
            <div key={index}>{msg}</div>
          ))}
        </div>
      </main>

      <footer className="flex-shrink-0 p-2 bg-gray-900/50 backdrop-blur-sm border-t border-gray-700 h-36">
        {renderGameFooter()}
      </footer>
    </div>
  );
};

export default GameView;
