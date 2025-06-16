"use client";

import { useGameStore } from "../../state/gameStore";
import { Coins, Castle, Zap, Shield, Snowflake } from "lucide-react";
import type { TowerDefinition } from "@shared/types/entities";

// Mapeo de IDs de torre a iconos para una mejor visualización
const towerIcons: { [key: string]: React.ReactNode } = {
  arrow_tower: <Castle className="h-8 w-8 text-yellow-200" />,
  cannon_tower: <Shield className="h-8 w-8 text-orange-400" />,
  ice_tower: <Snowflake className="h-8 w-8 text-cyan-300" />,
  arcane_tower: <Zap className="h-8 w-8 text-purple-400" />,
  sky_watcher: <Zap className="h-8 w-8 text-blue-300" />,
};

export function TowerQuickBar() {
  const { gameState, playerId, towerToBuild, setTowerToBuild } = useGameStore();

  if (!gameState || !playerId) return null;

  const player = gameState.players.find((p) => p.id === playerId);
  if (!player) return null;

  const handleSelectTower = (towerDef: TowerDefinition) => {
    // Si el jugador no puede permitírselo, no hacer nada
    if (player.gold < (towerDef.levels[0]?.cost ?? Infinity)) {
      console.log("Oro insuficiente");
      // Aquí se podría mostrar una pequeña notificación visual
      return;
    }

    // Si la torre ya está seleccionada, anular la selección.
    if (towerToBuild?.id === towerDef.id) {
      setTowerToBuild(null);
    } else {
      setTowerToBuild(towerDef);
    }
  };

  return (
    <div className="h-full flex items-center">
      <div className="w-full flex gap-3 overflow-x-auto p-2 pb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {gameState.towerPrototypes.map((towerDef) => {
          const level1 = towerDef.levels[0];
          if (!level1) return null;

          const canAfford = player.gold >= level1.cost;
          const isSelected = towerToBuild?.id === towerDef.id;

          return (
            <div
              key={towerDef.id}
              onClick={() => handleSelectTower(towerDef)}
              className={`
                flex-shrink-0 w-28 h-28 rounded-xl p-2
                flex flex-col items-center justify-between
                cursor-pointer transition-all duration-200
                border-2
                ${
                  isSelected
                    ? "border-green-400 bg-green-900/50 scale-105 shadow-lg"
                    : canAfford
                    ? "border-gray-600 bg-gray-800/80 hover:bg-gray-700/80"
                    : "border-gray-700 bg-gray-900/70 opacity-50 cursor-not-allowed"
                }
              `}
            >
              <div className="text-center">
                {towerIcons[towerDef.id] || (
                  <Castle className="h-8 w-8 text-gray-400" />
                )}
                <p className="font-bold text-sm mt-1">{towerDef.name}</p>
              </div>

              <div className="flex items-center gap-2 text-yellow-400 font-bold">
                <Coins className="h-4 w-4" />
                <span>{level1.cost}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 