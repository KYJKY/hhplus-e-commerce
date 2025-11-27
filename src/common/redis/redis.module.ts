import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import { RedisService } from './redis.service';
import { CacheService } from './cache.service';
import { DistributedLockService } from './distributed-lock.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
        const redisPort = configService.get<number>('REDIS_PORT', 6379);
        const redisPassword = configService.get<string>('REDIS_PASSWORD');

        // Redis 연결 URI 생성
        const redisUri = redisPassword
          ? `redis://:${redisPassword}@${redisHost}:${redisPort}`
          : `redis://${redisHost}:${redisPort}`;

        // Keyv Redis 스토어 생성
        const keyvRedis = new KeyvRedis(redisUri);
        const keyv = new Keyv({ store: keyvRedis });

        // 연결 에러 핸들링
        keyv.on('error', (err) => {
          console.error('Redis connection error:', err);
        });

        return {
          stores: [keyv],
          ttl: 0, // 기본 TTL (0 = 무제한, 개별 set에서 지정 가능)
        };
      },
    }),
  ],
  providers: [RedisService, CacheService, DistributedLockService],
  exports: [RedisService, CacheService, DistributedLockService, CacheModule],
})
export class RedisModule {}
