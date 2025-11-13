# 유저 (User) 도메인

## 개요
유저 도메인은 이커머스 서비스를 이용하는 사용자의 기본 정보와 프로필을 관리하는 도메인입니다.
회원가입 기능은 구현하지 않으며, 사용자 데이터는 미리 존재한다고 가정합니다.

---

## 주요 기능

### 1. 사용자 정보 조회
- 사용자 ID로 기본 정보를 조회할 수 있습니다.

### 2. 프로필 관리
- 사용자 프로필(이름, 닉네임, 전화번호)을 조회할 수 있습니다.
- 사용자 프로필 정보를 수정할 수 있습니다.

### 3. 배송지 관리
- 여러 개의 배송지를 등록할 수 있습니다 (최대 10개).
- 등록된 배송지 중 1개를 기본 배송지로 설정할 수 있습니다.
- 배송지를 추가, 수정, 삭제할 수 있습니다.
- 주문 시 기본 배송지가 기본값으로 제공되지만, 다른 배송지로도 주문 가능합니다.

---

## 상세 요구사항

### FR-U-001: 사용자 조회
**설명**: 사용자 ID로 사용자 정보를 조회합니다.

**입력**:
- userId (number, 필수): 사용자 ID

**출력**:
- userId: 사용자 ID
- email: 이메일 주소
- profile: 프로필 정보
  - name: 사용자 이름
  - displayName: 닉네임
  - phoneNumber: 전화번호
- createdAt: 가입일시

**비즈니스 규칙**:
- 존재하지 않는 사용자 ID인 경우 에러를 반환합니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음

---

### FR-U-002: 프로필 조회
**설명**: 사용자의 프로필 정보를 조회합니다.

**입력**:
- userId (number, 필수): 사용자 ID

**출력**:
- userId: 사용자 ID
- name: 사용자 이름
- displayName: 닉네임
- phoneNumber: 전화번호
- updatedAt: 마지막 수정 일시

**비즈니스 규칙**:
- 프로필이 생성되지 않은 경우 에러를 반환합니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `PROFILE_NOT_FOUND`: 프로필을 찾을 수 없음

---

### FR-U-003: 프로필 수정
**설명**: 사용자의 프로필 정보를 수정합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- name (string, 선택): 사용자 이름
- displayName (string, 선택): 닉네임
- phoneNumber (string, 선택): 전화번호

**출력**:
- userId: 사용자 ID
- name: 수정된 사용자 이름
- displayName: 수정된 닉네임
- phoneNumber: 수정된 전화번호
- updatedAt: 수정 일시

**비즈니스 규칙**:
- 요청된 필드만 수정됩니다 (부분 수정 가능).
- 닉네임은 2자 이상 20자 이하여야 합니다.
- 전화번호는 하이픈(-) 포함 또는 제외 형식 모두 가능합니다. (예: 010-1234-5678 또는 01012345678)
- 이름은 2자 이상 50자 이하여야 합니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `PROFILE_NOT_FOUND`: 프로필을 찾을 수 없음
- `INVALID_DISPLAY_NAME_LENGTH`: 닉네임 길이가 유효하지 않음
- `INVALID_NAME_LENGTH`: 이름 길이가 유효하지 않음
- `INVALID_PHONE_NUMBER_FORMAT`: 전화번호 형식이 유효하지 않음

---

### FR-U-004: 배송지 목록 조회
**설명**: 사용자의 모든 배송지를 조회합니다.

**입력**:
- userId (number, 필수): 사용자 ID

**출력**:
- userId: 사용자 ID
- addresses: 배송지 목록
  - addressId: 배송지 ID
  - recipientName: 수령인 이름
  - recipientPhone: 수령인 전화번호
  - postalCode: 우편번호
  - addressDefaultText: 기본 주소
  - addressDetailText: 상세 주소
  - isDefault: 기본 배송지 여부
  - createdAt: 등록일시

**비즈니스 규칙**:
- 배송지가 없는 경우 빈 배열을 반환합니다.
- 기본 배송지가 설정된 경우 isDefault가 true인 항목이 1개 존재합니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음

---

### FR-U-005: 배송지 상세 조회
**설명**: 특정 배송지의 상세 정보를 조회합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- addressId (number, 필수): 배송지 ID

**출력**:
- addressId: 배송지 ID
- userId: 사용자 ID
- recipientName: 수령인 이름
- recipientPhone: 수령인 전화번호
- postalCode: 우편번호
- addressDefaultText: 기본 주소
- addressDetailText: 상세 주소
- isDefault: 기본 배송지 여부
- createdAt: 등록일시
- updatedAt: 수정일시

**비즈니스 규칙**:
- 해당 사용자의 배송지가 아닌 경우 에러를 반환합니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `ADDRESS_NOT_FOUND`: 배송지를 찾을 수 없음
- `ADDRESS_ACCESS_DENIED`: 해당 배송지에 접근 권한이 없음

---

### FR-U-006: 배송지 추가
**설명**: 새로운 배송지를 등록합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- recipientName (string, 필수): 수령인 이름
- recipientPhone (string, 필수): 수령인 전화번호
- postalCode (string, 필수): 우편번호
- addressDefaultText (string, 필수): 기본 주소
- addressDetailText (string, 선택): 상세 주소
- isDefault (boolean, 선택): 기본 배송지 설정 여부 (기본값: false)

**출력**:
- addressId: 생성된 배송지 ID
- userId: 사용자 ID
- recipientName: 수령인 이름
- recipientPhone: 수령인 전화번호
- postalCode: 우편번호
- addressDefaultText: 기본 주소
- addressDetailText: 상세 주소
- isDefault: 기본 배송지 여부
- createdAt: 등록일시

**비즈니스 규칙**:
- 배송지는 최대 10개까지 등록 가능합니다.
- isDefault가 true인 경우, 기존 기본 배송지의 isDefault를 false로 변경합니다.
- 첫 번째 배송지는 자동으로 기본 배송지로 설정됩니다.
- 우편번호는 5자리 숫자 형식이어야 합니다.
- 수령인 이름은 2자 이상 50자 이하여야 합니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `MAX_ADDRESS_LIMIT_EXCEEDED`: 최대 배송지 개수(10개) 초과
- `INVALID_RECIPIENT_NAME`: 수령인 이름이 유효하지 않음
- `INVALID_PHONE_NUMBER_FORMAT`: 전화번호 형식이 유효하지 않음
- `INVALID_POSTAL_CODE_FORMAT`: 우편번호 형식이 유효하지 않음 (5자리 숫자)
- `INVALID_ADDRESS`: 주소가 유효하지 않음

---

### FR-U-007: 배송지 수정
**설명**: 기존 배송지 정보를 수정합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- addressId (number, 필수): 배송지 ID
- recipientName (string, 선택): 수령인 이름
- recipientPhone (string, 선택): 수령인 전화번호
- postalCode (string, 선택): 우편번호
- addressDefaultText (string, 선택): 기본 주소
- addressDetailText (string, 선택): 상세 주소

**출력**:
- addressId: 배송지 ID
- userId: 사용자 ID
- recipientName: 수정된 수령인 이름
- recipientPhone: 수정된 수령인 전화번호
- postalCode: 수정된 우편번호
- addressDefaultText: 수정된 기본 주소
- addressDetailText: 수정된 상세 주소
- isDefault: 기본 배송지 여부
- updatedAt: 수정일시

**비즈니스 규칙**:
- 요청된 필드만 수정됩니다 (부분 수정 가능).
- 해당 사용자의 배송지가 아닌 경우 수정이 불가능합니다.
- 유효성 검증 규칙은 배송지 추가와 동일합니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `ADDRESS_NOT_FOUND`: 배송지를 찾을 수 없음
- `ADDRESS_ACCESS_DENIED`: 해당 배송지에 접근 권한이 없음
- `INVALID_RECIPIENT_NAME`: 수령인 이름이 유효하지 않음
- `INVALID_PHONE_NUMBER_FORMAT`: 전화번호 형식이 유효하지 않음
- `INVALID_POSTAL_CODE_FORMAT`: 우편번호 형식이 유효하지 않음
- `INVALID_ADDRESS`: 주소가 유효하지 않음

---

### FR-U-008: 배송지 삭제
**설명**: 배송지를 삭제합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- addressId (number, 필수): 배송지 ID

**출력**:
- success: 삭제 성공 여부
- deletedAddressId: 삭제된 배송지 ID

**비즈니스 규칙**:
- 해당 사용자의 배송지가 아닌 경우 삭제가 불가능합니다.
- 기본 배송지를 삭제하는 경우, 남은 배송지 중 가장 최근에 생성된 배송지가 자동으로 기본 배송지로 설정됩니다.
- 마지막 배송지도 삭제 가능합니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `ADDRESS_NOT_FOUND`: 배송지를 찾을 수 없음
- `ADDRESS_ACCESS_DENIED`: 해당 배송지에 접근 권한이 없음

---

### FR-U-009: 기본 배송지 설정
**설명**: 특정 배송지를 기본 배송지로 설정합니다.

**입력**:
- userId (number, 필수): 사용자 ID
- addressId (number, 필수): 배송지 ID

**출력**:
- addressId: 기본 배송지로 설정된 배송지 ID
- success: 설정 성공 여부

**비즈니스 규칙**:
- 기존 기본 배송지의 isDefault를 false로 변경합니다.
- 해당 배송지의 isDefault를 true로 변경합니다.
- 해당 사용자의 배송지가 아닌 경우 설정이 불가능합니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `ADDRESS_NOT_FOUND`: 배송지를 찾을 수 없음
- `ADDRESS_ACCESS_DENIED`: 해당 배송지에 접근 권한이 없음

---

### FR-U-010: 기본 배송지 조회
**설명**: 사용자의 기본 배송지를 조회합니다.

**입력**:
- userId (number, 필수): 사용자 ID

**출력**:
- addressId: 배송지 ID
- userId: 사용자 ID
- recipientName: 수령인 이름
- recipientPhone: 수령인 전화번호
- postalCode: 우편번호
- addressDefaultText: 기본 주소
- addressDetailText: 상세 주소
- isDefault: 기본 배송지 여부 (항상 true)

**비즈니스 규칙**:
- 기본 배송지가 설정되지 않은 경우 null을 반환합니다.

**예외 처리**:
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음

---

## 비즈니스 규칙 요약

### 프로필 관리 규칙
1. 사용자 프로필 정보는 Users 테이블에 포함되어 있습니다.
2. 사용자 이름은 2자 이상 50자 이하여야 합니다.
3. 닉네임(displayName)은 2자 이상 20자 이하여야 합니다.
4. 전화번호는 하이픈 포함 또는 제외 형식 모두 허용됩니다.

### 배송지 관리 규칙
1. Users와 UserAddress는 1:N 관계입니다 (최대 10개).
2. 사용자당 배송지는 최대 10개까지 등록 가능합니다.
3. 등록된 배송지 중 1개만 기본 배송지(isDefault=true)로 설정할 수 있습니다.
4. 첫 번째 배송지는 자동으로 기본 배송지로 설정됩니다.
5. 기본 배송지 삭제 시, 남은 배송지 중 가장 최근 배송지가 자동으로 기본 배송지가 됩니다.
6. 주문 시 기본 배송지가 기본값으로 제공되지만, 다른 배송지나 새로운 배송지로도 주문 가능합니다.
7. 우편번호는 5자리 숫자 형식이어야 합니다.

---

## 에러 코드

| 코드 | 메시지 | 설명 |
|------|--------|------|
| U001 | USER_NOT_FOUND | 사용자를 찾을 수 없음 |
| U002 | PROFILE_NOT_FOUND | 프로필을 찾을 수 없음 |
| U003 | INVALID_DISPLAY_NAME_LENGTH | 닉네임 길이가 유효하지 않음 (2~20자) |
| U004 | INVALID_NAME_LENGTH | 이름 길이가 유효하지 않음 (2~50자) |
| U005 | INVALID_PHONE_NUMBER_FORMAT | 전화번호 형식이 유효하지 않음 |
| U006 | ADDRESS_NOT_FOUND | 배송지를 찾을 수 없음 |
| U007 | ADDRESS_ACCESS_DENIED | 해당 배송지에 접근 권한이 없음 |
| U008 | MAX_ADDRESS_LIMIT_EXCEEDED | 최대 배송지 개수(10개) 초과 |
| U009 | INVALID_RECIPIENT_NAME | 수령인 이름이 유효하지 않음 |
| U010 | INVALID_POSTAL_CODE_FORMAT | 우편번호 형식이 유효하지 않음 (5자리 숫자) |
| U011 | INVALID_ADDRESS | 주소가 유효하지 않음 |