import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/state/gameStore";
import { DollarSign, ChevronsUp, Trash2 } from "lucide-react";
import { websocketService } from "@/services/websocketService";

export function TowerControl() {
  const { gameState, selectedTowerId, selectTower, playerId } = useGameStore();

  const selectedTower = gameState?.towers.find(
    (t) => t.instanceId === selectedTowerId
  );
  const towerDefinition = gameState?.towerPrototypes.find(
    (def) => def.id === selectedTower?.typeId
  );
  const player = gameState?.players.find((p) => p.id === playerId);

  if (!selectedTower || !towerDefinition || !player) {
    return null;
  }

  const nextLevel = selectedTower.level + 1;
  const nextLevelData = towerDefinition.levels.find(
    (l) => l.level === nextLevel
  );

  const handleUpgrade = () => {
    if (!selectedTowerId) return;
    websocketService.send("upgrade_tower", {
      towerInstanceId: selectedTowerId,
    });
    // Optimistic UI update could be tricky, let's wait for server confirmation
  };

  const handleSell = () => {
    if (!selectedTowerId) return;
    const sellValue = Math.floor(
      towerDefinition.levels
        .slice(0, selectedTower.level)
        .reduce((sum, l) => sum + l.cost, 0) * 0.75
    );

    if (
      confirm(
        `¿Vender la torre por ${sellValue} de oro? (75% del valor invertido)`
      )
    ) {
      websocketService.send("sell_tower", { towerInstanceId: selectedTowerId });
    }
  };

  const handleClose = () => {
    selectTower(null);
  };

  return (
    <Card className="absolute bottom-4 left-1/2 -translate-x-1/2 w-80 bg-background/80 backdrop-blur-sm z-20">
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {towerDefinition.name} - Nivel {selectedTower.level}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Daño: {towerDefinition.levels[selectedTower.level - 1]?.damage} |
              Rango: {towerDefinition.levels[selectedTower.level - 1]?.range}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            X
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex justify-between gap-2">
          {nextLevelData ? (
            <Button
              className="flex-1"
              onClick={handleUpgrade}
              disabled={player.gold < nextLevelData.cost}
            >
              <ChevronsUp className="mr-2 h-4 w-4" /> Mejorar (
              {nextLevelData.cost}
              <DollarSign className="ml-1 h-3 w-3" />)
            </Button>
          ) : (
            <Button className="flex-1" disabled>
              Nivel Máximo
            </Button>
          )}

          <Button variant="destructive" className="flex-1" onClick={handleSell}>
            <Trash2 className="mr-2 h-4 w-4" /> Vender
          </Button>
        </div>
        {nextLevelData && (
          <div className="text-xs text-muted-foreground mt-2">
            <p>
              Próximo nivel: Daño {nextLevelData.damage}, Rango{" "}
              {nextLevelData.range}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
