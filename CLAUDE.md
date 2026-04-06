# TeamSeem

Claude Agent Team의 대화와 작업을 시각적으로 모니터링하는 웹 애플리케이션

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Visualization**: React Flow (작업 흐름), Custom Components (대화 모니터링)
- **Real-time**: Server-Sent Events (SSE)
- **Testing**: Vitest + React Testing Library

## Commands

- `npm run dev` — 개발 서버
- `npm run build` — 프로덕션 빌드
- `npm run lint` — ESLint 실행
- `npm run test` — 테스트 실행
- `npx prettier --write .` — 포매팅

## Architecture

```
src/
├── app/           # Next.js App Router (페이지 + API 라우트)
│   ├── api/       # SSE 엔드포인트, Agent 연동 API
│   └── (routes)/  # 페이지 라우트
├── components/    # React 컴포넌트
│   ├── chat/      # 대화 모니터링 UI
│   └── flow/      # 작업 흐름 시각화 (React Flow)
├── lib/           # 유틸리티, API 클라이언트, 타입
├── stores/        # Zustand 스토어
└── hooks/         # Custom React hooks
```

## Code Style

- ES modules (import/export), CommonJS 사용 금지
- 함수 컴포넌트 + hooks 패턴만 사용
- 네이밍: 컴포넌트 PascalCase, 함수/변수 camelCase, 타입/인터페이스 PascalCase
- 한 파일에 하나의 default export 컴포넌트
- 절대 경로 import 사용 (`@/` prefix)

## Workflow

- 한국어로 응답
- 변경 후 `npm run lint` 실행하여 타입/린트 오류 확인
- 커밋: conventional commits 형식 (feat, fix, refactor, docs, test, chore)
- IMPORTANT: .env 파일에 API 키 절대 하드코딩 금지
- 새 컴포넌트 생성 시 반드시 TypeScript props 인터페이스 정의
