---
description: TypeScript 및 프로젝트 전반 코드 스타일 규칙
---

# Code Style Rules

- TypeScript strict mode 준수: any 타입 사용 금지, unknown 사용 후 타입 가드
- interface 우선 사용, type alias는 유니온/인터섹션에만 사용
- 비동기 함수는 반드시 async/await 패턴 (raw Promise chain 금지)
- 에러 처리: catch 블록에서 error를 unknown으로 타입 지정
- 매직 넘버 금지: 상수로 추출하여 의미 부여
- console.log 디버깅 코드 커밋 금지 (logger 유틸리티 사용)
