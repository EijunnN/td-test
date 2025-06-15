import type { GameSession } from "../models/GameSession";
import { WaveSpawner } from "./WaveSpawner";
import { Monster } from "../models/Monster";
import { Tower } from "../models/Tower";
import type { Position } from "@shared/types/entities";
import { gameDataService } from "../services/GameDataService";

const TICK_RATE = 30; // 30 ticks por segundo
const TOWER_RANGE_MULTIPLIER = 50; // Convierte el rango abstracto de la torre (ej: 3) a píxeles (ej: 150)

/**
 * El motor del juego, responsable del bucle principal y de orquestar las actualizaciones de estado.
 */
export class GameEngine {
  private session: GameSession;
  private loop: Timer | null = null;
  private lastTickTime: number = 0;
  private spawner: WaveSpawner;

  constructor(session: GameSession) {
    this.session = session;
    this.spawner = new WaveSpawner(this.session);
  }

  /**
   * Inicia el bucle principal del juego.
   */
  public start() {
    if (this.loop) return; // El motor ya está en funcionamiento

    console.log(
      `[GameEngine - ${this.session.id}] Iniciando motor de juego...`
    );
    this.lastTickTime = Date.now();
    this.loop = setInterval(() => {
      this.update();
    }, 1000 / TICK_RATE);

    // Iniciar la primera oleada
    this.spawner.startNextWave();
  }

  /**
   * Detiene el bucle principal del juego.
   */
  public stop() {
    if (this.loop) {
      console.log(
        `[GameEngine - ${this.session.id}] Deteniendo motor de juego.`
      );
      clearInterval(this.loop);
      this.loop = null;
    }
  }

  /**
   * El "tick" principal del juego, se ejecuta en cada iteración del bucle.
   */
  private update() {
    const now = Date.now();
    const deltaTime = (now - this.lastTickTime) / 1000; // Delta time en segundos
    this.lastTickTime = now;

    // Actualizar el generador de oleadas
    this.spawner.update(deltaTime);

    // Actualizar efectos de los monstruos (ej: ralentización)
    this.updateMonsterEffects(deltaTime);

    // Mover monstruos
    this.moveMonsters(deltaTime);

    // Torres atacan
    this.towersAttack(deltaTime);

    // Mover proyectiles
    this.updateProjectiles(deltaTime);

    // Comprobar condiciones de fin de partida
    this.checkEndGameConditions();

    // T10: Torres atacan
    // this.towersAttack();

    // T11: Enviar el estado del juego actualizado
    this.session.broadcastGameState();
  }

  private updateMonsterEffects(deltaTime: number) {
    const monsters = this.session.getMonsters();
    for (const monster of monsters.values()) {
      monster.updateEffects(deltaTime);
    }
  }

  private moveMonsters(deltaTime: number) {
    const monsters = this.session.getGameStateForClient().monsters || [];
    const monsterInstances = this.session.getMonsters();
    const mapData = this.session.getMapData();

    if (!mapData || !mapData.paths) return;

    for (const monsterData of monsters) {
      const monster = monsterInstances.get(monsterData.instanceId);
      if (!monster) continue;

      const path = mapData.paths.find((p: any) => p.id === monster.pathId);
      if (!path || monster.waypointIndex >= path.waypoints.length) {
        // El monstruo ha llegado al final
        this.session.monsterReachedEnd(monster.instanceId);
        continue;
      }

      const targetWaypoint = path.waypoints[monster.waypointIndex];
      const targetPosition = { x: targetWaypoint.x, y: targetWaypoint.y };

      const dx = targetPosition.x - monster.position.x;
      const dy = targetPosition.y - monster.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const moveDistance = monster.speed * 50 * deltaTime; // Multiplicador para que la velocidad sea más manejable

      if (distance < moveDistance) {
        // Ha llegado al waypoint
        monster.position = targetPosition;
        monster.waypointIndex++;
      } else {
        // Moverse hacia el waypoint
        monster.position.x += (dx / distance) * moveDistance;
        monster.position.y += (dy / distance) * moveDistance;
      }
    }
  }

  private towersAttack(deltaTime: number) {
    const towers = this.session.getTowers();
    const monsters = this.session.getMonsters();

    if (monsters.size === 0) {
      towers.forEach((tower) => tower.clearTarget());
      return;
    }

    for (const tower of towers.values()) {
      tower.update(deltaTime); // Actualizar cooldown

      let currentTarget = tower.getTargetId()
        ? monsters.get(tower.getTargetId()!)
        : null;

      // Validar si el objetivo actual sigue siendo válido
      if (currentTarget) {
        const distance = this.calculateDistance(
          tower.position,
          currentTarget.position
        );
        if (distance > tower.range * TOWER_RANGE_MULTIPLIER) {
          tower.clearTarget();
          currentTarget = null;
        }
      }

      // Si no hay un objetivo válido, buscar uno nuevo
      if (!currentTarget) {
        currentTarget = this.findNewTargetFor(tower, monsters);
        tower.setTarget(currentTarget ? currentTarget.instanceId : null);
      }

      // Si hay un objetivo y la torre puede atacar, ¡fuego!
      if (currentTarget && tower.canAttack()) {
        tower.attack(); // Reinicia el enfriamiento de la torre
        this.session.handleTowerAttack(tower, currentTarget);
      }
    }
  }

  private findNewTargetFor(
    tower: Tower,
    monsters: Map<string, Monster>
  ): Monster | null {
    let bestTarget: Monster | null = null;
    let minDistance = Infinity;

    const towerTemplate = gameDataService.towers.get(tower.typeId);
    if (!towerTemplate) return null;

    for (const monster of monsters.values()) {
      // Comprobar si la torre puede atacar a este tipo de monstruo
      if (
        towerTemplate.targetType !== "any" &&
        towerTemplate.targetType !== monster.type
      ) {
        continue;
      }

      const distance = this.calculateDistance(tower.position, monster.position);
      if (
        distance <= tower.range * TOWER_RANGE_MULTIPLIER &&
        distance < minDistance
      ) {
        minDistance = distance;
        bestTarget = monster;
      }
    }
    return bestTarget;
  }

  private calculateDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private checkEndGameConditions() {
    // La condición de derrota se maneja en GameSession cuando un monstruo llega al final.

    // Condición de Victoria:
    // 1. Todas las oleadas han sido completadas por el spawner.
    // 2. No quedan monstruos en el mapa.
    if (
      this.spawner.allWavesCompleted &&
      this.session.getMonsters().size === 0
    ) {
      this.session.endGame("victory");
    }
  }

  public areAllWavesCompleted(): boolean {
    return this.spawner.allWavesCompleted;
  }

  private updateProjectiles(deltaTime: number) {
    const projectiles = this.session.getProjectiles(); // Necesitaremos este método en GameSession
    const monsters = this.session.getMonsters();

    for (const projectile of projectiles.values()) {
      const target = monsters.get(projectile.targetId);

      if (!target) {
        // El objetivo ya no existe, eliminar el proyectil
        projectiles.delete(projectile.id);
        continue;
      }

      const hasHit = projectile.move(target.position, deltaTime);

      if (hasHit) {
        this.session.handleProjectileImpact(projectile.id);
        // El proyectil se elimina dentro de handleProjectileImpact
      }
    }
  }
}
