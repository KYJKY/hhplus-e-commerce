/**
 * Application Layer DTO - User Profile
 * Use Case의 입출력을 정의하며, Domain과 Presentation Layer를 격리
 */

/**
 * 사용자 프로필 조회 결과
 */
export class UserProfileDto {
  constructor(
    public readonly userId: number,
    public readonly name: string,
    public readonly displayName: string | null,
    public readonly phoneNumber: string | null,
    public readonly updatedAt: string | null,
  ) {}
}

/**
 * 사용자 프로필 수정 입력
 */
export class UpdateUserProfileDto {
  constructor(
    public readonly name?: string,
    public readonly displayName?: string,
    public readonly phoneNumber?: string,
  ) {}
}

/**
 * 사용자 정보 조회 결과
 */
export class UserInfoDto {
  constructor(
    public readonly userId: number,
    public readonly email: string,
    public readonly name: string,
    public readonly displayName: string | null,
    public readonly phoneNumber: string | null,
    public readonly createdAt: string,
  ) {}
}
