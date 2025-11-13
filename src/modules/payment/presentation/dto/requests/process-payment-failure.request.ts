import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

/**
 * 결제 실패 처리 요청 DTO (내부 API)
 */
export class ProcessPaymentFailureRequest {
  @ApiProperty({ description: '주문 ID', example: 1 })
  @IsNumber()
  orderId: number;

  @ApiProperty({ description: '시도한 결제 금액', example: 50000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: '실패 사유',
    example: '포인트 잔액 부족',
  })
  @IsString()
  failureReason: string;
}
