/**
 * DB 연동 시 사용 예정
 */
export class Users {
  // 유저 ID
  id: number;
  // 로그인 아이디
  loginId: string;
  // 로그인 비밀번호 (해시)
  loginPassword: string;
  // 이메일
  email: string;
  // 유저 성함
  name: string;
  // 유저 닉네임
  displayName: string | null;
  // 전화번호
  phoneNumber: string | null;
  // 포인트 잔액
  point: number;
  // 마지막 로그인 일
  lastLoginAt: string | null;
  // 계정 삭제일
  deletedAt: string | null;
  // 생성일
  createdAt: string;
  // 수정일
  updatedAt: string;
}
