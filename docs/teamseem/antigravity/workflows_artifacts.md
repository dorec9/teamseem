# 워크플로우 및 아티팩트 관리 (Workflows & Artifacts)

- **원본 문서 목록**:
  - [[docs/raw/04 규칙워크플로우|04 규칙워크플로우]]
  - [[docs/raw/01 작업 목록 (Task List)|01 작업 목록 (Task List)]]
  - [[docs/raw/07 작업 그룹 (Task Groups)|07 작업 그룹 (Task Groups)]]
  - [[docs/raw/02 구현 계획 (Implementation Plan)|02 구현 계획 (Implementation Plan)]]
  - [[docs/raw/03 아티팩트 검토 (Artifact Review)|03 아티팩트 검토 (Artifact Review)]]
  - [[docs/raw/03 워크스루 (Walkthrough)|03 워크스루 (Walkthrough)]]
  - [[docs/raw/04 스크린샷 (Screenshots)|04 스크린샷 (Screenshots)]]
  - [[docs/raw/05 브라우저 녹화 (Browser Recordings)|05 브라우저 녹화 (Browser Recordings)]]
  - [[docs/raw/06 지식 (Knowledge Items)|06 지식 (Knowledge Items)]]

---

## 🧭 1. 규칙과 워크플로우 (Rules & Workflows)
* **규칙 (Rules)**: 개발 중에 에이전트의 거동을 지속해서 제약하고 일정한 기준을 따르게 하는 비활성(Passive) 제약 조건입니다.
* **워크플로우 (Workflows)**: 슬래시 커맨드(예: `/goal`, `/schedule`)를 통해 트리거되는 능동적인(Active) 다단계 처리 프로세스입니다.

## 📋 2. 작업 관리 (Task Management)
* **작업 목록 (Task List)**: 에이전트가 복잡한 기능 개발을 추진할 때 진행 상태를 관리하기 위해 작성 및 유지하는 TODO 리스트(`task.md`)입니다.
* **작업 그룹 (Task Groups)**: 플래닝 모드(Planning Mode)에서 거대한 작업을 시각적인 하위 모듈과 영향받는 파일 목록 단위로 쪼개어 나타내는 집합 형태입니다.

## 📁 3. 주요 아티팩트 유형 (Key Artifacts)
에이전트가 작업 결과를 체계적으로 공유하기 위해 문서 저장소에 보존하는 산출물입니다.
* **구현 계획서 (Implementation Plan)**: 복잡한 코드를 변경하기 전에 설계안과 리스크, 변경 파일 목록을 작성하여 사용자에게 사전 검토 및 승인을 요청하는 용도입니다. (`implementation_plan.md`)
* **아티팩트 검토 (Artifact Review)**: 에이전트가 단독으로 작업을 계속 진행할지(`Always Proceed`), 아니면 아티팩트 수정 시마다 승인 대기를 할지(`Request Review`) 정책에 따라 통제합니다.
* **워크스루 (Walkthrough)**: 전체 구현이 완료된 후 변경 내역, 테스트 결과 및 자동 생성된 증적 자료를 모아 작성하는 검증 보고서입니다. (`walkthrough.md`)

## 📸 4. 멀티미디어 증적 및 영구 지식 (Evidence & Knowledge)
* **스크린샷 및 브라우저 녹화 (Screenshots & Recordings)**: 브라우저 서브 에이전트가 UI 조작 후 완료 상태를 캡처하거나 동작 과정을 루프 비디오로 자동 저장하여 사용자가 시각적으로 작업 결과를 검증할 수 있도록 지원합니다.
* **지식 아이템 (Knowledge Items)**: 세션 도중에 도출된 핵심적 솔루션이나 영구 보존이 필요한 사용자 지침을 요약과 아티팩트 묶음 형태로 저장하여, 다음 대화에서도 맥락을 이어나가도록 돕는 시스템 메모리입니다.
