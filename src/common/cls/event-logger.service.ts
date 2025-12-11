import { Injectable, Logger } from '@nestjs/common';
import { BaseEvent } from './base-event';

/**
 * 이벤트 로그 컨텍스트 인터페이스
 */
export interface EventLogContext {
  traceId: string;
  eventId: string;
  eventName: string;
  occurredAt: string;
  [key: string]: unknown;
}

/**
 * 이벤트 발신/수신 로깅을 담당하는 서비스
 *
 * Trace ID를 포함하여 이벤트 흐름을 추적합니다.
 * 로그 형식:
 * - [EMIT] - 이벤트 발행
 * - [RECV] - 이벤트 수신
 * - [DONE] - 처리 완료
 * - [FAIL] - 처리 실패
 */
@Injectable()
export class EventLoggerService {
  private readonly logger = new Logger('EventLogger');

  /**
   * 이벤트 발행 로그
   */
  logEventEmitted(
    event: BaseEvent,
    additionalContext?: Record<string, unknown>,
  ): void {
    const context = this.buildContext(event, additionalContext);
    this.logger.log(
      `[EMIT] ${event.eventName} | traceId=${event.traceId} | eventId=${event.eventId}`,
      JSON.stringify(context),
    );
  }

  /**
   * 이벤트 수신 로그
   */
  logEventReceived(
    event: BaseEvent,
    handlerName: string,
    additionalContext?: Record<string, unknown>,
  ): void {
    const context = this.buildContext(event, {
      handler: handlerName,
      ...additionalContext,
    });
    this.logger.log(
      `[RECV] ${event.eventName} | traceId=${event.traceId} | eventId=${event.eventId} | handler=${handlerName}`,
      JSON.stringify(context),
    );
  }

  /**
   * 이벤트 처리 완료 로그
   */
  logEventHandled(
    event: BaseEvent,
    handlerName: string,
    durationMs: number,
  ): void {
    this.logger.log(
      `[DONE] ${event.eventName} | traceId=${event.traceId} | eventId=${event.eventId} | handler=${handlerName} | duration=${durationMs}ms`,
    );
  }

  /**
   * 이벤트 처리 실패 로그
   */
  logEventFailed(event: BaseEvent, handlerName: string, error: Error): void {
    this.logger.error(
      `[FAIL] ${event.eventName} | traceId=${event.traceId} | eventId=${event.eventId} | handler=${handlerName} | error=${error.message}`,
      error.stack,
    );
  }

  /**
   * 로그 컨텍스트 빌드
   */
  private buildContext(
    event: BaseEvent,
    additional?: Record<string, unknown>,
  ): EventLogContext {
    return {
      traceId: event.traceId,
      eventId: event.eventId,
      eventName: event.eventName,
      occurredAt: event.occurredAt.toISOString(),
      ...additional,
    };
  }
}
