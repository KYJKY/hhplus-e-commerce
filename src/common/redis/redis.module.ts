import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';
import { RedisService } from './redis.service';
import { CacheInvalidationService } from './cache-invalidation.service';

@Global() // 전역 모듈로 설정
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        // 옵션 가져오기
        const nodes = configService.get('redis.cluster.nodes');
        const options = configService.get('redis.cluster.options');

        // redisOptions 구성
        const redisOptions: any = {};
        if (options.password) {
          redisOptions.password = options.password;
        }

        return {
          store: await redisStore({
            clusterConfig: {
              nodes,
              options: {
                ...options,
                redisOptions,
              },
            },
            ttl: configService.get('cache.ttl.product') * 1000,
          }),
        };
      },
    }),
  ],
  providers: [RedisService, CacheInvalidationService],
  exports: [CacheModule, RedisService, CacheInvalidationService],
})
export class RedisModule {}
