/**
 * 애플리케이션 설정 인터페이스
 */
export interface Configuration {
  port: number;
  nodeEnv: string;
  logLevel: string;
  redis: {
    cluster: {
      nodes: { host: string; port: number }[];
      options: {
        password?: string;
        enableReadyCheck: boolean;
      };
    };
  };
  cache: {
    ttl: {
      product: number;
      popularProducts: number;
      user: number;
    };
  };
}

function parseRedisNodes(nodes: string): { host: string; port: number }[] {
  if (!nodes) return [];
  return nodes.split(',').map((node) => {
    const [host, port] = node.split(':');
    return { host, port: parseInt(port, 10) };
  });
}

/**
 * 설정 팩토리 함수
 * 환경변수를 읽어서 애플리케이션 설정 객체를 반환
 */
export default (): Configuration => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  redis: {
    cluster: {
      nodes: parseRedisNodes(
        process.env.REDIS_CLUSTER_NODES ||
          'localhost:7000,localhost:7001,localhost:7002,localhost:7003,localhost:7004,localhost:7005',
      ),
      options: {
        password: process.env.REDIS_PASSWORD,
        enableReadyCheck: process.env.REDIS_ENABLE_READY_CHECK === 'true',
      },
    },
  },
  cache: {
    ttl: {
      product: parseInt(process.env.CACHE_TTL_PRODUCT || '300', 10),
      popularProducts: parseInt(
        process.env.CACHE_TTL_POPULAR_PRODUCTS || '60',
        10,
      ),
      user: parseInt(process.env.CACHE_TTL_USER || '180', 10),
    },
  },
});
