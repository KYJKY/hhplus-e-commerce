import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

/**
 * 환경변수 타입 정의
 */
export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * 환경변수 검증 클래스
 */
export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  LOG_LEVEL: string = 'info';

  @IsString()
  REDIS_CLUSTER_NODES: string;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  REDIS_ENABLE_READY_CHECK?: boolean = true;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  CACHE_TTL_PRODUCT?: number = 300;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  CACHE_TTL_POPULAR_PRODUCTS?: number = 60;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  CACHE_TTL_USER?: number = 180;
}

/**
 * 환경변수 검증 함수
 * @param config - 환경변수 객체
 * @returns 검증된 환경변수 객체
 * @throws 검증 실패 시 에러 발생
 */
export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
