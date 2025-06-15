import type { ServerWebSocket } from "bun";
import type { GameState } from "@shared/types/GameState";
import { gameDataService } from "../services/GameDataService";
import { Player } from "./Player";
import { Tower } from "./Tower";
import { Monster } from "./Monster";
import { GameEngine } from "../engine/GameEngine";
import type { Position } from "@shared/types/entities";
import { Projectile } from "./Projectile";

const TOWER_SELL_PERCENTAGE = 0.75;
const TOWER_RANGE_MULTIPLIER = 50;

export type PlayerConnection = ServerWebSocket<{
  id: string;
  nick: string;
  gameSessionId?: string;
}>;

/**
 * Representa una única sesión de juego (una "sala" o "partida").
 * Gestiona el estado de la partida, los jugadores y la comunicación.
 */
export class GameSession {
  public readonly id: string;
  public readonly hostId: string;
  private connections = new Map<string, PlayerConnection>();
  private engine: GameEngine;
  private mapId: string;

  private state: {
    gameId: string;
    status: "lobby" | "in_progress" | "finished";
    lives: number;
    wave: number;
    players: Map<string, Player>;
    towers: Map<string, Tower>;
    monsters: Map<string, Monster>;
    projectiles: Map<string, Projectile>;
  };

  constructor(host: PlayerConnection, mapId: string) {
    this.id = `game_${Math.random().toString(36).substring(2, 9)}`;
    this.hostId = host.data.id;
    this.mapId = mapId;
    console.log(
      `[${this.id}] Creando nueva sesión de juego (Host: ${this.hostId})...`
    );

    const mapData = gameDataService.maps.get(mapId);
    if (!mapData) {
      throw new Error(
        `No se pudieron encontrar los datos para el mapa: ${mapId}`
      );
    }

    this.state = {
      gameId: this.id,
      status: "lobby",
      lives: mapData.initialLives,
      wave: 0,
      players: new Map(),
      towers: new Map(),
      monsters: new Map(),
      projectiles: new Map(),
    };

    this.addPlayer(host);

    // Crear la instancia del motor, pero no iniciarlo todavía.
    this.engine = new GameEngine(this);
  }

  /**
   * Añade un jugador a la sesión y actualiza el estado.
   */
  public addPlayer(ws: PlayerConnection) {
    if (this.connections.has(ws.data.id)) return;

    this.connections.set(ws.data.id, ws);

    const initialGold =
      gameDataService.maps.get(this.mapId)?.initialGold || 250;
    const newPlayer = new Player(ws.data.id, ws.data.nick, initialGold);
    this.state.players.set(newPlayer.id, newPlayer);

    ws.data.gameSessionId = this.id;
    console.log(
      `[${this.id}] Jugador ${ws.data.nick} (${ws.data.id}) se ha unido.`
    );

    this.broadcastSystemMessage(`${ws.data.nick} se ha unido a la sala.`);
  }

  /**
   * Inicia la partida si el jugador que lo solicita es el host.
   */
  public startGame(playerId: string) {
    if (playerId !== this.hostId) {
      this.sendErrorToPlayer(
        playerId,
        "Solo el host puede iniciar la partida."
      );
      return;
    }

    if (this.state.status !== "lobby") return;

    console.log(`[${this.id}] Partida iniciada por el host.`);
    this.state.status = "in_progress";
    this.state.wave = 1;

    // Notificar a todos los clientes que el juego ha empezado.
    this.broadcast({
      type: "game_started",
      payload: {},
    });

    // Iniciar el motor del juego.
    this.engine.start();
  }

  /**
   * Elimina un jugador de la sesión y actualiza el estado.
   */
  public removePlayer(playerId: string) {
    const playerConnection = this.connections.get(playerId);
    if (!playerConnection) return;

    this.connections.delete(playerId);
    this.state.players.delete(playerId);

    console.log(
      `[${this.id}] Jugador ${playerConnection.data.nick} (${playerId}) se ha desconectado.`
    );
    this.broadcastSystemMessage(
      `${playerConnection.data.nick} ha abandonado la sala.`
    );
  }

  /**
   * Detiene el motor y realiza cualquier otra limpieza necesaria
   * antes de que la sesión sea eliminada.
   */
  public destroy() {
    console.log(`[${this.id}] Destruyendo sesión y deteniendo el motor.`);
    this.engine.stop();
  }

  /**
   * Retransmite un mensaje a todos los jugadores en la sesión.
   */
  public broadcast(message: object) {
    const serializedMessage = JSON.stringify(message);
    for (const client of this.connections.values()) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(serializedMessage);
      }
    }
  }

  /**
   * Retransmite el estado actual del juego a todos los clientes.
   * Este método es llamado por el GameEngine en cada tick.
   */
  public broadcastGameState() {
    const payload = this.getGameStateForClient();
    this.broadcast({
      type: "game_state_update",
      payload: payload,
    });
  }

  /**
   * Construye el objeto de estado del juego serializable para los clientes.
   */
  public getGameStateForClient(): GameState {
    return {
      gameId: this.state.gameId,
      status: this.state.status,
      lives: this.state.lives,
      wave: this.state.wave,
      players: Array.from(this.state.players.values()).map((p) => p.toJSON()),
      towers: Array.from(this.state.towers.values()).map((t) => t.toJSON()),
      monsters: Array.from(this.state.monsters.values()).map((m) => m.toJSON()),
      projectiles: Array.from(this.state.projectiles.values()).map((p) =>
        p.toJSON()
      ),
      mapData: this.getMapData(),
      towerPrototypes: Array.from(gameDataService.towers.values()),
    };
  }

  /**
   * Envía un mensaje del sistema a todos los jugadores.
   */
  public broadcastSystemMessage(message: string) {
    this.broadcast({
      type: "system_message",
      payload: { message: message },
    });
  }

  public getPlayerCount(): number {
    return this.connections.size;
  }

  /**
   * Añade un nuevo monstruo al estado de la sesión.
   */
  public addMonster(monster: Monster) {
    this.state.monsters.set(monster.instanceId, monster);
  }

  /**
   * Obtiene los datos del mapa actual.
   */
  public getMapData() {
    return gameDataService.maps.get(this.mapId);
  }

  /**
   * Obtiene los datos para una oleada específica del mapa actual.
   */
  public getWaveData(waveNumber: number) {
    const mapData = this.getMapData();
    // Las oleadas en el JSON están basadas en 1, el array en 0.
    return mapData?.waves.find((w: any) => w.wave === waveNumber);
  }

  /**
   * Elimina un monstruo porque ha llegado al final del camino.
   * Reduce las vidas del equipo y comprueba si hay derrota.
   */
  public monsterReachedEnd(monsterId: string) {
    if (this.state.monsters.has(monsterId)) {
      this.state.monsters.delete(monsterId);
      this.state.lives--;

      console.log(
        `[${this.id}] Un monstruo llegó al final. Vidas restantes: ${this.state.lives}`
      );

      if (this.state.lives <= 0) {
        this.endGame("defeat");
      } else {
        // Comprobar si esta acción desencadena una condición de victoria
        // (era el último monstruo de la última oleada).
        this.checkVictoryCondition();
      }
    }
  }

  /**
   * Finaliza el juego y notifica a los clientes.
   */
  public endGame(result: "victory" | "defeat") {
    if (this.state.status === "finished") return;

    console.log(`[${this.id}] La partida ha terminado. Resultado: ${result}`);
    this.state.status = "finished";
    this.engine.stop();

    this.broadcast({
      type: "game_over",
      payload: { reason: result },
    });
  }

  /**
   * Devuelve el Map completo de instancias de Monstruo.
   */
  public getMonsters(): Map<string, Monster> {
    return this.state.monsters;
  }

  /**
   * Devuelve el Map completo de instancias de Torre.
   */
  public getTowers(): Map<string, Tower> {
    return this.state.towers;
  }

  /**
   * Devuelve el Map completo de instancias de Proyectil.
   */
  public getProjectiles(): Map<string, Projectile> {
    return this.state.projectiles;
  }

  /**
   * Gestiona el evento de una torre atacando a un monstruo.
   * En lugar de aplicar daño, ahora crea un proyectil.
   */
  public handleTowerAttack(tower: Tower, monster: Monster) {
    const newProjectile = new Projectile(
      tower.position,
      monster.instanceId,
      tower.damage,
      tower.instanceId
    );
    this.state.projectiles.set(newProjectile.id, newProjectile);
  }

  /**
   * Procesa el impacto de un proyectil.
   * Aplica el daño y gestiona la muerte del monstruo si ocurre.
   */
  public handleProjectileImpact(projectileId: string) {
    const projectile = this.state.projectiles.get(projectileId);
    if (!projectile) return;

    // Eliminar el proyectil del juego
    this.state.projectiles.delete(projectileId);

    const monster = this.state.monsters.get(projectile.targetId);
    if (!monster) return; // El monstruo ya murió por otro proyectil

    const impactPosition = { ...monster.position };

    // Aplicar daño y efectos al objetivo principal
    const tower = this.state.towers.get(projectile.towerInstanceId);
    let mainTargetDied = false;

    const damageResult = monster.takeDamage(projectile.damage);
    if (damageResult.died) {
      mainTargetDied = true;
    }

    // Aplicar efectos y daño en área (Splash)
    if (tower) {
      const towerLevelData = tower.getCurrentLevelData();
      const splashRadius =
        (towerLevelData?.splashRadius ?? 0) * TOWER_RANGE_MULTIPLIER;

      // Aplicar efecto al objetivo principal (siempre)
      if (
        towerLevelData?.effect === "slow" &&
        towerLevelData.effectDuration &&
        towerLevelData.effectPotency
      ) {
        monster.applyEffect("slow", {
          duration: towerLevelData.effectDuration,
          potency: towerLevelData.effectPotency,
        });
      }

      // Aplicar a objetivos secundarios si hay radio de splash
      if (splashRadius > 0) {
        for (const otherMonster of this.state.monsters.values()) {
          if (otherMonster.instanceId === monster.instanceId) continue;

          const distance = this.calculateDistance(
            impactPosition,
            otherMonster.position
          );

          if (distance <= splashRadius) {
            // Aplicar daño de splash para torres de cañones
            if (tower.typeId === "cannon_tower") {
              const splashDamageResult = otherMonster.takeDamage(
                projectile.damage
              );
              if (splashDamageResult.died) {
                this.handleMonsterDeath(otherMonster, tower);
              }
            }
            // Aplicar efecto de splash para torres de hielo
            if (
              towerLevelData?.effect === "slow" &&
              towerLevelData.effectDuration &&
              towerLevelData.effectPotency
            ) {
              otherMonster.applyEffect("slow", {
                duration: towerLevelData.effectDuration,
                potency: towerLevelData.effectPotency,
              });
            }
          }
        }
      }
    }

    // Gestionar la muerte del objetivo principal al final
    if (mainTargetDied) {
      this.handleMonsterDeath(monster, tower);
    }
  }

  private handleMonsterDeath(monster: Monster, tower: Tower | undefined) {
    console.log(
      `[${this.id}] Monstruo ${monster.instanceId} destruido por ${
        tower ? `torre ${tower.instanceId}` : "causa desconocida"
      }.`
    );
    this.state.monsters.delete(monster.instanceId);

    const towerOwner = this.state.players.get(tower?.ownerId ?? "");
    if (towerOwner) {
      towerOwner.addGold(monster.goldValue);
      this.sendPlayerStateUpdate(towerOwner);
    }

    this.checkVictoryCondition();
  }

  /**
   * Este método es un placeholder. En una implementación real, se necesitaría
   * una forma de asociar un proyectil con la torre que lo disparó.
   */
  private findTowerThatShotProjectile(
    projectile: Projectile
  ): Tower | undefined {
    // Lógica para encontrar la torre... por ahora no es crucial.
    return undefined;
  }

  public canJoin(): boolean {
    const mapData = this.getMapData();
    if (!mapData) return false;

    const isLobby = this.state.status === "lobby";
    const hasSpace = this.getPlayerCount() < mapData.maxPlayers;

    return isLobby && hasSpace;
  }

  private checkVictoryCondition() {
    // La condición es que el motor nos diga que todas las oleadas terminaron,
    // y que acabamos de matar al último monstruo que quedaba.
    // El GameEngine se encarga de esto en su bucle principal, pero podemos
    // hacer una comprobación aquí también para una respuesta más inmediata.
    const engineKnowsAllWavesAreDone = this.engine.areAllWavesCompleted(); // Necesitaremos este método en el engine
    if (engineKnowsAllWavesAreDone && this.state.monsters.size === 0) {
      this.endGame("victory");
    }
  }

  /**
   * Intenta construir una torre para un jugador en una posición específica.
   * Realiza todas las validaciones necesarias (oro, posición).
   */
  public buildTower(playerId: string, towerTypeId: string, position: Position) {
    const player = this.state.players.get(playerId);
    const towerTemplate = gameDataService.towers.get(towerTypeId);

    if (!player || !towerTemplate) {
      console.warn(
        `[${this.id}] Jugador o torre inválida para construcción: ${playerId}, ${towerTypeId}`
      );
      return;
    }

    const level1Cost = towerTemplate.levels[0]?.cost;
    if (level1Cost === undefined) {
      console.error(`La torre ${towerTypeId} no tiene coste definido.`);
      return;
    }

    if (!player.canAfford(level1Cost)) {
      this.sendErrorToPlayer(playerId, "Oro insuficiente.");
      this.sendPlayerStateUpdate(player);
      return;
    }
    if (!this.isPositionValidForTower(position)) {
      this.sendErrorToPlayer(
        playerId,
        "No se puede construir en esta ubicación."
      );
      return;
    }

    player.spendGold(level1Cost);
    const newTower = new Tower(towerTypeId, playerId, position);
    this.state.towers.set(newTower.instanceId, newTower);

    this.broadcast({
      type: "tower_placed",
      payload: { tower: newTower.toJSON() },
    });
    this.sendPlayerStateUpdate(player);
  }

  private isPositionValidForTower(position: Position): boolean {
    const mapData = this.getMapData();
    if (!mapData) return false;

    const TOWER_FOOTPRINT_RADIUS = 25;

    const isInBuildableArea = (mapData.buildableArea || []).some(
      (area: { x: number; y: number; width: number; height: number }) =>
        position.x >= area.x &&
        position.x <= area.x + area.width &&
        position.y >= area.y &&
        position.y <= area.y + area.height
    );

    if (!isInBuildableArea) return false;

    for (const existingTower of this.state.towers.values()) {
      const dx = existingTower.position.x - position.x;
      const dy = existingTower.position.y - position.y;
      if (Math.sqrt(dx * dx + dy * dy) < TOWER_FOOTPRINT_RADIUS * 2) {
        return false;
      }
    }

    return true;
  }

  private calculateDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private sendErrorToPlayer(playerId: string, message: string) {
    const conn = this.connections.get(playerId);
    if (conn) {
      conn.send(
        JSON.stringify({ type: "error_message", payload: { message } })
      );
    }
  }

  public sendPlayerStateUpdate(player: Player) {
    const conn = this.connections.get(player.id);
    if (conn) {
      conn.send(
        JSON.stringify({
          type: "player_state_update",
          payload: { playerId: player.id, gold: player.gold },
        })
      );
    }
  }

  public upgradeTower(playerId: string, towerInstanceId: string) {
    const player = this.state.players.get(playerId);
    const tower = this.state.towers.get(towerInstanceId);

    if (!player || !tower) return;
    if (tower.ownerId !== playerId) {
      this.sendErrorToPlayer(
        playerId,
        "No puedes mejorar una torre que no es tuya."
      );
      return;
    }

    const upgradeCost = tower.getNextUpgradeCost();
    if (upgradeCost === null) {
      this.sendErrorToPlayer(playerId, "La torre ya está al máximo nivel.");
      return;
    }

    if (!player.canAfford(upgradeCost)) {
      this.sendErrorToPlayer(playerId, "Oro insuficiente para mejorar.");
      this.sendPlayerStateUpdate(player);
      return;
    }

    player.spendGold(upgradeCost);
    tower.upgrade();

    this.broadcast({
      type: "tower_upgraded",
      payload: { tower: tower.toJSON() },
    });
    this.sendPlayerStateUpdate(player);
  }

  public sellTower(playerId: string, towerInstanceId: string) {
    const player = this.state.players.get(playerId);
    const tower = this.state.towers.get(towerInstanceId);

    if (!player || !tower) return;
    if (tower.ownerId !== playerId) {
      this.sendErrorToPlayer(
        playerId,
        "No puedes vender una torre que no es tuya."
      );
      return;
    }

    const sellValue = tower.getSellValue(TOWER_SELL_PERCENTAGE);
    player.addGold(sellValue);
    this.state.towers.delete(towerInstanceId);

    this.broadcast({
      type: "tower_sold",
      payload: { towerInstanceId: tower.instanceId },
    });
    this.sendPlayerStateUpdate(player);
  }

  public handleChatMessage(playerId: string, message: string) {
    const sender = this.state.players.get(playerId);
    if (!sender) return;

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0 || trimmedMessage.length > 200) return;

    this.broadcast({
      type: "chat_message_received",
      payload: { fromPlayer: sender.nick, message: trimmedMessage },
    });
  }

  public getGameData() {
    return gameDataService;
  }
}
