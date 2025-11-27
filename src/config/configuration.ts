/**
 * 애플리케이션 설정 인터페이스
 */
export interface Configuration {
  port: number;
  nodeEnv: string;
  logLevel: string;
}

/**
 * 설정 팩토리 함수
 * 환경변수를 읽어서 애플리케이션 설정 객체를 반환
 */
export default (): Configuration => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
});
