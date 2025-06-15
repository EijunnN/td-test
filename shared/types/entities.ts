/**
 * Representa una coordenada en el mapa del juego.
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Representa a un jugador en la sesión de juego.
 */
export interface Player {
  id: string; // ID de la conexión WebSocket o un UUID único
  nick: string;
  gold: number; // El oro es individual para cada jugador
}

/**
 * Representa una torre colocada en el juego.
 */
export interface Tower {
  instanceId: string; // ID único de esta torre específica en el juego
  typeId: string; // ID que corresponde a una definición en towers.json (ej. "arrow_tower_1")
  ownerId: string; // ID del jugador que la construyó
  position: Position;
  level: number;
}

/**
 * Representa un monstruo en el juego.
 */
export interface Monster {
  instanceId: string; // ID único de este monstruo específico
  typeId: string; // ID que corresponde a una definición en monsters.json
  position: Position;
  hp: number;
  maxHp: number;
}

/**
 * Representa un proyectil en movimiento desde una torre a un monstruo.
 */
export interface Projectile {
  id: string;
  position: Position;
  targetId: string; // ID del monstruo objetivo
}

// Datos estáticos de una torre, para la tienda
export interface TowerDefinition {
  id: string;
  name: string;
  targetType: "ground" | "air" | "any";
  levels: {
    level: number;
    cost: number;
    damage: number;
    range: number;
    attackSpeed: number;
    splashRadius?: number;
  }[];
}
