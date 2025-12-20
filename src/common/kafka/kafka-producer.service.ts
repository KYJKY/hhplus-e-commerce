import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, ProducerRecord, RecordMetadata } from 'kafkajs';
import { KAFKA_CONFIG, KAFKA_TOPICS } from './kafka.constants';

/**
 * 주문 완료 메시지 페이로드
 */
export interface OrderCompletedPayload {
  orderId: number;
  orderNumber: string;
  userId: number;
  items: Array<{
    productId: number;
    quantity: number;
    amount: number;
  }>;
  totalAmount: number;
  discountAmount: number;
  createdAt: string;
  paidAt: string;
}

/**
 * Kafka Producer 서비스
 *
 * 주문 데이터를 Kafka 토픽에 발행합니다.
 */
@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    const brokers = this.configService.get<string>('KAFKA_BROKERS')
      ? this.configService.get<string>('KAFKA_BROKERS')!.split(',')
      : KAFKA_CONFIG.DEFAULT_BROKERS;

    this.kafka = new Kafka({
      clientId: KAFKA_CONFIG.CLIENT_ID,
      brokers,
      connectionTimeout: KAFKA_CONFIG.PRODUCER.CONNECTION_TIMEOUT,
      requestTimeout: KAFKA_CONFIG.PRODUCER.REQUEST_TIMEOUT,
      retry: {
        initialRetryTime: 100,
        retries: KAFKA_CONFIG.PRODUCER.RETRY_COUNT,
      },
    });

    this.producer = this.kafka.producer();
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.connect();
    } catch (error) {
      this.logger.warn(
        `Failed to connect to Kafka on startup: ${error.message}. Will retry on first message.`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  /**
   * Kafka Producer 연결
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log('Kafka Producer connected successfully');
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Kafka Producer 연결 해제
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.producer.disconnect();
      this.isConnected = false;
      this.logger.log('Kafka Producer disconnected');
    } catch (error) {
      this.logger.error(`Failed to disconnect Kafka Producer: ${error.message}`);
    }
  }

  /**
   * 주문 완료 메시지 발행
   */
  async sendOrderCompleted(payload: OrderCompletedPayload): Promise<RecordMetadata[]> {
    return this.send({
      topic: KAFKA_TOPICS.ORDER_COMPLETED,
      messages: [
        {
          key: String(payload.orderId),
          value: JSON.stringify(payload),
          headers: {
            'content-type': 'application/json',
            timestamp: new Date().toISOString(),
          },
        },
      ],
    });
  }

  /**
   * 메시지 발행 (공통)
   */
  private async send(record: ProducerRecord): Promise<RecordMetadata[]> {
    // 연결되지 않은 경우 재연결 시도
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const result = await this.producer.send(record);
      this.logger.debug(
        `Message sent to topic ${record.topic}: ${JSON.stringify(result)}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to send message to topic ${record.topic}: ${error.message}`,
      );
      throw error;
    }
  }
}
