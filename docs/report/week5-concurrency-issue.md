# 쿠폰 초과 발급 동시성 문제 해결 보고서

---

## 1. 문제 정의

선착순 쿠폰 발급 시, 동시 요청 상황에서 **발급 한도를 초과**하여 쿠폰이 발급될 수 있는 문제.

### 문제 시나리오

- 발급 한도 100개인 쿠폰
- 현재 99개 발급됨
- 2명이 동시에 요청

**기대**: 1명만 성공, 1명은 실패
**실제 (수정 전)**: 2명 모두 성공 가능 → **초과 발급**

---

## 2. 원인 분석

### 기존 코드 (coupon-domain.service.ts)

```typescript
async issueCoupon(userId: number, couponId: number): Promise<UserCoupon> {
  // 1. 발급 가능 여부 체크
  if (!coupon.canIssue()) {
    throw new CouponIssueLimitExceededException(couponId);
  }

  // 2. 발급 카운트 증가 ⚠️ 별도 트랜잭션
  await this.couponRepository.incrementIssuedCount(couponId);

  // 3. 사용자 쿠폰 생성 ⚠️ 별도 트랜잭션
  return await this.userCouponRepository.save(userCoupon);
}
```

### 문제점

**Check-Then-Act 패턴**의 동시성 문제:

| 시간 | 요청 A | 요청 B |
|------|--------|--------|
| T1 | `canIssue()` → true (99 < 100) | - |
| T2 | - | `canIssue()` → true (99 < 100) |
| T3 | `incrementIssuedCount()` → 100 | - |
| T4 | - | `incrementIssuedCount()` → **101** ❌ |

---

## 3. 해결 방법

### 비관락 (Pessimistic Locking) + Transaction

**핵심 아이디어**:
- `SELECT ... FOR UPDATE`로 쿠폰 행을 **명시적으로 잠금**
- 다른 트랜잭션은 락이 해제될 때까지 **대기**
- 순차적으로 처리하여 **초과 발급 완전 차단**

### 수정된 코드

```typescript
async issueCoupon(userId: number, couponId: number): Promise<UserCoupon> {
  // 검증 생략...

  return await this.prisma.transaction(async (tx) => {
    // 1. SELECT ... FOR UPDATE: 비관락으로 쿠폰 행 잠금
    const [couponRow] = await tx.$queryRaw`
      SELECT id, issued_count, issue_limit
      FROM coupons
      WHERE id = ${BigInt(couponId)}
      FOR UPDATE
    `;

    // 2. 발급 한도 체크
    if (couponRow.issued_count >= couponRow.issue_limit) {
      throw new CouponIssueLimitExceededException(couponId);
    }

    // 3. 발급 카운트 증가
    await tx.$executeRaw`
      UPDATE coupons
      SET issued_count = issued_count + 1, updated_at = NOW()
      WHERE id = ${BigInt(couponId)}
    `;

    // 4. 사용자 쿠폰 생성
    const userCouponRecord = await tx.user_coupons.create({
      data: {
        user_id: BigInt(userId),
        coupon_id: BigInt(couponId),
        status: 'UNUSED',
        issued_at: new Date(),
      },
    });

    return UserCoupon.create({...});
  });
}
```

### 동작 원리

| 시간 | 요청 A | 요청 B |
|------|--------|--------|
| T1 | Transaction 시작 | - |
| T2 | `SELECT ... FOR UPDATE` → **락 획득** 🔒 | - |
| T3 | 한도 체크 (99 < 100) → 통과 | - |
| T4 | UPDATE (99 → 100) | - |
| T5 | user_coupon 생성 | - |
| T6 | Transaction Commit → **락 해제** 🔓 | - |
| T7 | - | Transaction 시작 |
| T8 | - | `SELECT ... FOR UPDATE` → 락 획득 |
| T9 | - | 한도 체크 (100 < 100) → **실패** ✅ |
| T10 | - | Exception 발생 |

---

## 4. 테스트 검증

### 테스트 코드 (coupon-issuance-concurrency.e2e-spec.ts)

```typescript
it('동시에 100명이 요청해도 발급 한도(100개)를 초과하지 않아야 함', async () => {
  const coupon = await fixture.createCoupon({
    issueLimit: 100,
    issuedCount: 0,
  });
  const users = await createUsers(100);

  const results = await Promise.allSettled(
    users.map(user => couponDomainService.issueCoupon(user.id, coupon.id))
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;

  expect(succeeded).toBe(100); // ✅ 통과
});

it('동시에 150명이 요청하면 100개만 성공하고 50개는 실패해야 함', async () => {
  const coupon = await fixture.createCoupon({
    issueLimit: 100,
  });
  const users = await createUsers(150);

  const results = await Promise.allSettled(
    users.map(user => couponDomainService.issueCoupon(user.id, coupon.id))
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  expect(succeeded).toBe(100); // ✅ 통과
  expect(failed).toBe(50);     // ✅ 통과
});
```

### 테스트 결과

```
√ 동시에 100명이 요청해도 발급 한도(100개)를 초과하지 않아야 함 (2332 ms)
√ 동시에 150명이 요청하면 100개만 성공하고 50개는 실패해야 함 (2375 ms)
```

**✅ 초과 발급 문제 해결 확인**

---

## 5. 결론

### 적용 기술

1. **비관락 (Pessimistic Locking)**: `SELECT ... FOR UPDATE`로 행 잠금
2. **Prisma Transaction**: 전체 프로세스를 하나의 원자적 작업으로 처리
3. **순차 처리**: 동시 요청을 순차적으로 처리하여 경합 제어

### 비관락을 선택한 이유

- **쿠폰 발급은 경합이 높은 작업**: 인기 쿠폰의 경우 동시 요청 빈번
- **데이터 정합성이 중요**: 초과 발급 절대 불가
- **순차 처리 필요**: 선착순 정책에 따라 먼저 온 요청부터 처리

### 효과

- ✅ 발급 한도 초과 **완벽 방지**
- ✅ 동시 요청을 **순차적으로 안전하게 처리**
- ✅ 트랜잭션으로 **데이터 정합성 보장**
- ✅ **Dead Lock 위험 최소화** (단일 테이블 락)

---