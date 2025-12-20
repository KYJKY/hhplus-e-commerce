/**
 * [예제] 주문 완료 메시지 Kafka Consumer
 *
 * 예제 동작:
 * - 메시지 수신 시 로그 출력
 * - 메시지 페이로드 파싱 및 검증
 * 
 */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EachMessagePayload } from 'kafkajs';
import {
  KafkaConsumerService,
  KAFKA_TOPICS,
  OrderCompletedPayload,
} from '../../../../common/kafka';

/**
 * [예제] 주문 완료 Kafka Consumer
 *
 * KafkaConsumerService에 order.completed 토픽 핸들러를 등록
 */
@Injectable()
export class OrderCompletedConsumer implements OnModuleInit {
  private readonly logger = new Logger(OrderCompletedConsumer.name);

  constructor(private readonly kafkaConsumerService: KafkaConsumerService) {}

  /**
   * 모듈 초기화 시 핸들러 등록
   */
  onModuleInit(): void {
    this.kafkaConsumerService.registerHandler(
      KAFKA_TOPICS.ORDER_COMPLETED,
      this.handleOrderCompleted.bind(this),
    );

    this.logger.log(
      `[예제] OrderCompletedConsumer가 토픽에 등록됨: ${KAFKA_TOPICS.ORDER_COMPLETED}`,
    );
  }

  /**
   * [예제] 주문 완료 메시지 처리
   *
   * @param payload - Kafka 메시지 페이로드
   */
  private async handleOrderCompleted(
    payload: EachMessagePayload,
  ): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      // 메시지 파싱
      const orderData = this.parseMessage(message.value);

      if (!orderData) {
        this.logger.warn(
          `[예제] 유효하지 않은 메시지 수신: ${topic}[${partition}]`,
        );
        return;
      }

      // [예제] 수신된 주문 데이터 로깅
      this.logger.log(`[예제] ========================================`);
      this.logger.log(`[예제] 주문 완료 메시지 수신`);
      this.logger.log(
        `[예제] 토픽: ${topic}, 파티션: ${partition}, 오프셋: ${message.offset}`,
      );
      this.logger.log(`[예제] 주문 ID: ${orderData.orderId}`);
      this.logger.log(`[예제] 주문 번호: ${orderData.orderNumber}`);
      this.logger.log(`[예제] 사용자 ID: ${orderData.userId}`);
      this.logger.log(
        `[예제] 총 금액: ${orderData.totalAmount.toLocaleString()}원`,
      );
      this.logger.log(
        `[예제] 할인 금액: ${orderData.discountAmount.toLocaleString()}원`,
      );
      this.logger.log(`[예제] 상품 목록: ${orderData.items.length}개`);
      orderData.items.forEach((item, index) => {
        this.logger.log(
          `[예제]   - 상품 ${index + 1}: 상품ID=${item.productId}, 수량=${item.quantity}, 금액=${item.amount.toLocaleString()}원`,
        );
      });
      this.logger.log(`[예제] 주문 생성일: ${orderData.createdAt}`);
      this.logger.log(`[예제] 결제 완료일: ${orderData.paidAt}`);
      this.logger.log(`[예제] ========================================`);

    } catch (error) {
      this.logger.error(
        `[예제] 주문 완료 메시지 처리 실패: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 메시지 버퍼를 OrderCompletedPayload로 파싱
   */
  private parseMessage(value: Buffer | null): OrderCompletedPayload | null {
    if (!value) {
      return null;
    }

    try {
      const parsed = JSON.parse(value.toString()) as OrderCompletedPayload;

      // 필수 필드 검증
      if (
        typeof parsed.orderId !== 'number' ||
        typeof parsed.orderNumber !== 'string' ||
        typeof parsed.userId !== 'number' ||
        !Array.isArray(parsed.items) ||
        typeof parsed.totalAmount !== 'number'
      ) {
        this.logger.warn('[예제] 메시지 검증 실패: 필수 필드 누락');
        return null;
      }

      return parsed;
    } catch {
      this.logger.warn('[예제] JSON 파싱 실패');
      return null;
    }
  }
}
