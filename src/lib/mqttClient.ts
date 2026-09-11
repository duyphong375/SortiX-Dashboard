// Khởi tạo và quản lý kết nối MQTT WebSocket, đăng ký và xuất bản bản tin
import mqtt, { MqttClient } from "mqtt";

export interface MQTTCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (err: Error) => void;
  onMessage?: (topic: string, message: string) => void;
}

export class SorterMQTTService {
  private client: MqttClient | null = null;
  private brokerUrl: string;
  private clientId: string;
  private subscribedTopics: string[] = [];
  private callbacks: MQTTCallbacks = {};

  constructor(brokerUrl?: string, clientId?: string) {
    this.brokerUrl =
      brokerUrl ||
      process.env.NEXT_PUBLIC_MQTT_BROKER_URL ||
      "wss://broker.emqx.io:8084/mqtt";
    this.clientId =
      clientId ||
      (process.env.NEXT_PUBLIC_MQTT_CLIENT_ID || "pbl3_dash_") +
        Math.random().toString(16).substring(2, 8);
  }

  public setCallbacks(callbacks: MQTTCallbacks) {
    this.callbacks = callbacks;
  }

  public connect(topicsToSubscribe: string[] = []): MqttClient | null {
    if (typeof window === "undefined") return null;

    if (this.client && this.client.connected) {
      return this.client;
    }

    try {
      this.client = mqtt.connect(this.brokerUrl, {
        clientId: this.clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 4000,
      });

      this.client.on("connect", () => {
        console.log(`[MQTT] Đã kết nối tới broker: ${this.brokerUrl}`);
        if (this.callbacks.onConnect) this.callbacks.onConnect();

        if (topicsToSubscribe.length > 0) {
          this.subscribe(topicsToSubscribe);
        }
      });

      this.client.on("message", (topic, payload) => {
        if (this.callbacks.onMessage) {
          this.callbacks.onMessage(topic, payload.toString());
        }
      });

      this.client.on("error", (err) => {
        console.error("[MQTT] Lỗi kết nối:", err);
        if (this.callbacks.onError) this.callbacks.onError(err);
      });

      this.client.on("close", () => {
        console.log("[MQTT] Mất kết nối broker");
        if (this.callbacks.onDisconnect) this.callbacks.onDisconnect();
      });

      return this.client;
    } catch (e: unknown) {
      console.error("[MQTT] Không thể khởi tạo:", e);
      const error = e instanceof Error ? e : new Error(String(e));
      if (this.callbacks.onError) this.callbacks.onError(error);
      return null;
    }
  }

  public subscribe(topics: string | string[]) {
    if (!this.client || !this.client.connected) return;

    const topicList = Array.isArray(topics) ? topics : [topics];
    this.client.subscribe(topicList, { qos: 1 }, (err) => {
      if (!err) {
        this.subscribedTopics = Array.from(new Set([...this.subscribedTopics, ...topicList]));
        console.log("[MQTT] Đã đăng ký các topic:", topicList);
      } else {
        console.error("[MQTT] Lỗi đăng ký topic:", err);
      }
    });
  }

  public publish(
    topic: string,
    message: string | object,
    qos: 0 | 1 | 2 = 1
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.client || !this.client.connected) {
        console.warn("[MQTT] Không thể xuất bản vì máy khách chưa kết nối");
        resolve(false);
        return;
      }

      const payload = typeof message === "string" ? message : JSON.stringify(message);
      this.client.publish(topic, payload, { qos }, (err) => {
        if (err) {
          console.error(`[MQTT] Lỗi xuất bản tới ${topic}:`, err);
          resolve(false);
        } else {
          console.log(`[MQTT] Đã xuất bản tới ${topic}`);
          resolve(true);
        }
      });
    });
  }

  public isConnected(): boolean {
    return !!(this.client && this.client.connected);
  }

  public disconnect() {
    if (this.client) {
      this.client.end(true);
      this.client = null;
    }
  }
}
