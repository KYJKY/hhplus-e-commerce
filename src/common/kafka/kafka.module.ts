import { Global, Module } from '@nestjs/common';
import { KafkaProducerService } from './kafka-producer.service';
import { KafkaConsumerService } from './kafka-consumer.service';

/**
 * Kafka 모듈
 *
 * Global 모듈로 설정하여 모든 모듈에서 Kafka 서비스를 사용할 수 있습니다.
 *
 * - KafkaProducerService: 메시지 발행
 * - KafkaConsumerService: 메시지 소비 (예제)
 */
@Global()
@Module({
  providers: [KafkaProducerService, KafkaConsumerService],
  exports: [KafkaProducerService, KafkaConsumerService],
})
export class KafkaModule {}
