# Payment Module DTO 구조 가이드

## 디렉토리 구조

```
presentation/dto/
├── requests/           # HTTP 요청 DTO
│   ├── charge-point.request.ts
│   ├── process-payment.request.ts
│   └── get-point-transactions.request.ts
├── responses/          # HTTP 응답 DTO
│   ├── get-balance.response.ts
│   ├── charge-point.response.ts
│   ├── process-payment.response.ts
│   ├── get-payments.response.ts
│   └── get-payment-detail.response.ts
├── payment.dto.ts      # 기존 파일 (점진적 마이그레이션)
└── index.ts            # Export 관리
```

## 네이밍 규칙

### Request DTO
- 형식: `{동작}.request.ts`
- 예시:
  - `charge-point.request.ts`
  - `process-payment.request.ts`

### Response DTO
- 형식: `{기능}.response.ts`
- 예시:
  - `get-balance.response.ts`
  - `charge-point.response.ts`

## 마이그레이션 계획

기존 DTO 파일들은 점진적으로 새로운 구조로 이동될 예정입니다:
1. 새로운 API는 새로운 구조 사용
2. 기존 API는 리팩토링 시 이동
3. index.ts에서 모든 DTO export 관리
