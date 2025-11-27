import { HttpException, HttpStatus } from '@nestjs/common';

export class LockAcquisitionTimeoutException extends HttpException {
  constructor(lockKey: string) {
    super(
      {
        code: 'LOCK_TIMEOUT',
        message: 'Failed to acquire lock within timeout period',
        lockKey,
        statusCode: HttpStatus.REQUEST_TIMEOUT,
      },
      HttpStatus.REQUEST_TIMEOUT,
    );
  }
}
