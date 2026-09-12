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
  /** Topics requested by the caller. They are re-subscribed after reconnect. */
  private subscribedTopics = new Set<string>();
  private callbacks: MQTTCallbacks = {};
  private closing = false;

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

    for (const topic of topicsToSubscribe) {
      if (typeof topic === "string" && topic.trim()) this.subscribedTopics.add(topic.trim());
    }

    // mqtt.js automatically reconnects. Reusing the existing client avoids a
    // second socket and duplicate event handlers while the first one is
    // reconnecting.
    if (this.client) {
      if (this.client.connected && this.subscribedTopics.size > 0) {
        this.subscribe(Array.from(this.subscribedTopics));
      }
      return this.client;
    }

    try {
      this.closing = false;
      this.client = mqtt.connect(this.brokerUrl, {
        clientId: this.clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 4000,
      });

      this.client.on("connect", () => {
        console.log(`[MQTT] Đã kết nối tới broker: ${this.brokerUrl}`);
        if (this.callbacks.onConnect) this.callbacks.onConnect();

        if (this.subscribedTopics.size > 0) {
          this.subscribe(Array.from(this.subscribedTopics));
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
        if (!this.closing) this.callbacks.onDisconnect?.();
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
    const topicList = (Array.isArray(topics) ? topics : [topics])
      .filter((topic): topic is string => typeof topic === "string")
      .map((topic) => topic.trim())
      .filter(Boolean);
    topicList.forEach((topic) => this.subscribedTopics.add(topic));
    if (!this.client || !this.client.connected || topicList.length === 0) return;

    this.client.subscribe(topicList, { qos: 1 }, (err) => {
      if (!err) {
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
      const topicName = typeof topic === "string" ? topic.trim() : "";
      if (!topicName || !this.client || !this.client.connected) {
        console.warn("[MQTT] Không thể xuất bản vì máy khách chưa kết nối");
        resolve(false);
        return;
      }

      let payload: string;
      try {
        payload = typeof message === "string" ? message : JSON.stringify(message);
      } catch (error) {
        console.error(`[MQTT] Payload không thể mã hóa cho ${topicName}:`, error);
        resolve(false);
        return;
      }

      try {
        this.client.publish(topicName, payload, { qos }, (err) => {
          if (err) {
            console.error(`[MQTT] Lỗi xuất bản tới ${topicName}:`, err);
            resolve(false);
          } else {
            console.log(`[MQTT] Đã xuất bản tới ${topicName}`);
            resolve(true);
          }
        });
      } catch (error) {
        console.error(`[MQTT] Lỗi xuất bản tới ${topicName}:`, error);
        resolve(false);
      }
    });
  }

  public isConnected(): boolean {
    return !!(this.client && this.client.connected);
  }

  public disconnect() {
    if (this.client) {
      this.closing = true;
      this.client.end(true);
      this.client = null;
    }
  }
}
