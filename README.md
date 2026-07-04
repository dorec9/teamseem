# TeamSeem

Agent Team의 대화와 작업 흐름을 실시간으로 시각화하는 웹 애플리케이션입니다.

## 주요 기능

- **실시간 대화 모니터링** — SSE(Server-Sent Events) 기반으로 에이전트 간 메시지를 실시간 수신 및 표시
- **작업 흐름 시각화** — React Flow를 활용한 태스크 의존성 그래프 및 진행 상태 표시
- **에이전트 상태 추적** — 각 에이전트의 현재 상태(활성/유휴/종료)를 한눈에 파악
- **세션 관리** — 여러 팀 세션을 전환하며 모니터링
- **이벤트 필터링** — 메시지 타입별 필터로 원하는 정보만 확인

## 기술 스택

| 분류        | 기술                       |
| ----------- | -------------------------- |
| 프레임워크  | Next.js 15 (App Router)    |
| 언어        | TypeScript (strict mode)   |
| 스타일링    | Tailwind CSS               |
| 상태 관리   | Zustand                    |
| 시각화      | React Flow (@xyflow/react) |
| 레이아웃    | Dagre (@dagrejs/dagre)     |
| 실시간 통신 | Server-Sent Events (SSE)   |

## 프로젝트 구조

```
src/
├── app/                  # Next.js App Router
│   ├── api/
│   │   ├── events/       # SSE 이벤트 수신 및 스트리밍
│   │   ├── sessions/     # 세션 조회 API
│   │   └── debug/        # 디버그 엔드포인트
│   ├── settings/         # 설정 페이지
│   └── page.tsx          # 메인 대시보드
├── components/
│   ├── agent/            # 에이전트 상태 패널 및 뱃지
│   ├── chat/             # 대화 모니터링 (메시지, 필터)
│   ├── common/           # 공용 컴포넌트 (연결 상태, 세션 선택)
│   ├── flow/             # 작업 흐름 시각화 (React Flow)
│   ├── settings/         # 설정 UI
│   └── Dashboard.tsx     # 메인 대시보드 레이아웃
├── hooks/                # 커스텀 훅 (SSE 스트림, 초기 상태)
├── lib/                  # 유틸리티, 타입, 이벤트 처리
│   ├── store/            # 이벤트 저장소, 정규화, 프로세서
│   └── types.ts          # 공유 타입 정의
└── stores/               # Zustand 스토어 (에이전트, 메시지, 세션, 태스크)
```

## 시작하기

### 요구 사항

- Node.js 20 이상
- npm

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 대시보드를 확인할 수 있습니다.

### 주요 스크립트

```bash
npm run dev       # 개발 서버
npm run build     # 프로덕션 빌드
npm run start     # 프로덕션 서버
npm run lint      # ESLint 실행
```

## Agent 연동

TeamSeem은 **Gemini / Antigravity** 환경의 로그를 실시간으로 스트리밍하여 에이전트 이벤트를 수신합니다.

### Native Hooks 실행

Antigravity의 공식 훅(Hook) 기능을 통해 이벤트를 전송합니다. 프로젝트 루트에 있는 `.agents/hooks.json` 파일에 의해 자동으로 이벤트가 수집되어 `http://localhost:3000/api/events` 로 전송됩니다.

별도의 스크립트를 수동으로 실행할 필요 없이, 단순히 TeamSeem 서버만 켜두면 됩니다.

상세한 아키텍처 및 마이그레이션 가이드는 `docs/index.md`를 참고해 주세요.

### 연결 확인

```bash
# 서버 상태 확인
curl http://localhost:3000/api/health
```

## 라이선스

MIT
