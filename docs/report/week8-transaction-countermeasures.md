# Week 8 - 분산 환경 트랜잭션 처리의 한계와 대응 방안

**작성일**: 2025-12-12
**프로젝트**: HHPlus E-Commerce Backend
**분석 범위**: 도메인별 서비스/DB 분리 시 트랜잭션 처리 전략

---

## 1. 배경

### 1.1 현재 아키텍처

현재 시스템은 모놀리식 아키텍처로, 단일 애플리케이션 서버와 단일 MySQL 데이터베이스를 사용한다.

```
+-------------------------------------------------------------+
|                    Monolithic Server                        |
|  +---------+ +---------+ +---------+ +---------+ +-------+  |
|  |  User   | | Product | |  Order  | | Payment | |Coupon |  |
|  | Module  | | Module  | | Module  | | Module  | |Module |  |
|  +----+----+ +----+----+ +----+----+ +----+----+ +---+---+  |
|       |           |           |           |          |      |
|       +-----------+-----------+-----------+----------+      |
|                         |                                   |
|              +----------v----------+                        |
|              |  Single Transaction |                        |
|              |    (ACID 보장)      |                        |
|              +----------+----------+                        |
+--------------------------|----------------------------------+
                           |
                +----------v----------+
                |   MySQL (Single)    |
                |  +----+----+----+   |
                |  |User|Prod|Ordr|   |
                |  | DB | DB | DB |   |
                |  +----+----+----+   |
                +---------------------+
```

### 1.2 확장 시나리오

서비스 성장에 따라 도메인별로 애플리케이션 서버와 DB를 분리하는 마이크로서비스 아키텍처로 전환을 고려한다.

```
+-------------+    +-------------+    +-------------+    +-------------+
|User Service |    |Product Svc  |    |Order Service|    |Payment Svc  |
|  (Server)   |    |  (Server)   |    |  (Server)   |    |  (Server)   |
+------+------+    +------+------+    +------+------+    +------+------+
       |                  |                  |                  |
       v                  v                  v                  v
+--------------+  +--------------+  +--------------+  +--------------+
|   User DB    |  |  Product DB  |  |   Order DB   |  |  Payment DB  |
|   (MySQL)    |  |   (MySQL)    |  |   (MySQL)    |  |   (MySQL)    |
+--------------+  +--------------+  +--------------+  +--------------+
```

### 1.3 문제 정의

도메인별 DB 분리 시, 기존의 단일 트랜잭션으로 보장되던 ACID 특성이 깨진다.

**현재 주문 결제 프로세스 (단일 트랜잭션)**

```typescript
// 현재: 하나의 트랜잭션으로 모든 작업 처리
await prisma.$transaction(async (tx) => {
  // 1. 포인트 차감 (User DB)
  await tx.users.update({ point: { decrement: amount } });

  // 2. 재고 차감 (Product DB)
  await tx.product_options.updateMany({
    where: { stock_quantity: { gte: quantity } },
    data: { stock_quantity: { decrement: quantity } },
  });

  // 3. 쿠폰 사용 처리 (Coupon DB)
  await tx.user_coupons.update({ status: 'USED' });

  // 4. 주문 상태 변경 (Order DB)
  await tx.orders.update({ status: 'PAID' });

  // 5. 결제 정보 생성 (Payment DB)
  await tx.payments.create({ ... });
});
// 실패 시 모든 작업 자동 롤백 (ACID 보장)
```

**DB 분리 후**: 각 DB에 별도 트랜잭션이 필요하며, 부분 실패 시 자동 롤백이 불가능하다.

---

## 2. 분산 트랜잭션의 한계

도메인별로 DB가 분리되면 단일 트랜잭션으로 여러 DB를 묶을 수 없다. 각 서비스는 자체 DB에 대해서만 트랜잭션을 보장할 수 있으며, 서비스 간 작업은 부분 실패(Partial Failure)가 발생할 수 있다.

### 2.1 트랜잭션 분리로 인한 핵심 문제

| 문제 | 설명 | 예시 |
|------|------|------|
| **원자성 상실** | 여러 DB 작업이 all-or-nothing 보장 안됨 | 포인트는 차감됐는데 재고 차감 실패 |
| **데이터 불일치** | 서비스 간 데이터 상태가 불일치 | 주문은 PAID인데 결제 기록 없음 |
| **롤백 불가** | 실패 시 이전 작업 자동 복구 안됨 | 수동으로 포인트 환불 필요 |
| **중복 처리 위험** | 재시도 시 동일 작업 중복 실행 | 포인트 이중 차감 |

### 2.2 분산 환경의 실패 시나리오

```
+-------------------------------------------------------------------+
|                     부분 실패 시나리오                             |
+-------------------------------------------------------------------+
|                                                                   |
|  [정상 흐름]                                                      |
|  포인트 차감 OK -> 재고 차감 OK -> 쿠폰 사용 OK -> 주문 완료 OK   |
|                                                                   |
|  [실패 시나리오 1: 재고 차감 후 네트워크 장애]                    |
|  포인트 차감 OK -> 재고 차감 OK -> X 네트워크 단절                |
|       |              |                                            |
|  차감된 상태      차감된 상태    쿠폰/주문은 처리 안됨            |
|  (복구 필요)     (복구 필요)                                      |
|                                                                   |
|  [실패 시나리오 2: 쿠폰 서비스 장애]                              |
|  포인트 차감 OK -> 재고 차감 OK -> 쿠폰 서비스 DOWN               |
|       |              |              |                             |
|  차감 완료      차감 완료      타임아웃                           |
|                                                                   |
|  [실패 시나리오 3: 결제 서비스 응답 지연]                         |
|  포인트 차감 OK -> 재고 차감 OK -> 쿠폰 사용 OK -> 결제... (지연) |
|                                         재시도? 중복 결제 위험    |
|                                                                   |
+-------------------------------------------------------------------+
```

---

## 3. Saga Pattern을 통한 대응

### 3.1 Saga Pattern 개요

**Saga Pattern**은 분산 트랜잭션을 여러 개의 로컬 트랜잭션으로 분리하고, 실패 시 보상 트랜잭션(Compensating Transaction)을 실행하여 데이터 일관성을 유지하는 패턴이다.

```
+-------------------------------------------------------------------------+
|                         Saga Pattern 개념                               |
+-------------------------------------------------------------------------+
|                                                                         |
|  [기존 분산 트랜잭션 (2PC)]                                             |
|                                                                         |
|    +-------------------+                                                |
|    |   Coordinator     |  <- 단일 장애점 (SPOF)                         |
|    +-------------------+                                                |
|           |                                                             |
|    Prepare -> Commit/Rollback (모든 참여자 대기)                        |
|    - 블로킹 방식                                                        |
|    - 성능 저하                                                          |
|    - 확장성 한계                                                        |
|                                                                         |
+-------------------------------------------------------------------------+
|                                                                         |
|  [Saga Pattern]                                                         |
|                                                                         |
|    T1 -----> T2 -----> T3 -----> T4 -----> 완료                         |
|    |         |         |         |                                      |
|    v         v         v         v                                      |
|    C1 <----- C2 <----- C3 <----- C4 <----- 실패 시 보상                 |
|                                                                         |
|    Ti = 로컬 트랜잭션 (각 서비스에서 독립 실행)                         |
|    Ci = 보상 트랜잭션 (Ti 작업을 되돌림)                                |
|                                                                         |
|    - 논블로킹 방식                                                      |
|    - 높은 확장성                                                        |
|    - 최종적 일관성 (Eventual Consistency)                               |
|                                                                         |
+-------------------------------------------------------------------------+
```

### 3.2 Saga 구현 방식 비교

Saga Pattern은 **Choreography**와 **Orchestration** 두 가지 방식으로 구현할 수 있다.

| 항목 | Choreography (코레오그래피) | Orchestration (오케스트레이션) |
|------|---------------------|----------------------|
| **제어 방식** | 각 서비스가 이벤트 기반 자율 처리 | 중앙 Orchestrator가 흐름 제어 |
| **결합도** | 낮음 (이벤트만 알면 됨) | 중간 (Orchestrator에 의존) |
| **복잡도** | 서비스 증가 시 복잡 | 흐름 파악 용이 |
| **디버깅** | 어려움 (이벤트 추적 필요) | 쉬움 (상태 추적 가능) |
| **단일 장애점** | 없음 | Orchestrator가 될 수 있음 |
| **권장 상황** | 단순한 흐름 (3-4단계) | 복잡한 흐름 (5단계 이상) |

---

## 4. Choreography 방식 Saga 

### 4.1 동작 원리

각 서비스가 이벤트를 발행/구독하여 자율적으로 다음 단계를 처리한다.

```
+------------------------------------------------------------------------+
|                    Saga - Choreography 방식                            |
+------------------------------------------------------------------------+
|                                                                        |
|  [정상 흐름]                                                           |
|                                                                        |
|  Order Service          User Service         Product Service           |
|       |                      |                     |                   |
|  1. 주문 생성 (PENDING)      |                     |                   |
|       |                      |                     |                   |
|       | --- OrderCreated --> |                     |                   |
|       |                      |                     |                   |
|       |                 2. 포인트 차감             |                   |
|       |                      |                     |                   |
|       |                      | -- PointDeducted -> |                   |
|       |                      |                     |                   |
|       |                      |              3. 재고 차감               |
|       |                      |                     |                   |
|       | <------------- StockDeducted ------------- |                   |
|       |                                                                |
|  4. 주문 완료 (PAID)                                                   |
|                                                                        |
+------------------------------------------------------------------------+
|                                                                        |
|  [실패 흐름 - 보상 트랜잭션]                                           |
|                                                                        |
|  Order Service          User Service         Product Service           |
|       |                      |                     |                   |
|       | --- OrderCreated --> |                     |                   |
|       |                      |                     |                   |
|       |                 포인트 차감 OK             |                   |
|       |                      |                     |                   |
|       |                      | -- PointDeducted -> |                   |
|       |                      |                     |                   |
|       |                      |              재고 부족! X               |
|       |                      |                     |                   |
|       |                      | <-- StockFailed --- |                   |
|       |                      |                     |                   |
|       |                 포인트 복구 (보상)         |                   |
|       |                      |                     |                   |
|       | <-- PointRefunded -- |                     |                   |
|       |                                                                |
|  주문 실패 처리 (FAILED)                                               |
|                                                                        |
+------------------------------------------------------------------------+
```

### 4.2 구현 예시 (핵심 코드)

```typescript
// 이벤트 정의
export class OrderCreatedEvent {
  constructor(public orderId: number, public userId: number, public amount: number) {}
}
export class PointDeductedEvent {
  constructor(public orderId: number, public transactionId: number) {}
}
export class StockDeductionFailedEvent {
  constructor(public orderId: number, public pointTransactionId: number) {}
}

// Order Service - Saga 시작
@Injectable()
export class OrderSagaService {
  @OnEvent('stock.deducted')
  async handleStockDeducted(event: StockDeductedEvent): Promise<void> {
    await this.orderRepository.updateStatus(event.orderId, OrderStatus.PAID);
  }

  @OnEvent('point.refunded')
  async handlePointRefunded(event: PointRefundedEvent): Promise<void> {
    await this.orderRepository.updateStatus(event.orderId, OrderStatus.FAILED);
  }
}

// User Service - 이벤트 수신 및 보상 트랜잭션
@Injectable()
export class PointSagaHandler {
  @OnEvent('order.created')
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    try {
      const result = await this.deductPoint(event.userId, event.amount);
      this.eventEmitter.emit('point.deducted', new PointDeductedEvent(event.orderId, result.transactionId));
    } catch (error) {
      this.eventEmitter.emit('point.deduction.failed', { orderId: event.orderId });
    }
  }

  @OnEvent('stock.deduction.failed')
  async handleStockDeductionFailed(event: StockDeductionFailedEvent): Promise<void> {
    await this.refundPoint(event.pointTransactionId);  // 보상 트랜잭션
    this.eventEmitter.emit('point.refunded', { orderId: event.orderId });
  }
}
```

### 4.3 Choreography 장단점

| 장점 | 단점 |
|------|------|
| 서비스 간 낮은 결합도 | 전체 흐름 파악 어려움 |
| 단일 장애점 없음 | 서비스 증가 시 복잡도 증가 |
| 독립적 배포 가능 | 디버깅/모니터링 어려움 |
| 확장성 우수 | 순환 의존성 발생 가능 |

---

## 5. Orchestration 방식 Saga

### 5.1 동작 원리

**Saga Orchestrator**가 전체 워크플로우를 제어하고, 각 서비스에 명령을 보내는 방식이다.

```
+-------------------------------------------------------------------------+
|                    Saga - Orchestration 방식                            |
+-------------------------------------------------------------------------+
|                                                                         |
|                     +-------------------------+                         |
|                     |    Saga Orchestrator    |                         |
|                     |    (OrderPaymentSaga)   |                         |
|                     +------------+------------+                         |
|                                  |                                      |
|     +----------------------------+----------------------------+         |
|     |                            |                            |         |
|     v                            v                            v         |
| +--------+                  +--------+                  +--------+      |
| |  User  |                  |Product |                  |Payment |      |
| |Service |                  |Service |                  |Service |      |
| +--------+                  +--------+                  +--------+      |
|     |                            |                            |         |
|     v                            v                            v         |
| deductPoint()              deductStock()              processPayment()  |
| refundPoint()              restoreStock()                    -          |
|                                                                         |
+-------------------------------------------------------------------------+
|                                                                         |
|  [Saga 실행 흐름]                                                       |
|                                                                         |
|  Orchestrator                                                           |
|       |                                                                 |
|       |---(1) deductPoint() ---> User Service                          |
|       |<------ OK/FAIL --------                                         |
|       |                                                                 |
|       |---(2) deductStock() ---> Product Service                       |
|       |<------ OK/FAIL --------                                         |
|       |                                                                 |
|       |---(3) useCoupon() -----> Coupon Service                        |
|       |<------ OK/FAIL --------                                         |
|       |                                                                 |
|       |---(4) updateOrder() ---> Order Service                         |
|       |<------ OK/FAIL --------                                         |
|       |                                                                 |
|       v                                                                 |
|    [완료/실패]                                                          |
|                                                                         |
+-------------------------------------------------------------------------+
```

### 5.2 Saga 상태 머신

Orchestrator는 **상태 머신**으로 Saga의 진행 상태를 관리한다.

```
+-------------------------------------------------------------------------+
|                        Saga 상태 다이어그램                             |
+-------------------------------------------------------------------------+
|                                                                         |
|                          +----------+                                   |
|                          | STARTED  |                                   |
|                          +----+-----+                                   |
|                               |                                         |
|                               v                                         |
|                    +-------------------+                                |
|                    | POINT_DEDUCTING   |                                |
|                    +-------------------+                                |
|                      |             |                                    |
|                 성공 |             | 실패                               |
|                      v             v                                    |
|          +------------------+  +-------------------+                    |
|          | POINT_DEDUCTED   |  | POINT_FAILED      |----+              |
|          +------------------+  +-------------------+    |              |
|                      |                                  |              |
|                      v                                  |              |
|          +-------------------+                          |              |
|          | STOCK_DEDUCTING   |                          |              |
|          +-------------------+                          |              |
|             |             |                             |              |
|        성공 |             | 실패                        |              |
|             v             v                             |              |
| +------------------+  +-------------------+             |              |
| | STOCK_DEDUCTED   |  | STOCK_FAILED      |----+       |              |
| +------------------+  +-------------------+    |       |              |
|             |                                  |       |              |
|             v                                  v       v              |
| +-------------------+              +-------------------+              |
| | COUPON_USING      |              |   COMPENSATING    |<-------------+
| +-------------------+              +-------------------+              |
|        |         |                         |                          |
|   성공 |         | 실패                    v                          |
|        v         v              +-------------------+                 |
| +--------------+ |              |   COMPENSATED     |                 |
| | ORDER_UPDATE | |              +-------------------+                 |
| +--------------+ |                         |                          |
|        |         |                         v                          |
|        v         +-------------->  +------------+                     |
| +------------+                     |   FAILED   |                     |
| | COMPLETED  |                     +------------+                     |
| +------------+                                                        |
|                                                                         |
+-------------------------------------------------------------------------+
```

### 5.3 구현 예시 (핵심 코드)

```typescript
// Saga 상태 정의
export enum OrderSagaState {
  STARTED = 'STARTED',
  POINT_DEDUCTED = 'POINT_DEDUCTED',
  STOCK_DEDUCTED = 'STOCK_DEDUCTED',
  COMPENSATING = 'COMPENSATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// Saga Orchestrator 핵심 로직
@Injectable()
export class OrderPaymentSagaOrchestrator {
  async execute(command: CreateOrderCommand): Promise<SagaResult> {
    const saga = await this.sagaRepository.create({ ...command, state: OrderSagaState.STARTED });

    try {
      // Step 1: 포인트 차감
      saga.pointTransactionId = await this.userServiceClient.deductPoint(saga);
      saga.state = OrderSagaState.POINT_DEDUCTED;

      // Step 2: 재고 차감
      saga.stockTransactionIds = await this.productServiceClient.deductStock(saga);
      saga.state = OrderSagaState.STOCK_DEDUCTED;

      // Step 3: 주문 완료
      await this.orderRepository.updateStatus(saga.orderId, OrderStatus.PAID);
      saga.state = OrderSagaState.COMPLETED;

      return { success: true, sagaId: saga.id };
    } catch (error) {
      await this.compensate(saga, error);  // 보상 트랜잭션 실행
      return { success: false, sagaId: saga.id, error };
    }
  }

  // 보상 트랜잭션 (역순 실행)
  private async compensate(saga: OrderSagaData, error: Error): Promise<void> {
    saga.state = OrderSagaState.COMPENSATING;

    // 재고 복구
    if (saga.stockTransactionIds?.length) {
      await this.productServiceClient.restoreStock(saga.stockTransactionIds);
    }

    // 포인트 환불
    if (saga.pointTransactionId) {
      await this.userServiceClient.refundPoint(saga.pointTransactionId);
    }

    await this.orderRepository.updateStatus(saga.orderId, OrderStatus.FAILED);
    saga.state = OrderSagaState.FAILED;
  }
}
```

### 5.4 Saga 테이블 설계 (변동될 수 있음)

```sql
-- Saga 상태 저장 테이블
CREATE TABLE order_sagas (
    id VARCHAR(36) PRIMARY KEY,
    order_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    amount INT NOT NULL,
    items JSON NOT NULL,
    coupon_id BIGINT NULL,
    state VARCHAR(50) NOT NULL,
    point_transaction_id BIGINT NULL,
    stock_transaction_ids JSON NULL,
    error TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_id (order_id),
    INDEX idx_state (state),
    INDEX idx_created_at (created_at)
);
```

### 5.5 Orchestration 장단점

| 장점 | 단점 |
|------|------|
| 전체 흐름 파악 용이 | Orchestrator가 SPOF 가능 |
| 상태 추적/디버깅 쉬움 | 서비스 간 결합도 증가 |
| 복잡한 워크플로우 처리 가능 | Orchestrator 로직 복잡 |
| 보상 트랜잭션 관리 용이 | Orchestrator 확장 필요 |

---

## 6. 보상 트랜잭션 설계

### 6.1 보상 매트릭스

| 단계 | 정상 작업 | 보상 작업 | 보상 조건 |
|------|-----------|-----------|-----------|
| 1 | 포인트 차감 | 포인트 환불 | Step 2, 3, 4 실패 시 |
| 2 | 재고 차감 | 재고 복구 | Step 3, 4 실패 시 |
| 3 | 쿠폰 사용 | 쿠폰 복구 | Step 4 실패 시 |
| 4 | 주문 완료 | 주문 실패 처리 | - |

### 6.2 보상 트랜잭션 인터페이스

```typescript
// src/common/saga/compensating-transaction.interface.ts
interface CompensatingTransaction<T> {
  // 정상 작업 실행
  execute(data: T): Promise<ExecuteResult>;

  // 보상 작업 실행 (작업 되돌리기)
  compensate(data: T): Promise<void>;

  // 작업명 (로깅용)
  getName(): string;
}
```

### 6.3 멱등성 보장

네트워크 재시도로 인한 중복 처리를 방지해야 한다.

```typescript
async processWithIdempotency<T>(key: string, operation: () => Promise<T>): Promise<T> {
  // 1. 이미 처리된 요청이면 저장된 결과 반환
  const existing = await this.redis.get(`idempotency:${key}`);
  if (existing) return JSON.parse(existing);

  // 2. 분산 락 획득 (중복 실행 방지)
  const locked = await this.redis.set(`lock:${key}`, '1', 'EX', 30, 'NX');
  if (!locked) throw new DuplicateRequestException(key);

  // 3. 작업 실행 후 결과 저장
  const result = await operation();
  await this.redis.set(`idempotency:${key}`, JSON.stringify(result), 'EX', 86400);
  return result;
}
```

---

## 7. 현재 시스템 적용 방안

### 7.1 단계별 마이그레이션

#### Phase 1: Saga 인프라 구축 (현재 모놀리스 유지)

- Saga 상태 테이블 추가
- Saga Orchestrator 구현 (내부 메서드 호출)
- 보상 트랜잭션 로직 분리

결과: Monolith + Saga Orchestrator (단일 DB, 내부 트랜잭션)

#### Phase 2: 이벤트 기반 전환

- Message Queue 도입 (Kafka/RabbitMQ)
- 이벤트 발행/구독 구조로 전환
- Outbox Pattern 적용 (이벤트 발행 신뢰성)

결과: Monolith + Message Queue + Outbox

#### Phase 3: 서비스 분리

- User/Payment 서비스 분리
- Saga Orchestrator를 HTTP/gRPC 호출로 전환
- 서비스 간 통신 테스트

결과: Main Service(Saga Orchestrator) ↔ User/Payment Service

#### Phase 4: 전체 MSA 전환

- 모든 도메인 서비스 분리
- API Gateway 도입
- 분산 추적 (Jaeger) 통합

---

## 8. 모니터링 및 운영

### 8.1 Saga 상태 모니터링

**핵심 메트릭**:
- `totalSagas`: 전체 Saga 수
- `completedSagas` / `failedSagas`: 성공/실패 수
- `compensationRate`: 보상 발생률 (5% 초과 시 WARNING)

**알림 조건**:
| 조건 | 심각도 | 설명 |
|------|--------|------|
| `compensationRate > 5%` | WARNING | 실패율 높음 |
| `COMPENSATING` 상태 60초 이상 | ERROR | Saga 중단됨 |
| 보상 트랜잭션 실패 | CRITICAL | 수동 개입 필요 |

### 8.2 분산 추적

서비스 간 요청 추적을 위해 **Trace ID**를 전파한다.
- 요청 헤더 `X-Trace-Id`로 전달
- CLS(Continuation-Local Storage)로 컨텍스트 유지
- 로그 및 Saga 상태에 기록

---

## 9. 결론

### 9.1 핵심 요약

| 항목 | 현재 (Monolith) | Saga 적용 후 |
|------|-----------------|--------------|
| **트랜잭션** | 단일 ACID | 로컬 트랜잭션 + 보상 |
| **일관성** | 강한 일관성 | 최종적 일관성 |
| **실패 복구** | 자동 롤백 | 보상 트랜잭션 |
| **확장성** | 제한적 | 높음 |
| **복잡도** | 낮음 | 중간~높음 |

### 9.2 Saga Pattern 선택 기준

| 상황 | 권장 방식 |
|------|-----------|
| 단순한 흐름 (3-4단계) | Choreography |
| 복잡한 흐름 (5단계 이상) | Orchestration |
| 디버깅/모니터링 중요 | Orchestration |
| 서비스 자율성 중요 | Choreography |
| 금전 관련 트랜잭션 | Orchestration (상태 추적 필수) |
