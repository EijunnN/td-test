"use client";

import { useState } from "react";
import { useGameStore } from "../../state/gameStore";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Coins,
  Target,
  Zap,
  Gauge,
  ArrowRightLeft,
  Shield,
  Snowflake,
  Castle,
  Warehouse,
} from "lucide-react";
import type { TowerDefinition } from "@shared/types/entities";

// Mapeo de IDs de torre a iconos para una mejor visualización
const towerIcons: { [key: string]: React.ReactNode } = {
  arrow_tower: <Castle className="h-8 w-8 text-yellow-200" />,
  cannon_tower: <Shield className="h-8 w-8 text-orange-400" />,
  ice_tower: <Snowflake className="h-8 w-8 text-cyan-300" />,
  arcane_tower: <Zap className="h-8 w-8 text-purple-400" />,
  sky_watcher: <Zap className="h-8 w-8 text-blue-300" />,
};

export function TowerShop() {
  const { gameState, playerId, setTowerToBuild, towerToBuild } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);

  const player = gameState?.players.find((p) => p.id === playerId);
  if (!gameState || !player) return null;

  const handleSelectAndClose = (towerId: string) => {
    const towerData = gameState.towerPrototypes.find((t) => t.id === towerId);
    if (!towerData) return;

    const towerCost = towerData.levels[0]?.cost ?? 0;
    if (player.gold >= towerCost) {
      setTowerToBuild(towerData);
      setIsOpen(false);
    } else {
      // Opcional: mostrar notificación de "oro insuficiente"
      console.log("Oro insuficiente.");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg"
        >
          <Warehouse className="mr-2 h-6 w-6" />
          Tienda de Torres
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-4/5 bg-slate-900/90 backdrop-blur-lg border-t-slate-700 text-white"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-2xl">Arsenal de Torres</SheetTitle>
          <SheetDescription>
            Elige una torre para construir. El coste se deducirá de tu oro.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 overflow-y-auto h-[calc(100%-120px)] scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent ml-4 ">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4 text-center">
            {gameState.towerPrototypes.map((tower) => {
              const level1 = tower.levels[0];
              const canAfford = player.gold >= level1.cost;
              const isSelected = towerToBuild?.id === tower.id;
              return (
                <div
                  key={tower.id}
                  className={`
                    p-4 rounded-lg border-2
                    ${isSelected ? "border-green-500" : "border-slate-700"}
                    ${
                      !canAfford ? "bg-slate-800/50 opacity-60" : "bg-slate-800"
                    }
                  `}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold mb-2">{tower.name}</h3>
                    <div className="flex items-center gap-2 text-yellow-400 font-bold">
                      <Coins className="h-5 w-5" />
                      <span>{level1.cost}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-slate-300 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-red-400" />
                      <span>Daño: {level1.damage}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target size={16} className="text-green-400" />
                      <span>Rango: {level1.range}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gauge size={16} className="text-blue-400" />
                      <span>Velocidad: {level1.attackSpeed}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft size={16} className="text-purple-400" />
                      <span>Tipo: {tower.targetType}</span>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600"
                    onClick={() => handleSelectAndClose(tower.id)}
                    disabled={!canAfford}
                  >
                    {isSelected ? "Seleccionada" : "Elegir para construir"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
        <SheetFooter>
          <p className="text-sm text-slate-400 text-center w-full">
            Tu oro: {player.gold}
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
