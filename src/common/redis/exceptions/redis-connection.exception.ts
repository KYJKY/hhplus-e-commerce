import { HttpException, HttpStatus } from '@nestjs/common';

export class RedisConnectionException extends HttpException {
  constructor(error: Error) {
    super(
      {
        code: 'REDIS_CONNECTION_FAILED',
        message: 'Redis connection failed',
        originalError: error.message,
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
