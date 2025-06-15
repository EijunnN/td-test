import type {
  Position,
  Projectile as ProjectileData,
} from "@shared/types/entities";

const PROJECTILE_SPEED = 750; // Píxeles por segundo

/**
 * Representa la instancia de un proyectil en el servidor.
 */
export class Projectile {
  public id: string;
  public position: Position;
  public targetId: string;
  public damage: number; // Daño que infligirá al impactar
  public towerInstanceId: string; // ID de la torre que lo disparó

  constructor(
    startPosition: Position,
    targetId: string,
    damage: number,
    towerInstanceId: string
  ) {
    this.id = `proj_${Math.random().toString(36).substring(2, 9)}`;
    // Clonar la posición para evitar mutaciones no deseadas
    this.position = { ...startPosition };
    this.targetId = targetId;
    this.damage = damage;
    this.towerInstanceId = towerInstanceId;
  }

  /**
   * Mueve el proyectil hacia la posición de un objetivo.
   * @param targetPosition La posición actual del monstruo objetivo.
   * @param deltaTime El tiempo transcurrido desde el último tick.
   * @returns `true` si el proyectil ha alcanzado o superado al objetivo, `false` en caso contrario.
   */
  public move(targetPosition: Position, deltaTime: number): boolean {
    const dx = targetPosition.x - this.position.x;
    const dy = targetPosition.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const moveDistance = PROJECTILE_SPEED * deltaTime;

    if (distance <= moveDistance) {
      // Ha alcanzado o superado al objetivo
      this.position = targetPosition;
      return true;
    } else {
      // Moverse hacia el objetivo
      this.position.x += (dx / distance) * moveDistance;
      this.position.y += (dy / distance) * moveDistance;
      return false;
    }
  }

  /**
   * Devuelve el objeto de datos simple para ser enviado al cliente.
   */
  public toJSON(): ProjectileData {
    return {
      id: this.id,
      position: this.position,
      targetId: this.targetId,
    };
  }
}
