import type { BuildArea, MapData, MapPath } from "@shared/types/map";
import type { Monster, Tower, TowerDefinition } from "@shared/types/entities";

const TOWER_RANGE_MULTIPLIER = 50;

export const drawMap = (ctx: CanvasRenderingContext2D, mapData: MapData) => {
  if (!mapData || !mapData.paths) return;

  // Dibujar zonas de construcción (opcional, como guía)
  ctx.fillStyle = "rgba(80, 150, 80, 0.1)";
  if (mapData.buildableArea) {
    mapData.buildableArea.forEach((area: BuildArea) => {
      ctx.fillRect(area.x, area.y, area.width, area.height);
    });
  }

  // Dibujar caminos
  ctx.strokeStyle = "#4a5568"; // gray-600
  ctx.lineWidth = 40;
  mapData.paths.forEach((path: MapPath) => {
    ctx.beginPath();
    ctx.moveTo(path.portal.x, path.portal.y);
    path.waypoints.forEach((wp) => {
      ctx.lineTo(wp.x, wp.y);
    });
    ctx.stroke();
  });
};

export const drawMonsters = (
  ctx: CanvasRenderingContext2D,
  monsters: Monster[]
) => {
  monsters.forEach((monster) => {
    // Cuerpo del monstruo
    ctx.fillStyle = "#E53E3E"; // red-600
    ctx.beginPath();
    ctx.arc(monster.position.x, monster.position.y, 12, 0, Math.PI * 2);
    ctx.fill();

    // Barra de vida
    const healthBarWidth = 30;
    const healthPercentage = monster.hp / monster.maxHp;
    ctx.fillStyle = "#718096"; // gray-500
    ctx.fillRect(
      monster.position.x - healthBarWidth / 2,
      monster.position.y - 22,
      healthBarWidth,
      5
    );
    ctx.fillStyle = "#48BB78"; // green-400
    ctx.fillRect(
      monster.position.x - healthBarWidth / 2,
      monster.position.y - 22,
      healthBarWidth * healthPercentage,
      5
    );
  });
};

export const drawTowers = (
  ctx: CanvasRenderingContext2D,
  towers: Tower[],
  playerId: string | null,
  selectedTowerId: string | null,
  towerPrototypes: TowerDefinition[]
) => {
  towers.forEach((tower) => {
    // Base de la torre
    ctx.fillStyle = tower.ownerId === playerId ? "#63B3ED" : "#F6AD55"; // blue-300 / orange-300
    ctx.beginPath();
    ctx.arc(tower.position.x, tower.position.y, 18, 0, Math.PI * 2);
    ctx.fill();

    // Cañón de la torre
    ctx.fillStyle = "#A0AEC0"; // gray-400
    ctx.fillRect(tower.position.x - 5, tower.position.y - 5, 10, 10);

    // Dibujar el rango si la torre está seleccionada
    if (tower.instanceId === selectedTowerId) {
      const towerDef = towerPrototypes.find((def) => def.id === tower.typeId);
      const range =
        (towerDef?.levels[tower.level - 1]?.range ?? 0) *
        TOWER_RANGE_MULTIPLIER;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tower.position.x, tower.position.y, range, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
};
