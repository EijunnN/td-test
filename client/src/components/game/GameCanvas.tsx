"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useGameStore } from "@/state/gameStore";
import { websocketService } from "@/services/websocketService";
import type { Position } from "@shared/types/entities";
import type {
  Monster,
  Tower,
  TowerDefinition,
  Projectile,
} from "@shared/types/entities";
import type { MapData } from "@shared/types/map";

const TOWER_RANGE_MULTIPLIER = 50;
const TOWER_FOOTPRINT_RADIUS = 25;
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 700;

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    gameState,
    towerToBuild,
    setTowerToBuild,
    selectTower,
    selectedTowerId,
    playerId,
  } = useGameStore();

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });
  const panMoved = useRef(false);

  const screenToWorld = useCallback(
    (screenPos: Position): Position => {
      const worldX = (screenPos.x - offset.x) / scale;
      const worldY = (screenPos.y - offset.y) / scale;
      return { x: worldX, y: worldY };
    },
    [offset, scale]
  );

  const isPositionValidForTower = useCallback(
    (position: Position): boolean => {
      if (!gameState) return false;
      const { mapData, towers } = gameState;
      const isInBuildableArea = (mapData.buildableArea || []).some(
        (area) =>
          position.x >= area.x &&
          position.x <= area.x + area.width &&
          position.y >= area.y &&
          position.y <= area.y + area.height
      );
      if (!isInBuildableArea) return false;
      for (const existingTower of towers) {
        const dx = existingTower.position.x - position.x;
        const dy = existingTower.position.y - position.y;
        if (Math.sqrt(dx * dx + dy * dy) < TOWER_FOOTPRINT_RADIUS * 2) {
          return false;
        }
      }
      return true;
    },
    [gameState]
  );

  const drawMap = useCallback(
    (ctx: CanvasRenderingContext2D, mapData: MapData, isBuilding: boolean) => {
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

      ctx.strokeStyle = "#5a5a5a";
      ctx.lineWidth = 40;
      mapData.paths.forEach((path) => {
        ctx.beginPath();
        ctx.moveTo(path.portal.x, path.portal.y);
        path.waypoints.forEach((wp) => ctx.lineTo(wp.x, wp.y));
        ctx.stroke();
      });

      if (isBuilding) {
        ctx.fillStyle = "rgba(0, 255, 0, 0.15)";
        mapData.buildableArea.forEach((area) => {
          ctx.fillRect(area.x, area.y, area.width, area.height);
        });
      }
    },
    []
  );

  const drawMonster = useCallback(
    (ctx: CanvasRenderingContext2D, monster: Monster) => {
      ctx.beginPath();
      ctx.arc(monster.position.x, monster.position.y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = monster.typeId.includes("orc") ? "green" : "brown";
      ctx.fill();

      const healthBarWidth = 30;
      const healthPercentage = monster.hp / monster.maxHp;
      ctx.fillStyle = "red";
      ctx.fillRect(
        monster.position.x - healthBarWidth / 2,
        monster.position.y - 20,
        healthBarWidth,
        5
      );
      ctx.fillStyle = "lime";
      ctx.fillRect(
        monster.position.x - healthBarWidth / 2,
        monster.position.y - 20,
        healthBarWidth * healthPercentage,
        5
      );
    },
    []
  );

  const drawTower = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      tower: Tower,
      isBuilding: boolean,
      currentPlayerId: string | null
    ) => {
      const isOwner = tower.ownerId === currentPlayerId;

      // Dibujo base de la torre
      ctx.beginPath();
      ctx.rect(tower.position.x - 15, tower.position.y - 15, 30, 30);
      ctx.fillStyle = tower.typeId.includes("arrow") ? "lightblue" : "gray";
      ctx.fill();

      // Contorno para diferenciar propiedad
      if (isOwner) {
        ctx.strokeStyle = "#6EE7B7"; // Verde esmeralda para el jugador
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = "#FBBF24"; // Ámbar para el compañero
        ctx.lineWidth = 2;
      }
      ctx.stroke();

      // Nivel de la torre
      ctx.fillStyle = "black";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${tower.level}`, tower.position.x, tower.position.y);

      if (isBuilding) {
        ctx.beginPath();
        ctx.arc(
          tower.position.x,
          tower.position.y,
          TOWER_FOOTPRINT_RADIUS,
          0,
          2 * Math.PI
        );
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.stroke();
      }
    },
    []
  );

  const drawTowerRange = useCallback(
    (ctx: CanvasRenderingContext2D, tower: Tower) => {
      const towerProto = gameState?.towerPrototypes.find(
        (p) => p.id === tower.typeId
      );
      if (!towerProto) return;
      const levelData = towerProto.levels.find((l) => l.level === tower.level);
      if (!levelData) return;

      ctx.beginPath();
      ctx.arc(
        tower.position.x,
        tower.position.y,
        levelData.range * TOWER_RANGE_MULTIPLIER,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.stroke();
    },
    [gameState]
  );

  const drawProjectile = useCallback(
    (ctx: CanvasRenderingContext2D, p: Projectile) => {
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = "white";
      ctx.fill();
    },
    []
  );

  const drawTowerPreview = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      towerDef: TowerDefinition,
      pos: Position,
      isValid: boolean
    ) => {
      const level1 = towerDef.levels[0];
      if (!level1) return;

      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.rect(pos.x - 15, pos.y - 15, 30, 30);
      ctx.fillStyle = isValid
        ? towerDef.id.includes("arrow")
          ? "lightblue"
          : "gray"
        : "red";
      ctx.fill();
      ctx.globalAlpha = 1.0;

      ctx.globalAlpha = 0.5;

      ctx.beginPath();
      ctx.arc(
        pos.x,
        pos.y,
        level1.range * TOWER_RANGE_MULTIPLIER,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = isValid
        ? "rgba(255, 255, 255, 0.2)"
        : "rgba(255, 0, 0, 0.2)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, TOWER_FOOTPRINT_RADIUS, 0, 2 * Math.PI);
      ctx.strokeStyle = isValid
        ? "rgba(255, 255, 255, 0.8)"
        : "rgba(255, 0, 0, 0.8)";
      ctx.stroke();

      ctx.globalAlpha = 1.0;
    },
    []
  );

  const drawGame = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!gameState) return;
      const { mapData, monsters, towers, projectiles } = gameState;
      const canvas = ctx.canvas;
      const isBuilding = !!towerToBuild;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(offset.x, offset.y);
      ctx.scale(scale, scale);

      drawMap(ctx, mapData, isBuilding);

      towers.forEach((tower) => drawTower(ctx, tower, isBuilding, playerId));
      monsters.forEach((monster) => drawMonster(ctx, monster));
      projectiles.forEach((p) => drawProjectile(ctx, p));

      const selectedTowerInstance = towers.find(
        (t) => t.instanceId === selectedTowerId
      );
      if (selectedTowerInstance) {
        drawTowerRange(ctx, selectedTowerInstance);
      }

      if (towerToBuild) {
        const worldMousePos = screenToWorld(mousePos);
        const isValid = isPositionValidForTower(worldMousePos);
        drawTowerPreview(ctx, towerToBuild, worldMousePos, isValid);
      }
      ctx.restore();
    },
    [
      gameState,
      towerToBuild,
      selectedTowerId,
      mousePos,
      offset,
      scale,
      screenToWorld,
      isPositionValidForTower,
      playerId,
      drawMap,
      drawMonster,
      drawTower,
      drawTowerRange,
      drawProjectile,
      drawTowerPreview,
    ]
  );

  // Efecto para ajustar el canvas al tamaño de la ventana y centrar la vista inicial
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        const { clientWidth: width, clientHeight: height } = container;
        canvas.width = width;
        canvas.height = height;

        const scaleX = width / MAP_WIDTH;
        const scaleY = height / MAP_HEIGHT;
        const initialScale = Math.min(scaleX, scaleY) * 0.9;
        setScale(initialScale);

        setOffset({
          x: (width - MAP_WIDTH * initialScale) / 2,
          y: (height - MAP_HEIGHT * initialScale) / 2,
        });
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []); // Se ejecuta solo al montar

  // Efecto para el bucle de renderizado
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const renderLoop = () => {
      drawGame(ctx);
      animationFrameId = window.requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [drawGame]);

  const getPosOnCanvas = (e: React.MouseEvent | React.TouchEvent): Position => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handlePanStart = (e: React.MouseEvent | React.TouchEvent) => {
    panMoved.current = false;
    if (towerToBuild) return;
    const pos = getPosOnCanvas(e);
    setIsPanning(true);
    setPanStart({ x: pos.x - offset.x, y: pos.y - offset.y });
  };

  const handlePanMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPanning) return;
    panMoved.current = true;
    const pos = getPosOnCanvas(e);
    setMousePos(pos);
    const newOffset = { x: pos.x - panStart.x, y: pos.y - panStart.y };
    setOffset(newOffset);
  };

  const handlePanEnd = () => setIsPanning(false);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (panMoved.current) return;
    const worldPos = screenToWorld(getPosOnCanvas(e));

    if (towerToBuild) {
      if (isPositionValidForTower(worldPos)) {
        websocketService.send("build_tower", {
          towerId: towerToBuild.id,
          position: worldPos,
        });
        setTowerToBuild(null);
      }
      return;
    }

    const clickedTower = gameState?.towers.find((tower) => {
      const dx = tower.position.x - worldPos.x;
      const dy = tower.position.y - worldPos.y;
      return Math.sqrt(dx * dx + dy * dy) < 20;
    });

    selectTower(clickedTower ? clickedTower.instanceId : null);
  };

  const handleZoom = (factor: number) => {
    const newScale = Math.max(0.3, Math.min(2.5, scale * factor));
    const canvas = canvasRef.current;
    if (!canvas) return;

    const worldMousePos = screenToWorld(mousePos);

    const newOffsetX = mousePos.x - worldMousePos.x * newScale;
    const newOffsetY = mousePos.y - worldMousePos.y * newScale;

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  return (
    <div className="relative w-full h-full bg-gray-800 touch-none">
      <canvas
        ref={canvasRef}
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
        onTouchStart={handlePanStart}
        onTouchMove={handlePanMove}
        onTouchEnd={handlePanEnd}
        onClick={handleCanvasClick}
        className="absolute top-0 left-0 w-full h-full cursor-grab active:cursor-grabbing"
      />
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={() => handleZoom(1.2)}
          className="w-12 h-12 bg-gray-700 text-white font-bold text-2xl rounded-full hover:bg-gray-600 transition-colors shadow-lg"
        >
          +
        </button>
        <button
          onClick={() => handleZoom(0.8)}
          className="w-12 h-12 bg-gray-700 text-white font-bold text-2xl rounded-full hover:bg-gray-600 transition-colors shadow-lg"
        >
          -
        </button>
      </div>
    </div>
  );
};

export default GameCanvas;
