import type { Monster as MonsterData, Position } from "@shared/types/entities";
import { gameDataService } from "../services/GameDataService";

/**
 * Define cómo escalar las estadísticas de un monstruo para oleadas infinitas.
 */
export interface MonsterStatScaling {
  hpMultiplier?: number;
  goldMultiplier?: number;
}

/**
 * Representa una instancia de un monstruo en el servidor, con su estado y lógica.
 */
export class Monster
  implements Omit<MonsterData, "instanceId" | "hp" | "maxHp">
{
  public instanceId: string;
  public typeId: string;
  public position: Position;
  public hp: number;
  public maxHp: number;
  public speed: number;
  public readonly baseSpeed: number; // Velocidad original sin efectos
  public goldValue: number;
  public readonly type: "ground" | "air";

  // Propiedades para el movimiento
  public pathId: string;
  public waypointIndex: number;

  private effects: Map<string, { potency: number; remainingDuration: number }> =
    new Map();

  constructor(
    typeId: string,
    pathId: string,
    startPosition: Position,
    scaling?: MonsterStatScaling
  ) {
    const monsterTpl = gameDataService.monsters.get(typeId);
    if (!monsterTpl) {
      throw new Error(`Plantilla de monstruo con id ${typeId} no encontrada.`);
    }

    this.instanceId = `monster_${Math.random().toString(36).substring(2, 9)}`;
    this.typeId = typeId;
    this.position = { ...startPosition };

    const hpMultiplier = scaling?.hpMultiplier ?? 1;
    const goldMultiplier = scaling?.goldMultiplier ?? 1;

    this.hp = Math.floor(monsterTpl.hp * hpMultiplier);
    this.maxHp = Math.floor(monsterTpl.hp * hpMultiplier);
    this.baseSpeed = monsterTpl.speed;
    this.speed = monsterTpl.speed;
    this.goldValue = Math.floor(monsterTpl.goldValue * goldMultiplier);
    this.type = monsterTpl.type;

    this.pathId = pathId;
    this.waypointIndex = 0; // Empieza apuntando al primer waypoint
  }

  /**
   * Aplica un efecto (como ralentización) al monstruo.
   * Si el efecto ya existe, refresca su duración.
   */
  public applyEffect(
    type: "slow",
    properties: { potency: number; duration: number }
  ) {
    this.effects.set(type, {
      potency: properties.potency,
      remainingDuration: properties.duration,
    });
    this.recalculateSpeed();
  }

  /**
   * Actualiza los efectos activos en el monstruo, llamado en cada tick.
   * @param deltaTime El tiempo desde el último tick.
   */
  public updateEffects(deltaTime: number) {
    let speedNeedsRecalculation = false;
    for (const [type, effect] of this.effects.entries()) {
      effect.remainingDuration -= deltaTime;
      if (effect.remainingDuration <= 0) {
        this.effects.delete(type);
        speedNeedsRecalculation = true;
      }
    }

    if (speedNeedsRecalculation) {
      this.recalculateSpeed();
    }
  }

  /**
   * Recalcula la velocidad actual del monstruo basándose en los efectos activos.
   */
  private recalculateSpeed() {
    const slowEffect = this.effects.get("slow");
    const slowPotency = slowEffect ? slowEffect.potency : 0;
    this.speed = this.baseSpeed * (1 - slowPotency);
  }

  /**
   * Aplica daño al monstruo.
   * @returns Un objeto que indica si el monstruo murió.
   */
  public takeDamage(amount: number): { died: boolean } {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      return { died: true };
    }
    return { died: false };
  }

  /**
   * Devuelve el objeto de datos simple para ser enviado al cliente.
   */
  public toJSON(): MonsterData {
    return {
      instanceId: this.instanceId,
      typeId: this.typeId,
      position: this.position,
      hp: this.hp,
      maxHp: this.maxHp,
    };
  }
}
