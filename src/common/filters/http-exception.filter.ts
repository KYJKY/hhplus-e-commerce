import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import type { ApiResponse } from '../types';

/**
 * HTTP 예외 필터
 * 모든 HTTP 예외를 캐치하여 일관된 형식의 응답을 반환
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse: ApiResponse = {
      success: false,
      error: {
        code: this.getErrorCode(status),
        message: this.getErrorMessage(exceptionResponse),
        details: this.getErrorDetails(exceptionResponse),
      },
      timestamp: new Date().toISOString(),
    };

    this.logger.error(
      `HTTP Exception: ${status} - ${JSON.stringify(errorResponse.error)}`,
    );

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    const statusText = HttpStatus[status];
    return statusText || 'UNKNOWN_ERROR';
  }

  private getErrorMessage(exceptionResponse: string | object): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    const response = exceptionResponse as Record<string, unknown>;
    if (response.message) {
      if (Array.isArray(response.message)) {
        return String(response.message[0]);
      }
      return String(response.message as string);
    }

    return 'An error occurred';
  }

  private getErrorDetails(exceptionResponse: string | object): unknown {
    if (typeof exceptionResponse === 'object') {
      const response = exceptionResponse as Record<string, unknown>;
      if (response.message && Array.isArray(response.message)) {
        return response.message;
      }
    }
    return undefined;
  }
}
