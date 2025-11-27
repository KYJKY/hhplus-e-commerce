import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { Cluster } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private clusterClient: Cluster;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const nodes = this.configService.get('redis.cluster.nodes');
    const options = this.configService.get('redis.cluster.options');

    // 비밀번호 있을 경우 option 추가
    const redisOptions: any = {};
    if (options.password) {
      redisOptions.password = options.password;
    }

    // ioredis 클러스터 클라이언트 생성
    this.clusterClient = new Redis.Cluster(nodes, {
      ...options,
      redisOptions,
    });

    this.clusterClient.on('ready', () => {
      this.logger.log('✅ Redis Cluster connected successfully');
    });

    this.clusterClient.on('error', (err) => {
      this.logger.error('❌ Redis Cluster connection error', err);
      // Fail Fast: 연결 실패 시 프로세스 종료 또는 예외 발생
      // 여기서는 예외를 던져 NestJS 부트스트랩이 실패하도록 유도
      throw err;
    });

    // 초기 연결 확인 (Ping)
    try {
      await this.ping();
      this.logger.log('✅ Redis Cluster Ping Successful!');
    } catch (e) {
      this.logger.error('❌ Initial Redis Ping failed');
      throw e;
    }
  }

  getClient(): Cluster {
    return this.clusterClient;
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.clusterClient.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis ping failed', error);
      return false;
    }
  }
}
