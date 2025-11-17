import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

/**
 * 결제 처리 요청 DTO (내부 API)
 */
export class ProcessPaymentRequest {
  @ApiProperty({ description: '주문 ID', example: 1 })
  @IsNumber()
  orderId: number;

  @ApiProperty({ description: '결제 금액', example: 50000 })
  @IsNumber()
  @Min(1)
  amount: number;
}
