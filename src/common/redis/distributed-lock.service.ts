import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import Redlock, { Lock } from 'redlock';
import {
  LockAcquisitionTimeoutException,
  RedisConnectionException,
} from './exceptions';
import { LockOptions, LockMetadata } from './interfaces';
import { DISTRIBUTED_LOCK_CONFIG } from './distributed-lock.config';
import { LockPubSubChannels } from './keys';

@Injectable()
export class DistributedLockService implements OnModuleDestroy {
  private readonly logger = new Logger(DistributedLockService.name);
  private readonly redlock: Redlock;
  private readonly redisClients: Redis[];
  private readonly pubSubClient: Redis;
  private readonly subscriberClient: Redis;
  private readonly lockListeners = new Map<string, Set<() => void>>();

  constructor(private readonly configService: ConfigService) {
    try {
      // Redis 클라이언트 초기화
      this.redisClients = this.createRedisClients();
      this.pubSubClient = this.createPubSubClient();
      this.subscriberClient = this.createSubscriberClient();

      // Redlock 초기화
      this.redlock = new Redlock(this.redisClients, {
        driftFactor: DISTRIBUTED_LOCK_CONFIG.DEFAULT_DRIFT_FACTOR,
        retryCount: DISTRIBUTED_LOCK_CONFIG.DEFAULT_RETRY_COUNT,
        retryDelay: DISTRIBUTED_LOCK_CONFIG.DEFAULT_RETRY_DELAY,
        retryJitter: DISTRIBUTED_LOCK_CONFIG.DEFAULT_RETRY_JITTER,
        automaticExtensionThreshold: 500,
      });

      // Redlock 이벤트 핸들러
      this.redlock.on('error', (error) => {
        this.logger.error('Redlock error:', error);
      });

      // Pub/Sub 리스너 설정
      this.setupPubSubListener();
    } catch (error) {
      this.logger.error('Failed to initialize DistributedLockService:', error);
      throw new RedisConnectionException(error as Error);
    }
  }

  /**
   * Redis 클라이언트 생성
   */
  private createRedisClients(): Redis[] {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');

    const clientConfig: RedisOptions = {
      host,
      port,
      password: password || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    };

    // 단일 노드 구성 (개발 환경)
    // TODO: 프로덕션에서는 여러 Redis 인스턴스 설정 필요
    return [new Redis(clientConfig)];
  }

  /**
   * Pub/Sub 발행용 클라이언트 생성
   */
  private createPubSubClient(): Redis {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');

    return new Redis({
      host,
      port,
      password: password || undefined,
    });
  }

  /**
   * Pub/Sub 구독용 클라이언트 생성
   */
  private createSubscriberClient(): Redis {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');

    return new Redis({
      host,
      port,
      password: password || undefined,
    });
  }

  /**
   * Pub/Sub 리스너 설정
   */
  private setupPubSubListener(): void {
    this.subscriberClient.on('message', (channel: string, message: string) => {
      this.logger.debug(`Lock release notification received: ${channel}`);

      const listeners = this.lockListeners.get(channel);
      if (listeners) {
        listeners.forEach((listener) => listener());
      }
    });

    this.subscriberClient.on('error', (error) => {
      this.logger.error('Subscriber client error:', error);
    });
  }

  /**
   * 분산 락을 획득하고 콜백을 실행합니다.
   * 락 획득 실패 시 pub/sub을 통해 락 해제를 기다립니다.
   *
   * @param lockKey 락 키
   * @param callback 락 획득 후 실행할 콜백
   * @param options 락 옵션
   * @returns 콜백 실행 결과
   */
  async executeWithLock<T>(
    lockKey: string,
    callback: () => Promise<T>,
    options?: LockOptions,
  ): Promise<T> {
    const ttl = options?.ttl ?? DISTRIBUTED_LOCK_CONFIG.DEFAULT_TTL;
    const totalTimeout =
      options?.totalTimeout ?? DISTRIBUTED_LOCK_CONFIG.DEFAULT_TOTAL_TIMEOUT;
    const startTime = Date.now();

    let lock: Lock | null = null;

    try {
      // 락 획득 시도 (pub/sub 재시도 포함)
      lock = await this.acquireLockWithRetry(lockKey, ttl, totalTimeout);

      const metadata: LockMetadata = {
        lockKey,
        acquiredAt: new Date(),
        ttl,
      };

      this.logger.debug(`Lock acquired: ${lockKey}`, metadata);

      // 비즈니스 로직 실행
      return await callback();
    } catch (error) {
      if (error instanceof LockAcquisitionTimeoutException) {
        throw error;
      }

      this.logger.error(`Error during lock execution: ${lockKey}`, error);
      throw error;
    } finally {
      // 락 해제 및 대기 중인 요청에 알림
      if (lock) {
        try {
          await lock.release();
          await this.notifyLockRelease(lockKey);
          this.logger.debug(`Lock released: ${lockKey}`);
        } catch (error) {
          this.logger.error(`Failed to release lock: ${lockKey}`, error);
        }
      }
    }
  }

  /**
   * Pub/Sub 재시도를 포함한 락 획득
   */
  private async acquireLockWithRetry(
    lockKey: string,
    ttl: number,
    totalTimeout: number,
  ): Promise<Lock> {
    const startTime = Date.now();
    const releaseChannel = this.getReleaseChannel(lockKey);

    // 채널 구독
    await this.subscriberClient.subscribe(releaseChannel);

    try {
      while (Date.now() - startTime < totalTimeout) {
        try {
          // 락 획득 시도
          const lock = await this.redlock.acquire([lockKey], ttl);
          return lock;
        } catch (error) {
          // 락 획득 실패 - pub/sub으로 대기
          const remainingTime = totalTimeout - (Date.now() - startTime);

          if (remainingTime <= 0) {
            break;
          }

          const waitTime = Math.min(
            DISTRIBUTED_LOCK_CONFIG.PUBSUB_WAIT_TIMEOUT,
            remainingTime,
          );

          this.logger.debug(
            `Waiting for lock release notification: ${lockKey} (${waitTime}ms)`,
          );

          // 락 해제 알림 대기
          const lockReleased = await this.waitForLockRelease(
            releaseChannel,
            waitTime,
          );

          if (!lockReleased) {
            this.logger.debug(
              `No lock release notification received, retrying: ${lockKey}`,
            );
          }
        }
      }

      // 타임아웃
      throw new LockAcquisitionTimeoutException(lockKey);
    } finally {
      // 구독 해제
      await this.subscriberClient.unsubscribe(releaseChannel);
      this.lockListeners.delete(releaseChannel);
    }
  }

  /**
   * 락 해제 알림을 기다립니다.
   */
  private async waitForLockRelease(
    releaseChannel: string,
    timeout: number,
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        resolve(false);
      }, timeout);

      const listener = () => {
        clearTimeout(timer);
        resolve(true);
      };

      if (!this.lockListeners.has(releaseChannel)) {
        this.lockListeners.set(releaseChannel, new Set());
      }

      this.lockListeners.get(releaseChannel)!.add(listener);

      // 타임아웃 시 리스너 제거
      timer.unref();
    });
  }

  /**
   * 락 해제를 대기 중인 요청들에게 알림을 보냅니다.
   */
  private async notifyLockRelease(lockKey: string): Promise<void> {
    const releaseChannel = this.getReleaseChannel(lockKey);

    try {
      await this.pubSubClient.publish(releaseChannel, 'released');
      this.logger.debug(`Lock release notification sent: ${releaseChannel}`);
    } catch (error) {
      this.logger.error(
        `Failed to send lock release notification: ${releaseChannel}`,
        error,
      );
    }
  }

  /**
   * 락 해제 채널명 생성
   * @example lock:coupon:issue:123 -> pubsub:lock:release:lock-coupon-issue-123
   */
  private getReleaseChannel(lockKey: string): string {
    return LockPubSubChannels.fromLockKey(lockKey);
  }

  /**
   * 모듈 종료 시 리소스 정리
   */
  async onModuleDestroy() {
    this.logger.log('Shutting down DistributedLockService...');

    try {
      // Redlock 종료
      await this.redlock.quit();

      // Redis 클라이언트 종료
      await Promise.all([
        ...this.redisClients.map((client) => client.quit()),
        this.pubSubClient.quit(),
        this.subscriberClient.quit(),
      ]);

      this.logger.log('DistributedLockService shut down successfully');
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
    }
  }
}
