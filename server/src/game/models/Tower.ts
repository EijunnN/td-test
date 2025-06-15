import type { Tower as TowerData, Position } from "@shared/types/entities";
import { gameDataService } from "../services/GameDataService";

/**
 * Representa una instancia de una torre en el servidor, con su estado y lógica.
 */
export class Tower implements Omit<TowerData, "instanceId" | "level"> {
  public instanceId: string;
  public typeId: string;
  public ownerId: string;
  public position: Position;
  public level: number;

  // Estadísticas actuales basadas en el nivel
  public damage: number;
  public range: number;
  public attackSpeed: number;
  private attackCooldown: number = 0;
  private targetId: string | null = null;
  private totalInvestedGold: number = 0;

  constructor(typeId: string, ownerId: string, position: Position) {
    const towerTpl = gameDataService.towers.get(typeId);
    if (!towerTpl || towerTpl.levels.length === 0) {
      throw new Error(
        `Plantilla de torre con id ${typeId} no encontrada o sin niveles.`
      );
    }

    this.instanceId = `tower_${Math.random().toString(36).substring(2, 9)}`;
    this.typeId = typeId;
    this.ownerId = ownerId;
    this.position = position;
    this.level = 1;

    // Cargar estadísticas del nivel 1
    const levelData = towerTpl.levels[0];
    if (!levelData) {
      throw new Error(`La torre ${typeId} no tiene datos para el nivel 1.`);
    }
    this.damage = levelData.damage;
    this.range = levelData.range;
    this.attackSpeed = levelData.attackSpeed;
    this.totalInvestedGold = levelData.cost;
  }

  /**
   * Actualiza el estado de la torre, llamado en cada tick del juego.
   * Principalmente, reduce el enfriamiento del ataque.
   * @param deltaTime El tiempo transcurrido desde el último tick.
   */
  public update(deltaTime: number) {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }
  }

  /**
   * Comprueba si la torre puede atacar (si su enfriamiento ha terminado).
   */
  public canAttack(): boolean {
    return this.attackCooldown <= 0;
  }

  /**
   * Realiza un ataque, reiniciando el enfriamiento.
   */
  public attack() {
    this.attackCooldown = 1 / this.attackSpeed;
  }

  public getTargetId(): string | null {
    return this.targetId;
  }

  public setTarget(monsterId: string | null) {
    this.targetId = monsterId;
  }

  public clearTarget() {
    this.targetId = null;
  }

  /**
   * Intenta mejorar la torre al siguiente nivel.
   * @returns El coste de la mejora si fue exitosa, de lo contrario `null`.
   */
  public upgrade(): number | null {
    const towerTpl = gameDataService.towers.get(this.typeId);
    if (!towerTpl) return null;

    const nextLevel = this.level + 1;
    const nextLevelData = towerTpl.levels.find((l) => l.level === nextLevel);

    if (!nextLevelData) {
      // No hay más niveles o no se encontró el siguiente nivel
      return null;
    }

    // Actualizar estadísticas
    this.level = nextLevel;
    this.damage = nextLevelData.damage;
    this.range = nextLevelData.range;
    this.attackSpeed = nextLevelData.attackSpeed;
    this.totalInvestedGold += nextLevelData.cost;

    console.log(`[Tower - ${this.instanceId}] Mejorada a nivel ${this.level}.`);

    return nextLevelData.cost;
  }

  /**
   * Devuelve el coste de la siguiente mejora.
   * @returns El coste o `null` si no hay más mejoras.
   */
  public getNextUpgradeCost(): number | null {
    const towerTpl = gameDataService.towers.get(this.typeId);
    if (!towerTpl) return null;

    const nextLevel = this.level + 1;
    const nextLevelData = towerTpl.levels.find((l) => l.level === nextLevel);

    return nextLevelData?.cost ?? null;
  }

  /**
   * Devuelve los datos de la plantilla para el nivel actual de la torre.
   */
  public getCurrentLevelData() {
    const towerTpl = gameDataService.towers.get(this.typeId);
    return towerTpl?.levels.find((l) => l.level === this.level);
  }

  /**
   * Calcula el valor de venta de la torre.
   * @param sellPercentage El porcentaje del valor a devolver (ej. 0.75 para 75%).
   * @returns La cantidad de oro a devolver.
   */
  public getSellValue(sellPercentage: number): number {
    return Math.floor(this.totalInvestedGold * sellPercentage);
  }

  /**
   * Devuelve el objeto de datos simple para ser enviado al cliente.
   */
  public toJSON(): TowerData {
    return {
      instanceId: this.instanceId,
      typeId: this.typeId,
      ownerId: this.ownerId,
      position: this.position,
      level: this.level,
    };
  }
}
