import { Logger } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { CLS_KEYS } from './cls.constants';
import { BaseEvent } from './base-event';
import { EventLoggerService } from './event-logger.service';

/**
 * 이벤트 리스너 베이스 클래스
 *
 * Trace ID 설정과 로깅을 자동화합니다.
 * 핸들러 클래스는 이 클래스를 상속받아 사용합니다.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class PaymentCompletedHandler extends TracedEventListener {
 *   protected readonly logger = new Logger(PaymentCompletedHandler.name);
 *
 *   constructor(
 *     clsService: ClsService,
 *     eventLogger: EventLoggerService,
 *     private readonly someService: SomeService,
 *   ) {
 *     super(clsService, eventLogger);
 *   }
 *
 *   @OnEvent(PaymentCompletedEvent.EVENT_NAME, { async: true })
 *   async handlePaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
 *     await this.handleWithTracing(event, 'handlePaymentCompleted', async () => {
 *       // 실제 로직
 *     });
 *   }
 * }
 * ```
 */
export abstract class TracedEventListener {
  protected abstract readonly logger: Logger;

  constructor(
    protected readonly clsService: ClsService,
    protected readonly eventLogger: EventLoggerService,
  ) {}

  /**
   * 이벤트 처리를 위한 래퍼 메서드
   *
   * 1. 이벤트의 Trace ID를 CLS 컨텍스트에 설정
   * 2. 이벤트 수신 로깅
   * 3. 핸들러 실행
   * 4. 완료/실패 로깅
   *
   * @param event 처리할 이벤트
   * @param handlerName 핸들러 이름 (로깅용)
   * @param handler 실제 이벤트 처리 로직
   */
  protected async handleWithTracing<T extends BaseEvent>(
    event: T,
    handlerName: string,
    handler: () => Promise<void>,
  ): Promise<void> {
    const fullHandlerName = `${this.constructor.name}.${handlerName}`;

    // CLS 컨텍스트에서 실행하여 Trace ID 전파
    await this.clsService.run(async () => {
      // Trace ID를 CLS에 설정
      this.clsService.set(CLS_KEYS.TRACE_ID, event.traceId);

      const startTime = Date.now();
      this.eventLogger.logEventReceived(event, fullHandlerName);

      try {
        await handler();
        this.eventLogger.logEventHandled(
          event,
          fullHandlerName,
          Date.now() - startTime,
        );
      } catch (error) {
        this.eventLogger.logEventFailed(
          event,
          fullHandlerName,
          error as Error,
        );
        throw error;
      }
    });
  }

  /**
   * 현재 Trace ID 조회
   */
  protected getTraceId(): string | undefined {
    return this.clsService.get(CLS_KEYS.TRACE_ID);
  }
}
