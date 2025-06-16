import { Button } from "@/components/ui/button";
import { useGameStore } from "@/state/gameStore";
import { DollarSign, ChevronsUp, Trash2, X, Info } from "lucide-react";
import { websocketService } from "@/services/websocketService";

export function TowerControl() {
  const { gameState, selectedTowerId, selectTower, playerId, towerToBuild } =
    useGameStore();

  const selectedTower = gameState?.towers.find(
    (t) => t.instanceId === selectedTowerId
  );
  const towerDefinition = gameState?.towerPrototypes.find(
    (def) => def.id === selectedTower?.typeId
  );
  const player = gameState?.players.find((p) => p.id === playerId);

  // No mostrar nada si no hay torre seleccionada, o si estamos en modo construcción
  if (!selectedTower || !towerDefinition || !player || towerToBuild) {
    return null;
  }

  const currentLevelData = towerDefinition.levels.find(
    (l) => l.level === selectedTower.level
  );
  const nextLevelData = towerDefinition.levels.find(
    (l) => l.level === selectedTower.level + 1
  );

  if (!currentLevelData) {
    // No debería ocurrir si los datos son correctos
    return null;
  }

  const handleUpgrade = () => {
    if (!selectedTowerId) return;
    websocketService.send("upgrade_tower", {
      towerInstanceId: selectedTowerId,
    });
  };

  const handleSell = () => {
    if (!selectedTowerId) return;
    websocketService.send("sell_tower", { towerInstanceId: selectedTowerId });
    selectTower(null); // Optimistic deselection
  };

  return (
    <div className="h-full w-full flex items-center justify-between p-2 gap-4 animate-fade-in">
      {/* Tower Info & Stats */}
      <div className="flex items-center gap-4 text-white">
        <Info className="h-8 w-8 text-blue-400 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-lg leading-tight">
            {towerDefinition.name}{" "}
            <span className="text-base font-normal text-gray-300">
              (Nivel {selectedTower.level})
            </span>
          </h3>
          <div className="flex gap-x-4 gap-y-1 text-sm text-gray-300 mt-1 flex-wrap">
            <span>
              Daño: {currentLevelData.damage}{" "}
              {nextLevelData && (
                <span className="text-green-400 font-semibold">
                  → {nextLevelData.damage}
                </span>
              )}
            </span>
            <span>
              Rango: {currentLevelData.range}{" "}
              {nextLevelData && (
                <span className="text-green-400 font-semibold">
                  → {nextLevelData.range}
                </span>
              )}
            </span>
            <span>
              Velocidad: {currentLevelData.attackSpeed}{" "}
              {nextLevelData && (
                <span className="text-green-400 font-semibold">
                  → {nextLevelData.attackSpeed}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {nextLevelData ? (
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white flex-1"
            onClick={handleUpgrade}
            disabled={player.gold < nextLevelData.cost}
          >
            <ChevronsUp className="mr-2 h-5 w-5" /> Mejorar (
            {nextLevelData.cost}
            <DollarSign className="ml-1 h-4 w-4" />)
          </Button>
        ) : (
          <Button size="lg" className="flex-1" disabled>
            Nivel Máximo
          </Button>
        )}

        <Button
          size="lg"
          variant="destructive"
          className="bg-red-700 hover:bg-red-800 text-white flex-1"
          onClick={handleSell}
        >
          <Trash2 className="mr-2 h-5 w-5" /> Vender
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={() => selectTower(null)}
          className="text-gray-400 hover:text-white hover:bg-gray-700"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
