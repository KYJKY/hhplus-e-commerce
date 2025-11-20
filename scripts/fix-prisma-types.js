const fs = require('fs');
const path = require('path');

/**
 * Prisma 생성 파일의 타입 에러 수정 스크립트
 *
 * 문제: Prisma 생성 파일에서 DbNull, JsonNull, AnyNull의 타입 추론 에러 발생
 * 해결: 명시적 타입 어노테이션 추가
 *
 * 참고: docs/PRISMA_BUILD_FIX.md
 */

const PRISMA_CLIENT_PATHS = [
  // pnpm 구조에서 생성되는 경로 패턴
  './node_modules/.pnpm/@prisma+client@',
  './node_modules/@prisma/client',
];

function findPrismaNamespaceFile() {
  // pnpm 구조에서 Prisma Client 경로 찾기
  const nodeModulesPath = path.join(process.cwd(), 'node_modules', '.pnpm');

  if (!fs.existsSync(nodeModulesPath)) {
    console.log('⚠️  pnpm node_modules not found. Skipping fix.');
    return null;
  }

  const dirs = fs.readdirSync(nodeModulesPath);
  const prismaClientDir = dirs.find(dir => dir.startsWith('@prisma+client@'));

  if (!prismaClientDir) {
    console.log('⚠️  Prisma Client directory not found. Skipping fix.');
    return null;
  }

  const filePath = path.join(
    nodeModulesPath,
    prismaClientDir,
    'node_modules',
    '@prisma',
    'client',
    'index.d.ts'
  );

  if (fs.existsSync(filePath)) {
    return filePath;
  }

  // 대체 경로 확인
  const altFilePath = path.join(
    process.cwd(),
    'node_modules',
    '@prisma',
    'client',
    'index.d.ts'
  );

  if (fs.existsSync(altFilePath)) {
    return altFilePath;
  }

  console.log('⚠️  prismaNamespace.ts not found. Skipping fix.');
  return null;
}

function fixPrismaTypes() {
  const filePath = findPrismaNamespaceFile();

  if (!filePath) {
    return;
  }

  console.log(`📝 Checking Prisma types in: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // DbNull, JsonNull, AnyNull 타입 어노테이션 패턴 검사
  const patterns = [
    {
      search: /export const (DbNull|JsonNull|AnyNull)\s*=\s*runtime\.\1(?!\s*:)/g,
      replace: 'export const $1: typeof runtime.$1 = runtime.$1',
      name: '$1'
    }
  ];

  patterns.forEach(({ search, replace, name }) => {
    if (search.test(content)) {
      content = content.replace(search, replace);
      modified = true;
      console.log(`✓ Fixed type annotation for ${name}`);
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('✅ Prisma type annotations fixed successfully');
  } else {
    console.log('✅ No type fixes needed (already correct or not applicable)');
  }
}

try {
  fixPrismaTypes();
} catch (error) {
  console.error('❌ Error fixing Prisma types:', error.message);
  // 에러가 발생해도 빌드를 중단하지 않음
  process.exit(0);
}
