import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import {
  OrderNotFoundException,
  ExternalApiErrorException,
} from '../../domain/exceptions/order.exception';
import { DataTransmissionResultDto } from '../dtos/order.dto';
import { DataTransmissionStatus } from '../../domain/enums/data-transmission-status.enum';

/**
 * FR-O-008: 외부 데이터 전송 (내부 API)
 *
 * 주문 결제 완료 후 비동기로 외부 데이터 플랫폼에 전송
 * - 전송 실패 시 최대 3회 재시도
 * - 전송 실패해도 주문은 정상 처리됨
 */
@Injectable()
export class ExternalDataTransmissionService {
  private readonly logger = new Logger(ExternalDataTransmissionService.name);
  private readonly MAX_RETRY_COUNT = 3;
  private readonly RETRY_DELAY_MS = 1000;

  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
  ) {}

  /**
   * 주문 데이터를 외부 플랫폼에 전송
   */
  async transmitOrderData(orderId: number): Promise<DataTransmissionResultDto> {
    // 주문 조회
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new OrderNotFoundException(orderId);
    }

    // 재시도 로직
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.MAX_RETRY_COUNT; attempt++) {
      try {
        this.logger.log(
          `Attempting to transmit order ${orderId} data (attempt ${attempt}/${this.MAX_RETRY_COUNT})`,
        );

        // 외부 API 호출 (현재는 모의 구현)
        await this.sendToExternalApi(order);

        this.logger.log(`Successfully transmitted order ${orderId} data`);

        return {
          orderId,
          transmissionStatus: DataTransmissionStatus.SUCCESS,
          transmittedAt: new Date().toISOString(),
        };
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Failed to transmit order ${orderId} data (attempt ${attempt}/${this.MAX_RETRY_COUNT}): ${error.message}`,
        );

        if (attempt < this.MAX_RETRY_COUNT) {
          await this.delay(this.RETRY_DELAY_MS * attempt);
        }
      }
    }

    // 모든 재시도 실패
    this.logger.error(
      `Failed to transmit order ${orderId} data after ${this.MAX_RETRY_COUNT} attempts`,
    );

    return {
      orderId,
      transmissionStatus: DataTransmissionStatus.FAILED,
      transmittedAt: new Date().toISOString(),
      failureReason: lastError?.message ?? 'Unknown error',
    };
  }

  /**
   * 외부 API 호출 (모의 구현)
   * 실제로는 HTTP 클라이언트를 사용하여 외부 API 호출
   */
  private async sendToExternalApi(order: any): Promise<void> {
    // TODO: 실제 외부 API 호출 구현
    // 예: HttpService를 사용한 POST 요청
    //
    // const payload = {
    //   orderId: order.id,
    //   orderNumber: order.orderNumber,
    //   userId: order.userId,
    //   items: order.items.map(item => ({
    //     productId: item.productId,
    //     quantity: item.quantity,
    //     amount: item.subtotal,
    //   })),
    //   totalAmount: order.totalAmount,
    //   discountAmount: order.discountAmount,
    //   createdAt: order.createdAt,
    //   paidAt: order.paidAt,
    // };
    //
    // await this.httpService.post('https://external-api.example.com/orders', payload).toPromise();

    // 현재는 성공으로 처리
    return Promise.resolve();
  }

  /**
   * 지연 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
