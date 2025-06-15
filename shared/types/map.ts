import type { Position } from "./entities";

export interface BuildArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MapPath {
  id: string;
  portal: Position;
  waypoints: Position[];
}

export interface WaveMonsterInfo {
  typeId: string;
  count: number;
  delay: number; // segundos
}

export interface WaveDefinition {
  wave: number;
  monsters: WaveMonsterInfo[];
}

export interface MapData {
  id: string;
  name: string;
  maxPlayers: number;
  initialLives: number;
  initialGold: number;
  waves: WaveDefinition[];
  buildableArea: BuildArea[];
  paths: MapPath[];
}
