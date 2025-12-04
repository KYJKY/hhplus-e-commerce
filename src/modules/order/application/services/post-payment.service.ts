import { Injectable, Logger } from '@nestjs/common';
import { ExternalDataTransmissionService } from './external-data-transmission.service';
import { ProductRankingService } from '../../../product/application/services/product-ranking.service';
import { DataTransmissionStatus } from '../../domain/enums/data-transmission-status.enum';

/**
 * 후처리 결과
 */
export interface PostPaymentResult {
  dataTransmissionStatus: DataTransmissionStatus;
}

/**
 * Post Payment Service
 *
 * 결제 완료 후 비동기 후처리 작업을 담당하는 Application Service
 * - 외부 데이터 전송
 * - 상품 랭킹 업데이트
 *
 * 모든 작업은 실패해도 결제에 영향을 주지 않습니다.
 */
@Injectable()
export class PostPaymentService {
  private readonly logger = new Logger(PostPaymentService.name);

  constructor(
    private readonly externalDataTransmissionService: ExternalDataTransmissionService,
    private readonly productRankingService: ProductRankingService,
  ) {}

  /**
   * 결제 완료 후 비동기 작업 실행
   *
   * @param orderId 주문 ID
   * @param orderItems 주문 항목 목록
   * @returns 후처리 결과
   */
  async executePostPaymentTasks(
    orderId: number,
    orderItems: Array<{ productId: number; quantity: number }>,
  ): Promise<PostPaymentResult> {
    let dataTransmissionStatus = DataTransmissionStatus.PENDING;

    // 1. 외부 데이터 전송 (비동기, 실패 무시)
    try {
      const transmissionResult =
        await this.externalDataTransmissionService.transmitOrderData(orderId);
      dataTransmissionStatus = transmissionResult.transmissionStatus;
      this.logger.debug(
        `External data transmission completed for order ${orderId}: ${dataTransmissionStatus}`,
      );
    } catch (error) {
      dataTransmissionStatus = DataTransmissionStatus.FAILED;
      this.logger.error(
        `External data transmission failed for order ${orderId}:`,
        error,
      );
    }

    // 2. 상품 랭킹 업데이트 (비동기, 실패 무시)
    try {
      await this.productRankingService.updateRankingByOrderItems(orderItems);
      this.logger.debug(
        `Product ranking updated for order ${orderId}: ${orderItems.length} products`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update product ranking for order ${orderId}:`,
        error,
      );
    }

    return { dataTransmissionStatus };
  }
}
