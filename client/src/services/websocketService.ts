import { EventEmitter } from "events";
import type {
  C2S_Event,
  C2S_Payload,
  S2C_Event,
  S2C_Payload,
} from "@shared/types/socket";

const WS_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:3001";

// Un simple emisor de eventos para desacoplar el servicio de los componentes de React.
type EventHandler<T> = (payload: T) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private emitter = new EventEmitter();
  public isConnected: boolean = false;

  public connect(nick: string): Promise<void> {
    if (this.ws) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const wsUrl = `${WS_URL}/ws?nick=${encodeURIComponent(nick)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.isConnected = true;
        this.emitter.emit("connect");
        resolve();
      };

      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
        this.isConnected = false;
        this.emitter.emit("disconnect");
        this.ws = null;
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.isConnected = false;
        this.emitter.emit("error", "WebSocket connection error.");
        reject(error);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: { type: S2C_Event; payload: S2C_Payload<S2C_Event> } =
            JSON.parse(event.data);
          this.emitter.emit(message.type, message.payload);
        } catch (error) {
          console.error("Failed to parse message:", event.data, error);
        }
      };
    });
  }

  public disconnect(): void {
    this.ws?.close();
  }

  public send<T extends C2S_Event>(type: T, payload: C2S_Payload<T>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, payload });
      this.ws.send(message);
    } else {
      console.error("WebSocket not connected. Cannot send message.");
    }
  }

  public on<T extends S2C_Event>(
    event: T,
    handler: EventHandler<S2C_Payload<T>>
  ) {
    this.emitter.on(event, handler);
  }

  public off<T extends S2C_Event>(
    event: T,
    handler: EventHandler<S2C_Payload<T>>
  ) {
    this.emitter.off(event, handler);
  }
}

export const websocketService = new WebSocketService();
