import { Global, Module } from '@nestjs/common';
import { ClsModule as NestClsModule } from 'nestjs-cls';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { CLS_KEYS } from './cls.constants';
import { EventLoggerService } from './event-logger.service';
import { TracedEventEmitter } from './traced-event-emitter';

/**
 * CLS (Continuation Local Storage) 모듈
 *
 * 요청 컨텍스트를 관리하고 Trace ID를 자동으로 생성/전파합니다.
 * - HTTP 요청 시 X-Trace-Id 헤더가 있으면 사용, 없으면 UUID 생성
 * - 모든 모듈에서 ClsService를 사용할 수 있도록 Global로 설정
 */
@Global()
@Module({
  imports: [
    NestClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: Request) => {
          // X-Trace-Id 헤더가 있으면 사용, 없으면 새로 생성
          const existingTraceId = req.headers['x-trace-id'];
          return (
            (Array.isArray(existingTraceId)
              ? existingTraceId[0]
              : existingTraceId) ?? uuidv4()
          );
        },
        setup: (cls, req: Request) => {
          cls.set(CLS_KEYS.TRACE_ID, cls.getId());
          cls.set(CLS_KEYS.REQUEST_START_TIME, Date.now());
        },
      },
    }),
  ],
  providers: [EventLoggerService, TracedEventEmitter],
  exports: [NestClsModule, EventLoggerService, TracedEventEmitter],
})
export class ClsModule {}
