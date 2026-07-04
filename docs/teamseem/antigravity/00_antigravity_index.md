# Antigravity 에이전트 지식 베이스 (Map of Content)

이 폴더는 Antigravity 에이전트 시스템에 대한 모든 지식을 체계적으로 분류하고 요약한 지식 맵(MOC)입니다.
각 문서는 `docs/raw/` 폴더 내의 원본 가이드 문서들과 연결(Link)되어 있어, 요약을 확인한 후 원본 텍스트로 바로 이동할 수 있습니다.

## 📂 카테고리별 핵심 요약 노트

### 1. ⚙️ [[core_system|핵심 시스템 및 아키텍처]]
* Antigravity의 전체 프레임워크와 워크스페이스 구조, 그리고 사용하는 LLM 모델들에 대해 다룹니다.
* 주요 링크: [[core_system]]

### 2. 🖥️ [[ui_navigation|사용자 인터페이스 및 탐색]]
* 에디터 내 네비게이션 단축키, 페인 분할, 인박스, 변경 사항 검토 등 화면 구성 요소와 조작법을 정리합니다.
* 주요 링크: [[ui_navigation]]

### 3. 🧠 [[agent_capabilities|에이전트 기능 및 서브 에이전트]]
* MCP(Model Context Protocol) 연동, 스킬(Skills) 및 플러그인 작성, 브라우저/리서치 서브 에이전트 간의 협업 모델을 다룹니다.
* 주요 링크: [[agent_capabilities]]

### 4. 📋 [[workflows_artifacts|워크플로우 및 아티팩트 관리]]
* 태스크 계획 단계부터 시작해 구현 계획서, 아티팩트 리뷰, 터미널 실행, 워크스루 생성까지의 개발 사이클을 정리합니다.
* 주요 링크: [[workflows_artifacts]]

### 5. 🛡️ [[security_permissions|보안 모드 및 권한 통제]]
* 에이전트의 파일 읽기/쓰기 권한 제어, 커맨드 승인 절차, 샌드박싱 환경 및 Strict/Secure 모드를 설명합니다.
* 주요 링크: [[security_permissions]]

### 6. 🔄 [[loop_engineering|루프 엔지니어링 및 자율 제어 패러다임]]
* 프롬프트 → 컨텍스트 → 하네스 → 루프 엔지니어링으로의 진화, 에이전틱 루프 구조, xIL 검증, SASE(SE 3.0), HITL/HOTL 인간 참여 모델을 다룹니다.
* 주요 링크: [[loop_engineering]]

---
* **원본 파일 저장소**: [[docs/raw/|원본 문서 폴더]]
