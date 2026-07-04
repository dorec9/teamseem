# 핵심 시스템 및 아키텍처 (Core System & Architecture)

- **원본 문서 목록**:
  - [[docs/raw/02 Antigravity 2.0|02 Antigravity 2.0]]
  - [[docs/raw/01_워크스페이스 (Workspaces)|01_워크스페이스 (Workspaces)]]
  - [[docs/raw/01 플레이그라운드 (Playground)|01 플레이그라운드 (Playground)]]
  - [[docs/raw/01 모델 (Models)|01 모델 (Models)]]
  - [[docs/raw/10 Enterprise|10 Enterprise]]

---

## 🚀 1. Antigravity 2.0 개요
Antigravity 2.0은 에이전트 퍼스트(Agent-First) 데스크톱 애플리케이션으로, 복잡한 소프트웨어 엔지니어링 문제를 해결하는 다수의 인공지능 에이전트 동작을 통합 지휘하고 관찰할 수 있는 중앙 명령 센터(Command Center) 역할을 수행합니다.

## 📁 2. 워크스페이스 관리 (Workspaces)
Antigravity는 프로젝트 단위로 독립된 개발 환경을 관리합니다.
- **다중 워크스페이스**: 왼쪽 사이드바를 통해 여러 워크스페이스의 대화창을 매끄럽게 전환하며 동시에 작업을 수행할 수 있습니다.
- **워크스페이스 전환**: 사이드바에서 워크스페이스 이름을 선택하여 대화로 진입하거나, 플러스(+) 버튼을 통해 새로운 대화를 개시할 수 있습니다.

## 🧪 3. 플레이그라운드 (Playground)
워크스페이스 폴더 구조를 설정하는 번거로움(Overhead) 없이 즉각적으로 코드를 테스트하고 실험할 수 있도록 설계된 독립적인 환경입니다.
- **빠른 테스트**: 대화 시작 페이지의 `Use Playground` 버튼을 통해 바로 시작할 수 있습니다.
- **작업 보존**: 플레이그라운드에서 진행된 대화 기록 및 생성 파일은 원할 경우 사용자가 선택한 특정 영구 워크스페이스 폴더로 언제든지 이동하여 이관(Persist)할 수 있습니다.

## 🤖 4. 지원 모델 (Reasoning Models)
대화 프롬프트창 하단 드롭다운에서 각 작업 특성에 적합한 추론 모델을 자유롭게 선택할 수 있으며, 실행 중 모델을 변경해도 해당 턴의 단계 완료 시까지 모델이 유지(Sticky)됩니다.
* **주요 추론 모델**: Gemini 3.5 Flash, Gemini 3.1 Pro (high/low), Gemini 3 Flash, Claude Sonnet 4.6 (thinking), Claude Opus 4.6 (thinking), GPT-OSS-120b 등.
* **추가 헬퍼 모델**: 백그라운드 태스크나 유틸리티를 지원하기 위해 비구성형 헬퍼 모델(예: Nano Banana 2) 등이 동적으로 동작합니다.

## 🏢 5. 엔터프라이즈 설정 (Enterprise)
엔터프라이즈 환경에서 팀 단위의 에이전트 자원 관리를 지원합니다.
- Google Cloud 프로젝트 셋업, 결제(Billing) 정보 연동, IAM 역할(Role) 배정, 그리고 필요한 API들의 전사 활성화 절차를 지원합니다.
