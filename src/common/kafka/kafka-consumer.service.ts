/**
 * [예제] Kafka Consumer 서비스
 *
 * 이 파일은 Kafka Consumer 구현의 예제
 *
 * 주요 기능:
 * - Kafka 토픽 구독 및 메시지 수신
 * - 토픽별 핸들러 등록
 * - 연결 관리 (connect/disconnect)
 */
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { KAFKA_CONFIG } from './kafka.constants';

/**
 * 메시지 핸들러 타입 정의
 */
export type KafkaMessageHandler = (payload: EachMessagePayload) => Promise<void>;

/**
 * [예제] Kafka Consumer 서비스
 *
 * Kafka 토픽을 구독하고 메시지를 수신하는 서비스
 */
@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected = false;
  private readonly handlers = new Map<string, KafkaMessageHandler>();
  private readonly subscribedTopics = new Set<string>();

  constructor(private readonly configService: ConfigService) {
    const brokers = this.configService.get<string>('KAFKA_BROKERS')
      ? this.configService.get<string>('KAFKA_BROKERS')!.split(',')
      : KAFKA_CONFIG.DEFAULT_BROKERS;

    const groupId =
      this.configService.get<string>('KAFKA_CONSUMER_GROUP_ID') ??
      KAFKA_CONFIG.CONSUMER.GROUP_ID;

    this.kafka = new Kafka({
      clientId: `${KAFKA_CONFIG.CLIENT_ID}-consumer`,
      brokers,
    });

    this.consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: KAFKA_CONFIG.CONSUMER.SESSION_TIMEOUT,
      heartbeatInterval: KAFKA_CONFIG.CONSUMER.HEARTBEAT_INTERVAL,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.connect();
    } catch (error) {
      this.logger.warn(
        `[예제] Failed to connect Kafka Consumer on startup: ${error.message}. ` +
          'Consumer will not process messages until connection is established.',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  /**
   * 토픽에 메시지 핸들러 등록
   *
   * @param topic - 구독할 토픽 이름
   * @param handler - 메시지 처리 함수
   *
   * @example
   * ```typescript
   * kafkaConsumer.registerHandler('order.completed', async (payload) => {
   *   const message = JSON.parse(payload.message.value?.toString() ?? '{}');
   *   console.log('Received order:', message);
   * });
   * ```
   */
  registerHandler(topic: string, handler: KafkaMessageHandler): void {
    this.handlers.set(topic, handler);
    this.logger.log(`[예제] Handler registered for topic: ${topic}`);
  }

  /**
   * Kafka Consumer 연결 및 구독 시작
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.consumer.connect();
      this.isConnected = true;
      this.logger.log('[예제] Kafka Consumer connected successfully');

      // 등록된 핸들러의 토픽 구독
      await this.subscribeToRegisteredTopics();

      // 메시지 수신 시작
      await this.startConsuming();
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * 등록된 토픽 구독
   */
  private async subscribeToRegisteredTopics(): Promise<void> {
    for (const topic of this.handlers.keys()) {
      if (!this.subscribedTopics.has(topic)) {
        await this.consumer.subscribe({
          topic,
          fromBeginning: KAFKA_CONFIG.CONSUMER.FROM_BEGINNING,
        });
        this.subscribedTopics.add(topic);
        this.logger.log(`[예제] Subscribed to topic: ${topic}`);
      }
    }
  }

  /**
   * 메시지 소비 시작
   */
  private async startConsuming(): Promise<void> {
    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        const { topic, partition, message } = payload;

        this.logger.debug(
          `[예제] Received message from topic ${topic} [partition ${partition}] ` +
            `at offset ${message.offset}`,
        );

        const handler = this.handlers.get(topic);
        if (handler) {
          try {
            await handler(payload);
          } catch (error) {
            this.logger.error(
              `[예제] Error processing message from topic ${topic}: ${error.message}`,
            );
          }
        } else {
          this.logger.warn(`[예제] No handler registered for topic: ${topic}`);
        }
      },
    });

    this.logger.log('[예제] Kafka Consumer started consuming messages');
  }

  /**
   * Kafka Consumer 연결 해제
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.consumer.disconnect();
      this.isConnected = false;
      this.logger.log('[예제] Kafka Consumer disconnected');
    } catch (error) {
      this.logger.error(
        `[예제] Failed to disconnect Kafka Consumer: ${error.message}`,
      );
    }
  }

  /**
   * 연결 상태 확인
   */
  isConsumerConnected(): boolean {
    return this.isConnected;
  }
}
