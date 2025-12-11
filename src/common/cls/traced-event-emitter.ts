import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseEvent } from './base-event';
import { EventLoggerService } from './event-logger.service';

/**
 * 이벤트 발행 래퍼 서비스
 *
 * EventEmitter2를 래핑하여 이벤트 발행 시 자동으로 로깅합니다.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class SomeUseCase {
 *   constructor(private readonly tracedEventEmitter: TracedEventEmitter) {}
 *
 *   async execute(): Promise<void> {
 *     const event = new SomeEvent(data);
 *     this.tracedEventEmitter.emit(event);
 *   }
 * }
 * ```
 */
@Injectable()
export class TracedEventEmitter {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly eventLogger: EventLoggerService,
  ) {}

  /**
   * 이벤트 발행 (동기, 로깅 포함)
   *
   * @param event 발행할 이벤트 (BaseEvent 상속)
   * @param additionalContext 추가 로그 컨텍스트
   * @returns 이벤트 발행 성공 여부
   */
  emit<T extends BaseEvent>(
    event: T,
    additionalContext?: Record<string, unknown>,
  ): boolean {
    this.eventLogger.logEventEmitted(event, additionalContext);
    return this.eventEmitter.emit(event.eventName, event);
  }

  /**
   * 비동기 이벤트 발행 (로깅 포함)
   *
   * 모든 리스너가 처리를 완료할 때까지 대기합니다.
   *
   * @param event 발행할 이벤트 (BaseEvent 상속)
   * @param additionalContext 추가 로그 컨텍스트
   * @returns 각 리스너의 반환값 배열
   */
  async emitAsync<T extends BaseEvent>(
    event: T,
    additionalContext?: Record<string, unknown>,
  ): Promise<unknown[]> {
    this.eventLogger.logEventEmitted(event, additionalContext);
    return this.eventEmitter.emitAsync(event.eventName, event);
  }
}
