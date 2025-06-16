"use client";

import { useGameStore } from "../../state/gameStore";
import { Heart, Coins, GitCommitHorizontal } from "lucide-react";

const HUD = () => {
  const { gameState, playerId } = useGameStore();

  if (!gameState) {
    return null; // No renderizar si no hay estado de juego
  }

  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  const gold = currentPlayer ? currentPlayer.gold : 0;
  const { lives, wave, gameId } = gameState;

  return (
    <div className="absolute top-0 left-0 right-0 p-3 bg-slate-900/50 backdrop-blur-sm text-white flex items-center justify-between text-lg z-10 font-sans shadow-lg">
      {/* Vidas y Oro en la izquierda */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2" title="Vidas del equipo">
          <Heart className="text-red-400 h-6 w-6" />
          <span className="font-bold text-xl">{lives}</span>
        </div>
        <div className="flex items-center gap-2" title="Tu oro">
          <Coins className="text-yellow-400 h-6 w-6" />
          <span className="font-bold text-xl">{gold}</span>
        </div>
      </div>

      {/* Oleada y Sala en el centro/derecha */}
      <div className="flex items-center gap-4">
        <div
          className="hidden sm:flex items-center gap-2"
          title="Oleada actual"
        >
          <GitCommitHorizontal className="text-cyan-400 h-6 w-6" />
          <span className="font-semibold">Oleada: {wave > 0 ? wave : "-"}</span>
        </div>

        <div className="text-xs text-gray-400 font-mono" title="ID de la sala">
          Sala: {gameId.replace("game_", "")}
        </div>
      </div>
    </div>
  );
};

export default HUD;
