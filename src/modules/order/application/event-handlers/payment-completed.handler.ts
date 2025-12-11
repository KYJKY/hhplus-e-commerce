import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentCompletedEvent } from '../../domain/events/payment-completed.event';
import { ExternalDataTransmissionService } from '../services/external-data-transmission.service';
import { ProductRankingService } from '../../../product/application/services/product-ranking.service';

/**
 * 결제 완료 이벤트 핸들러
 *
 * 결제 완료 후 비동기 후처리 작업을 수행
 * - 외부 데이터 플랫폼 전송
 * - 상품 판매 랭킹 업데이트
 *
 * 모든 작업은 핵심 로직(결제)에 영향 없음
 */
@Injectable()
export class PaymentCompletedHandler {
  private readonly logger = new Logger(PaymentCompletedHandler.name);

  constructor(
    private readonly externalDataTransmissionService: ExternalDataTransmissionService,
    private readonly productRankingService: ProductRankingService,
  ) {}

  /**
   * 결제 완료 이벤트 처리
   *
   * @OnEvent 데코레이터 옵션:
   * - async: true - 비동기 처리 (이벤트 발행자가 대기하지 않음)
   * - suppressErrors: true - 에러 발생해도 다른 핸들러 실행 계속
   */
  @OnEvent(PaymentCompletedEvent.EVENT_NAME, {
    async: true,
    suppressErrors: true,
  })
  async handlePaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
    this.logger.log(
      `Handling PaymentCompletedEvent for order ${event.orderId}`,
    );

    // 1. 외부 데이터 전송 (실패 무시)
    await this.transmitExternalData(event.orderId);

    // 2. 상품 랭킹 업데이트 (실패 무시)
    await this.updateProductRanking(event.orderItems);
  }

  /**
   * 외부 데이터 플랫폼 전송
   */
  private async transmitExternalData(orderId: number): Promise<void> {
    try {
      const result =
        await this.externalDataTransmissionService.transmitOrderData(orderId);
      this.logger.debug(
        `External data transmission completed for order ${orderId}: ${result.transmissionStatus}`,
      );
    } catch (error) {
      this.logger.error(
        `External data transmission failed for order ${orderId}`,
        error,
      );
      // 에러를 삼키고 계속 진행 (핵심 로직에 영향 없음)
    }
  }

  /**
   * 상품 판매 랭킹 업데이트
   */
  private async updateProductRanking(
    orderItems: Array<{ productId: number; quantity: number }>,
  ): Promise<void> {
    try {
      await this.productRankingService.updateRankingByOrderItems(orderItems);
      this.logger.debug(
        `Product ranking updated: ${orderItems.length} products`,
      );
    } catch (error) {
      this.logger.error('Failed to update product ranking', error);
      // 에러를 삼키고 계속 진행 (핵심 로직에 영향 없음)
    }
  }
}
