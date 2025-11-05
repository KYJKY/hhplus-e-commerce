import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

/**
 * ParseInt 파이프
 * 문자열을 정수로 변환하고 검증
 */
@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);

    if (isNaN(val)) {
      throw new BadRequestException(
        `Validation failed: "${metadata.data}" must be a valid integer`,
      );
    }

    return val;
  }
}
