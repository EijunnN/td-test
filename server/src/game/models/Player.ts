import type { Player as PlayerData } from "@shared/types/entities";

/**
 * Representa la instancia de un jugador en el servidor, con su lógica de negocio.
 */
export class Player implements PlayerData {
  public id: string;
  public nick: string;
  public gold: number;

  constructor(id: string, nick: string, initialGold: number) {
    this.id = id;
    this.nick = nick;
    this.gold = initialGold;
  }

  /**
   * Añade una cantidad de oro al jugador.
   */
  public addGold(amount: number): void {
    if (amount > 0) {
      this.gold += amount;
    }
  }

  /**
   * Comprueba si el jugador puede permitirse un coste.
   */
  public canAfford(cost: number): boolean {
    return this.gold >= cost;
  }

  /**
   * Gasta una cantidad de oro si el jugador puede permitírselo.
   * @returns `true` si la transacción fue exitosa, `false` en caso contrario.
   */
  public spendGold(amount: number): boolean {
    if (amount > 0 && this.canAfford(amount)) {
      this.gold -= amount;
      return true;
    }
    return false;
  }

  /**
   * Devuelve el objeto de datos simple para ser enviado al cliente.
   */
  public toJSON(): PlayerData {
    return {
      id: this.id,
      nick: this.nick,
      gold: this.gold,
    };
  }
}
