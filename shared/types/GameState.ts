import type {
  Monster,
  Player,
  Tower,
  TowerDefinition,
  Projectile,
} from "./entities";
import type { MapData } from "./map";

/**
 * Representa el estado completo de una sesión de juego en un instante de tiempo.
 * Esta es la "única fuente de la verdad" que el servidor envía a los clientes.
 */
export interface GameState {
  gameId: string;
  status: "lobby" | "in_progress" | "finished";

  // Recursos compartidos
  lives: number;

  // Información de la oleada actual
  wave: number;

  // Entidades del juego
  players: Player[];
  towers: Tower[];
  monsters: Monster[];
  projectiles: Projectile[];
  mapData: MapData;
  towerPrototypes: TowerDefinition[];
}
