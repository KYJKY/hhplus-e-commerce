import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

/**
 * 포인트 충전 요청 DTO
 */
export class ChargePointRequest {
  @ApiProperty({
    description: '충전할 포인트 금액 (1,000 ~ 1,000,000원, 1,000원 단위)',
    example: 50000,
  })
  @IsNumber()
  @Min(1000)
  amount: number;
}
