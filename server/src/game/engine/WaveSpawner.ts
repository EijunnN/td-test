import { Monster } from "../models/Monster";
import type { MonsterStatScaling } from "../models/Monster";
import type { GameSession } from "../models/GameSession";

// Definición interna para la información de un monstruo en una oleada
interface WaveMonsterInfo {
  typeId: string;
  count: number;
  delay: number; // segundos
}

// Estado de un grupo de monstruos que se está generando
interface SpawningGroup {
  monsterTypeId: string;
  remaining: number;
  spawnCooldown: number;
  timeSinceLastSpawn: number;
  scaling?: MonsterStatScaling;
}

/**
 * Gestiona la lógica de generación de monstruos para las oleadas.
 */
export class WaveSpawner {
  private session: GameSession;
  private activeSpawningGroups: SpawningGroup[] = [];
  public isWaveActive: boolean = false;

  private currentWaveNumber: number = 0;
  private timeUntilNextWave: number = 7; // Pausa entre oleadas
  private timeSinceWaveEnded: number = 0;

  constructor(session: GameSession) {
    this.session = session;
  }

  public startNextWave() {
    this.currentWaveNumber++;
    this.startWave(this.currentWaveNumber);
  }

  /**
   * Inicia la generación de una oleada, ya sea predefinida o procedural.
   */
  public startWave(waveNumber: number) {
    const waveData = this.session.getWaveData(waveNumber);
    if (waveData) {
      this.setupPredefinedWave(waveNumber, waveData.monsters);
    } else {
      this.setupProceduralWave(waveNumber);
    }
  }

  private setupPredefinedWave(waveNumber: number, monsters: WaveMonsterInfo[]) {
    console.log(
      `[WaveSpawner - ${this.session.id}] Iniciando Oleada Predefinida ${waveNumber}`
    );
    this.isWaveActive = true;
    this.activeSpawningGroups = monsters.map((info) => ({
      monsterTypeId: info.typeId,
      remaining: info.count,
      spawnCooldown: info.delay,
      timeSinceLastSpawn: info.delay,
    }));
  }

  private setupProceduralWave(waveNumber: number) {
    console.log(
      `[WaveSpawner - ${this.session.id}] Generando Oleada Procedural ${waveNumber}`
    );
    this.isWaveActive = true;

    const predefinedWavesCount = this.session.getMapData()?.waves.length ?? 0;
    const endlessWave = waveNumber - predefinedWavesCount;

    const hpMultiplier = 1 + endlessWave * 0.2;
    const goldMultiplier = 1 + endlessWave * 0.1;
    const monsterCount = 15 + Math.floor(endlessWave * 2);

    const scaling: MonsterStatScaling = { hpMultiplier, goldMultiplier };
    const allMonsterTypes = Array.from(
      this.session.getGameData().monsters.keys()
    );

    const typesForThisWave: string[] = [];
    const numTypes = Math.min(
      allMonsterTypes.length,
      Math.max(1, Math.ceil(endlessWave / 3))
    );

    while (typesForThisWave.length < numTypes && allMonsterTypes.length > 0) {
      const randomIndex = Math.floor(Math.random() * allMonsterTypes.length);
      const randomType = allMonsterTypes[randomIndex];
      if (randomType && !typesForThisWave.includes(randomType)) {
        typesForThisWave.push(randomType);
      }
    }

    if (typesForThisWave.length === 0 && allMonsterTypes.length > 0) {
      typesForThisWave.push(allMonsterTypes[0]!);
    }

    this.activeSpawningGroups = typesForThisWave.map((typeId) => ({
      monsterTypeId: typeId,
      remaining: Math.ceil(monsterCount / typesForThisWave.length),
      spawnCooldown: Math.max(0.2, 1 - endlessWave * 0.05),
      timeSinceLastSpawn: 1,
      scaling,
    }));
  }

  /**
   * Actualiza la lógica de generación, llamado en cada tick del GameEngine.
   */
  public update(deltaTime: number) {
    if (this.isWaveActive) {
      this.updateSpawning(deltaTime);
    } else {
      this.timeSinceWaveEnded += deltaTime;
      if (this.timeSinceWaveEnded >= this.timeUntilNextWave) {
        this.timeSinceWaveEnded = 0;
        this.startNextWave();
      }
    }
  }

  private updateSpawning(deltaTime: number) {
    for (const group of this.activeSpawningGroups) {
      if (group.remaining <= 0) continue;

      group.timeSinceLastSpawn += deltaTime;

      if (group.timeSinceLastSpawn >= group.spawnCooldown) {
        group.timeSinceLastSpawn -= group.spawnCooldown;
        this.spawnMonster(group.monsterTypeId, group.scaling);
        group.remaining--;
      }
    }

    if (this.activeSpawningGroups.every((g) => g.remaining <= 0)) {
      this.isWaveActive = false;
      console.log(
        `[WaveSpawner - ${this.session.id}] Oleada ${this.currentWaveNumber} completada.`
      );
    }
  }

  private spawnMonster(typeId: string, scaling?: MonsterStatScaling) {
    const paths = this.session.getMapData()?.paths;
    if (!paths || paths.length === 0) {
      console.error(
        `[WaveSpawner - ${this.session.id}] No se pudo encontrar un camino para generar monstruos.`
      );
      return;
    }
    const path = paths[Math.floor(Math.random() * paths.length)];

    const startPosition = path.portal;
    const newMonster = new Monster(typeId, path.id, startPosition, scaling);
    this.session.addMonster(newMonster);
  }
}
