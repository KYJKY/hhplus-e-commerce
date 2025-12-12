import { ClsServiceManager } from 'nestjs-cls';
import { v4 as uuidv4 } from 'uuid';
import { CLS_KEYS } from './cls.constants';

/**
 * 모든 도메인 이벤트의 기본 추상 클래스
 *
 * 이벤트 생성 시점에 CLS에서 Trace ID를 자동으로 주입합니다.
 * CLS 컨텍스트가 없는 경우 (예: 스케줄러에서 발행) 새 UUID를 생성합니다.
 *
 * @example
 * ```typescript
 * export class PaymentCompletedEvent extends BaseEvent {
 *   static readonly EVENT_NAME = 'payment.completed';
 *   readonly eventName = PaymentCompletedEvent.EVENT_NAME;
 *
 *   constructor(public readonly orderId: number) {
 *     super(); // Trace ID 자동 주입
 *   }
 * }
 * ```
 */
export abstract class BaseEvent {
  /** 이벤트 고유 ID (이벤트 인스턴스별 고유) */
  public readonly eventId: string;

  /** Trace ID (요청 추적용, CLS에서 자동 주입) */
  public readonly traceId: string;

  /** 이벤트 발생 시각 */
  public readonly occurredAt: Date;

  /** 이벤트 이름 (하위 클래스에서 정의) */
  abstract readonly eventName: string;

  constructor() {
    this.eventId = uuidv4();
    this.occurredAt = new Date();

    // CLS에서 Trace ID 가져오기 (없으면 새로 생성)
    this.traceId = this.resolveTraceId();
  }

  /**
   * CLS 컨텍스트에서 Trace ID를 조회합니다.
   * CLS 컨텍스트가 없거나 Trace ID가 설정되지 않은 경우 새 UUID를 생성합니다.
   */
  private resolveTraceId(): string {
    try {
      const cls = ClsServiceManager.getClsService();
      const traceId = cls?.get<string>(CLS_KEYS.TRACE_ID);
      return traceId ?? uuidv4();
    } catch {
      // CLS 컨텍스트가 없는 경우 (테스트, 스케줄러 등)
      return uuidv4();
    }
  }
}
