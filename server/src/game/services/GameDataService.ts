// Definiciones de tipo para los datos que se cargan de los JSON
interface MonsterData {
  id: string;
  name: string;
  hp: number;
  speed: number;
  goldValue: number;
  type: "ground" | "air";
}

interface TowerLevelData {
  level: number;
  cost: number;
  damage: number;
  range: number;
  attackSpeed: number;
  splashRadius?: number;
  effect?: "slow";
  effectDuration?: number;
  effectPotency?: number;
}

interface TowerData {
  id: string;
  name: string;
  targetType: "ground" | "air" | "any";
  levels: TowerLevelData[];
}

// TODO: Definir tipos más estrictos para los datos de mapas más adelante
type MapData = any;

/**
 * GameDataService se encarga de cargar y proporcionar acceso a todos los
 * datos del juego definidos en archivos JSON (monstruos, torres, mapas).
 * Se implementa como un singleton para asegurar que los datos se carguen una sola vez.
 */
class GameDataService {
  private static instance: GameDataService;

  public monsters = new Map<string, MonsterData>();
  public towers = new Map<string, TowerData>();
  public maps = new Map<string, MapData>();

  private constructor() {}

  public static getInstance(): GameDataService {
    if (!GameDataService.instance) {
      GameDataService.instance = new GameDataService();
    }
    return GameDataService.instance;
  }

  /**
   * Carga todos los datos del juego desde los archivos JSON en el directorio /data.
   * Este método debe ser llamado al iniciar el servidor.
   */
  public async loadGameData() {
    try {
      console.log("Cargando datos del juego...");

      await this.loadMonsters();
      await this.loadTowers();
      await this.loadMaps();

      console.log(
        `Datos cargados: ${this.monsters.size} monstruos, ${this.towers.size} torres, ${this.maps.size} mapas.`
      );
    } catch (error) {
      console.error("Error fatal al cargar los datos del juego:", error);
      process.exit(1); // Detiene el servidor si los datos no se pueden cargar
    }
  }

  private async loadMonsters() {
    const file = Bun.file("data/monsters.json");
    const monsterData: MonsterData[] = await file.json();
    for (const monster of monsterData) {
      this.monsters.set(monster.id, monster);
    }
  }

  private async loadTowers() {
    const file = Bun.file("data/towers.json");
    const towerData: TowerData[] = await file.json();
    for (const tower of towerData) {
      this.towers.set(tower.id, tower);
    }
  }

  private async loadMaps() {
    const mapsDir = "data/maps";
    const mapFiles = await new Bun.Glob("*.json").scan(mapsDir);

    for await (const fileName of mapFiles) {
      const file = Bun.file(`${mapsDir}/${fileName}`);
      const mapData: MapData = await file.json();
      this.maps.set(mapData.id, mapData);
    }
  }
}

// Exportamos la instancia única del servicio
export const gameDataService = GameDataService.getInstance();
