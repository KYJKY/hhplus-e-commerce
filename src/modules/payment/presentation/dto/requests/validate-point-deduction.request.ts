import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

/**
 * 포인트 차감 검증 요청 DTO (내부 API)
 */
export class ValidatePointDeductionRequest {
  @ApiProperty({ description: '차감할 금액', example: 50000 })
  @IsNumber()
  @Min(1)
  amount: number;
}
