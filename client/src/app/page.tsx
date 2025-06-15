"use client";

import { useState, useEffect } from "react";
import { websocketService } from "@/services/websocketService";
import { useGameStore } from "@/state/gameStore";
import GameView from "@/components/game/GameView";
import type {
  S2C_GameJoinedPayload,
  S2C_ErrorMessagePayload,
} from "@shared/types/events";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export default function Home() {
  const { gameState, setInitialState } = useGameStore();
  const [nick, setNick] = useState<string>("");
  const [roomId, setRoomId] = useState("");
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  useEffect(() => {
    // Suscribirse a los eventos de conexión/desconexión
    const handleConnect = () => setStatus("connected");
    const handleDisconnect = () => {
      setStatus("disconnected");
      // Limpiar el estado al desconectar
      setInitialState({ gameState: null, playerId: null, isHost: false });
    };
    const handleError = (payload: S2C_ErrorMessagePayload) => {
      // TODO: Usar un sistema de notificaciones más robusto (como react-toastify)
      alert(`Error del servidor: ${payload.message}`);
    };

    const handleGameJoined = (payload: S2C_GameJoinedPayload) => {
      console.log("Joined game with state:", payload);
      setInitialState({
        gameState: payload.gameState,
        playerId: payload.playerId,
        isHost: payload.isHost,
      });
      setStatus("connected");
    };

    websocketService.on("connect", handleConnect);
    websocketService.on("disconnect", handleDisconnect);
    websocketService.on("error_message", handleError);
    websocketService.on("game_joined", handleGameJoined);

    // Limpieza al desmontar el componente
    return () => {
      websocketService.off("connect", handleConnect);
      websocketService.off("disconnect", handleDisconnect);
      websocketService.off("error_message", handleError);
      websocketService.off("game_joined", handleGameJoined);
      if (websocketService.isConnected) {
        websocketService.disconnect();
      }
    };
  }, [setInitialState]);

  const handleCreateGame = async () => {
    if (!nick.trim()) return alert("Por favor, introduce un nick.");
    setStatus("connecting");
    try {
      await websocketService.connect(nick);
      websocketService.send("create_game", {});
    } catch (error) {
      console.error("Fallo al crear partida:", error);
      setStatus("error");
    }
  };

  const handleJoinGame = async () => {
    if (!nick.trim()) return alert("Por favor, introduce un nick.");
    if (!roomId.trim()) return alert("Por favor, introduce un ID de sala.");
    setStatus("connecting");
    try {
      await websocketService.connect(nick);
      websocketService.send("join_game", { roomId });
    } catch (error) {
      console.error("Fallo al unirse a partida:", error);
      setStatus("error");
    }
  };

  const renderContent = () => {
    // Si ya estamos en una partida, mostrar la vista del juego
    if (gameState) {
      return <GameView />;
    }

    // Si no, mostrar el lobby para crear/unirse
    return (
      <div className="flex flex-col gap-6 items-center justify-center flex-grow p-6">
        <h2 className="text-3xl font-bold mb-4">Tower Defense</h2>
        <input
          type="text"
          placeholder="Tu nick"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          className="w-full max-w-sm p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />

        <div className="w-full max-w-sm flex flex-col gap-4">
          <button
            onClick={handleCreateGame}
            disabled={status === "connecting"}
            className="w-full px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-transform transform hover:scale-105 disabled:bg-gray-500"
          >
            {status === "connecting" ? "Conectando..." : "Crear Partida"}
          </button>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="ID de Sala"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="flex-grow p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <button
              onClick={handleJoinGame}
              disabled={status === "connecting"}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-transform transform hover:scale-105 disabled:bg-gray-500"
            >
              Unirse
            </button>
          </div>
        </div>

        {status === "error" && (
          <p className="text-red-500 mt-2">
            No se pudo conectar o unir a la partida.
          </p>
        )}
      </div>
    );
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-gray-900 text-white font-sans">
      <div
        className="w-full max-w-4xl bg-gray-800 rounded-lg shadow-xl flex flex-col"
        style={{ height: "90vh" }}
      >
        <header className="p-4 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-center text-blue-400">
            Tower Defense
          </h1>
        </header>
        <div className="flex-grow overflow-auto flex">{renderContent()}</div>
      </div>
    </main>
  );
}
