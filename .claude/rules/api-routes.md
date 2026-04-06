---
description: Next.js API Route 및 SSE 엔드포인트 규칙
paths:
  - "src/app/api/**"
---

# API Route Rules

- Route Handler는 반드시 요청 파라미터 유효성 검증 후 처리
- SSE 엔드포인트는 ReadableStream + TextEncoderStream 패턴 사용
- 에러 응답은 일관된 형식: { error: string, code: string }
- Claude API 호출 시 API 키는 반드시 환경변수에서 로드
- SSE 연결 종료 시 cleanup 로직 반드시 포함
- API 응답에 적절한 HTTP 상태 코드 사용 (200, 400, 401, 500)
