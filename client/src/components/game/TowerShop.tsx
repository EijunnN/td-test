"use client";

import { useState } from "react";
import { useGameStore } from "../../state/gameStore";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Target, Zap, Gauge, ArrowRightLeft } from "lucide-react";

export function TowerShop() {
  const { gameState, playerId, setTowerToBuild } = useGameStore();
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  if (!gameState || !playerId) return null;

  const player = gameState.players.find((p) => p.id === playerId);
  const towerPrototypes = gameState.towerPrototypes;

  const handleSelectTower = (towerId: string) => {
    const towerData = towerPrototypes.find((t) => t.id === towerId);
    if (!towerData) return;

    const towerCost = towerData.levels[0]?.cost ?? 0;
    if (player && player.gold >= towerCost) {
      setTowerToBuild(towerData);
      setSelectedTowerId(towerId);
      setIsOpen(false); // Cierra el panel al seleccionar
      console.log(`Activado modo construcción para: ${towerId}`);
    } else {
      console.log("Oro insuficiente.");
      // TODO: Mostrar notificación de oro insuficiente
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">Tienda</Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Tienda de Torres</SheetTitle>
          <SheetDescription>
            Selecciona una torre para construir. Necesitarás suficiente oro.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-grow overflow-y-auto p-1">
          <div className="grid gap-4">
            {towerPrototypes.map((tower) => {
              const level1 = tower.levels[0];
              const canAfford = player ? player.gold >= level1.cost : false;
              return (
                <Card
                  key={tower.id}
                  className={`border-2 ${
                    selectedTowerId === tower.id
                      ? "border-blue-500"
                      : "border-transparent"
                  } ${
                    !canAfford ? "opacity-60 bg-gray-800/50" : "bg-gray-800"
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{tower.name}</span>
                      <div className="flex items-center gap-2 text-yellow-400">
                        <Coins className="h-4 w-4" />
                        <span>{level1.cost}</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Zap className="h-4 w-4 text-red-400" />
                      <span>Daño: {level1.damage}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4 text-green-400" />
                      <span>Rango: {level1.range}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Gauge className="h-4 w-4 text-blue-400" />
                      <span>Velocidad: {level1.attackSpeed}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowRightLeft className="h-4 w-4 text-purple-400" />
                      <span>Objetivo: {tower.targetType}</span>
                    </div>
                  </CardContent>
                  <div className="p-4 pt-0">
                    <Button
                      className="w-full"
                      onClick={() => handleSelectTower(tower.id)}
                      disabled={!canAfford}
                    >
                      {selectedTowerId === tower.id
                        ? "Colocar en el mapa"
                        : "Seleccionar"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
        <SheetFooter>
          <p className="text-sm text-gray-400 text-center w-full">
            Tu oro: {player?.gold ?? 0}
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
