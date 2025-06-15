"use client";

import { useGameStore } from "../../state/gameStore";
import { Heart, Coins, GitCommitHorizontal } from "lucide-react";
import { TowerShop } from "./TowerShop";

const HUD = () => {
  const { gameState, playerId } = useGameStore();

  if (!gameState) {
    return null; // No renderizar si no hay estado de juego
  }

  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  const gold = currentPlayer ? currentPlayer.gold : 0;
  const { lives, wave, gameId } = gameState;

  return (
    <div className="absolute top-0 left-0 right-0 p-2 md:p-4 bg-black/40 text-white flex items-center justify-between text-base md:text-lg z-10 font-mono">
      {/* Vidas y Oro en la izquierda */}
      <div className="flex items-center gap-3 md:gap-4">
        <div
          className="flex items-center gap-2 bg-gray-800/70 px-3 py-1 rounded-md"
          title="Vidas del equipo"
        >
          <Heart className="text-red-500 h-5 w-5 md:h-6 md:w-6" />
          <span className="font-bold">{lives}</span>
        </div>
        <div
          className="flex items-center gap-2 bg-gray-800/70 px-3 py-1 rounded-md"
          title="Tu oro"
        >
          <Coins className="text-yellow-500 h-5 w-5 md:h-6 md:w-6" />
          <span className="font-bold">{gold}</span>
        </div>
      </div>

      {/* Oleada en el centro */}
      <div
        className="hidden sm:flex items-center gap-2 bg-gray-800/70 px-3 py-1 rounded-md"
        title="Oleada actual"
      >
        <GitCommitHorizontal className="text-gray-400 h-5 w-5 md:h-6 md:w-6" />
        <span className="font-semibold">Oleada: {wave > 0 ? wave : "-"}</span>
      </div>

      {/* ID de sala a la derecha */}
      <div className="text-xs text-gray-400" title="ID de la sala">
        Sala: {gameId}
      </div>

      {/* Botón para abrir la tienda */}
      <TowerShop />
    </div>
  );
};

export default HUD;
