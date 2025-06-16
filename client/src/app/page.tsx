"use client";

import { useState, useEffect } from "react";
import { websocketService } from "@/services/websocketService";
import { useGameStore } from "@/state/gameStore";
import GameView from "@/components/game/GameView";
import type {
  S2C_GameJoinedPayload,
  S2C_ErrorMessagePayload,
} from "@shared/types/events";
import { Castle, Play, LogIn } from "lucide-react";

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
      setStatus("error");
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

  // Si ya estamos en una partida, mostrar la vista del juego a pantalla completa
  if (gameState) {
    return <GameView />;
  }

  // Si no, mostrar el lobby para crear/unirse
  return (
    <main className="flex min-h-screen w-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-slate-800 text-white font-sans">
      <div className="w-full max-w-md mx-auto bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-slate-700">
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <Castle className="h-16 w-16 text-blue-400 mb-4" />
          <h1 className="text-5xl font-extrabold text-white">Tower Defense</h1>
          <p className="text-slate-400 mt-2">
            Crea una partida o únete a una existente.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <input
            type="text"
            placeholder="Tu nick"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            className="w-full p-4 rounded-lg bg-slate-800 border-2 border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-lg font-mono"
          />

          <button
            onClick={handleCreateGame}
            disabled={status === "connecting"}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-bold transition-transform transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            <Play className="h-6 w-6" />
            {status === "connecting" ? "Conectando..." : "Crear Partida"}
          </button>

          <div className="flex items-center gap-2 text-slate-400">
            <hr className="w-full border-slate-700" />
            <span className="text-sm">O</span>
            <hr className="w-full border-slate-700" />
          </div>

          <div className="flex flex-col items-stretch gap-3">
            <input
              type="text"
              placeholder="ID de Sala"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="p-4 rounded-lg bg-slate-800 border-2 border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-lg font-mono"
            />
            <button
              onClick={handleJoinGame}
              disabled={status === "connecting"}
              className="px-6 py-4 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition-transform transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              <LogIn className="h-5 w-5" />
              Unirse
            </button>
          </div>
        </div>

        {status === "error" && (
          <p className="text-red-500 mt-4 text-center">
            No se pudo conectar. Inténtalo de nuevo.
          </p>
        )}
      </div>
    </main>
  );
}
