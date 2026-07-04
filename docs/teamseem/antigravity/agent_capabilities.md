# 에이전트 기능 및 서브 에이전트 (Agent Capabilities, Extensions & Collaboration)

- **원본 문서 목록**:
  - [[docs/raw/01 플러그인 (Plugins)|01 플러그인 (Plugins)]]
  - [[docs/raw/02 MCP|02 MCP]]
  - [[docs/raw/03 Skills (Agent Skills)|03 Skills (Agent Skills)]]
  - [[docs/raw/05 훅 (Hooks)|05 훅 (Hooks)]]
  - [[docs/raw/02 커맨드 (Command)|02 커맨드 (Command)]]
  - [[docs/raw/05 서브 에이전트 (Subagents)|05 서브 에이전트 (Subagents)]]
  - [[docs/raw/08 브라우저 서브 에이전트 (Browser Subagent)|08 브라우저 서브 에이전트 (Browser Subagent)]]
  - [[docs/raw/01 Chrome 확장 프로그램 (Chrome Extension)|01 Chrome 확장 프로그램 (Chrome Extension)]]

---

## 🔌 1. 확장 인터페이스 (Plugins & MCP)
Antigravity의 기능을 동적으로 연동하고 확장하기 위한 주요 메커니즘입니다.
* **플러그인 (Plugins)**: 스킬, 규칙, MCP 서버, 이벤트 훅을 일괄 패키징하여 배포 가능한 네임스페이스 기반 번들입니다. (`plugin.json` 필수 구성)
* **MCP (Model Context Protocol)**: 에이전트와 외부 데이터 소스 또는 도구 서버 간의 표준 연결 프로토콜입니다. 로컬 데이터베이스 쿼리나 서버 명령 연결 등을 투명하게 지원합니다.

## 🗂️ 2. 스킬 및 훅 시스템 (Skills & Hooks)
* **에이전트 스킬 (Agent Skills)**: 특정 정형화된 작업(예: 클리니컬 트라이얼 검색, 특수 API 쿼리 등)을 처리하기 위해 상세 지침(`SKILL.md`)을 기술한 지식 묶음입니다.
* **훅 (Hooks)**: 에이전트가 도구를 호출하기 전(`PreToolUse`) 또는 도구 호출 후(`PostToolUse`) 특정 커스텀 스크립트나 명령어가 자동으로 작동하게 만드는 실행 개입 장치입니다.

## 💬 3. 자연어 커맨드 및 서브 에이전트 협업
* **인라인 커맨드 (Command)**: 에디터 내에서 `Cmd+I` 또는 `Ctrl+I` 단축키를 눌러 자연어로 코드 생성이나 간단한 터미널 동작을 바로 수행시킬 수 있습니다.
* **서브 에이전트 (Subagents)**: 복잡하고 자원이 많이 드는 태스크(예: 광범위한 파일 검색, 장시간 빌드 대기 등)를 백그라운드에서 병렬 실행하기 위해 새로운 독립 에이전트를 비동기적으로 분할 생성(Delegation)할 수 있는 협업 시스템입니다.
* **브라우저 서브 에이전트 (Browser Subagent)**: Antigravity 브라우저 확장 프로그램(Chrome Extension)을 매개로 웹브라우저와 결합하여 웹 탐색, 양식 제출, UI 확인 등을 가상 및 실제 환경에서 인간의 방해 없이 안전하게 대행합니다.
