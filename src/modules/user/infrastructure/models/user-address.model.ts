/**
 * DB 연동 시 사용 예정
 * user_address 테이블 모델
 */
export class UserAddresses {
  // 유저 배송지 ID
  id: number;
  // 유저 ID
  userId: number;
  // 수령인 이름
  recipientName: string;
  // 수령인 연락처
  recipientPhone: string;
  // 우편번호
  postalCode: string;
  // 기본 주소
  addressDefaultText: string;
  // 상세 주소
  addressDetailText: string | null;
  // 기본 배송지 여부
  isDefault: boolean;
  // 생성일
  createdAt: string;
  // 수정일
  updatedAt: string;
}
