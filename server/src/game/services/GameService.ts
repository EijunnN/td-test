import { GameSession, type PlayerConnection } from "../models/GameSession";
import type { ServerWebSocket } from "bun";

/**
 * GameSessionManager (antes GameService) se encarga de gestionar el ciclo de vida
 * de todas las sesiones de juego activas en el servidor.
 * Se implementa como un singleton.
 */
class GameSessionManager {
  private static instance: GameSessionManager;
  private sessions = new Map<string, GameSession>();

  private constructor() {}

  public static getInstance(): GameSessionManager {
    if (!GameSessionManager.instance) {
      GameSessionManager.instance = new GameSessionManager();
    }
    return GameSessionManager.instance;
  }

  /**
   * Crea una nueva sesión de juego y la registra.
   * @param host La conexión del jugador que crea la partida.
   * @param mapId El ID del mapa para esta sesión.
   * @returns La sesión de juego recién creada.
   */
  public createSession(host: PlayerConnection, mapId: string): GameSession {
    const newSession = new GameSession(host, mapId);
    this.sessions.set(newSession.id, newSession);
    console.log(
      `[GameSessionManager] Sesión ${newSession.id} creada. Sesiones activas: ${this.sessions.size}`
    );
    return newSession;
  }

  /**
   * Encuentra una sesión de juego por su ID.
   * @param sessionId El ID de la sesión a buscar.
   * @returns La instancia de la sesión o undefined si no se encuentra.
   */
  public findSession(sessionId: string): GameSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Elimina una sesión de juego del gestor.
   * Esto debería llamarse cuando una partida termina o todos los jugadores se van.
   * @param sessionId El ID de la sesión a eliminar.
   */
  public removeSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.destroy(); // Detiene el motor y limpia la sesión.
      this.sessions.delete(sessionId);
      console.log(
        `[GameSessionManager] Sesión ${sessionId} eliminada. Sesiones activas: ${this.sessions.size}`
      );
    }
  }

  /**
   * Une a un jugador a una sesión existente si es posible.
   * @param sessionId El ID de la sesión a la que unirse.
   * @param player La conexión del jugador.
   * @returns La sesión si se unió con éxito, de lo contrario undefined.
   */
  public joinSession(
    sessionId: string,
    player: PlayerConnection
  ): GameSession | undefined {
    const session = this.findSession(sessionId);
    if (session && session.canJoin()) {
      console.log(
        `[GameSessionManager] Jugador ${player.data.nick} se une a la sesión existente ${session.id}.`
      );
      session.addPlayer(player);
      return session;
    }
    console.log(
      `[GameSessionManager] No se pudo unir a la sesión ${sessionId}. No encontrada o no disponible.`
    );
    return undefined;
  }
}

// Se exporta la instancia singleton para ser usada en toda la aplicación.
export const gameSessionManager = GameSessionManager.getInstance();

// Se mantiene la exportación del servicio de datos para quien lo necesite directamente.
export { gameDataService } from "./GameDataService";
