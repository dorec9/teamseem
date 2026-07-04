# 보안 모드 및 권한 통제 (Security, Permissions & Safety Configurations)

- **원본 문서 목록**:
  - [[docs/raw/02 에이전트 모드  설정 (Agent Modes|02 에이전트 모드  설정 (Agent Modes.md]]
  - [[docs/raw/03 아티팩트 검토 (Artifact Review)|03 아티팩트 검토 (Artifact Review)]]
  - [[docs/raw/04  에이전트 권한 (Agent Permissions)|04  에이전트 권한 (Agent Permissions)]]
  - [[docs/raw/02 허용 목록  거부 목록 (Allowlist|02 허용 목록  거부 목록 (Allowlist.md]]
  - [[docs/raw/06  엄격 모드 (Strict Mode)|06  엄격 모드 (Strict Mode)]]
  - [[docs/raw/09 보안 모드 (Secure Mode)|09 보안 모드 (Secure Mode)]]
  - [[docs/raw/10 샌드박싱 (Sandboxing)|10 샌드박싱 (Sandboxing)]]
  - [[docs/raw/03 변경 사항 검토 + 소스 제어 (Review Changes + Source Control)|03 변경 사항 검토 + 소스 제어 (Review Changes + Source Control)]]
  - [[docs/raw/04  변경 사항 검토 + 소스 제어 (Review Changes + Source Control)|04  변경 사항 검토 + 소스 제어 (Review Changes + Source Control)]]

---

## 🛡️ 1. 에이전트 권한 제어 (Agent Permissions)
에이전트가 로컬 시스템의 민감한 자원에 접근하는 행위는 촘촘한 권한 모델(Permission Engine)로 보장됩니다.
* **접근 제어 방식**: `read_file`(파일 읽기), `write_file`(파일 쓰기), `command`(쉘 명령 실행), `mcp`(MCP 서버 도구 실행) 등 중요 자원 조작 시 **허용(Allow), 질의(Ask), 거부(Deny)** 규칙 리스트를 정의하여 통제합니다.
* **허용/거부 리스트 (Allowlist/Denylist)**: 브라우저 에이전트가 접속 가능한 URL 영역을 엄격하게 제한하여 악성 코드 유포지나 사설 도메인에 대한 무단 정보 송출을 차단합니다.

## 🔒 2. 보안 제어 모드 (Strict, Secure & Sandboxing)
높은 수준의 안정성을 위해 제공되는 격리 기능들입니다.
* **엄격 모드 (Strict Mode)**: 호스트 파일 격리, 명령 실행 시 강제 승인 요구, 엄격한 URL 접근 제어 등을 적용하는 강력한 안전 모드입니다.
* **보안 모드 (Secure Mode)**: 엄격 모드와 실질적으로 동일한 명세를 따르며, 에이전트가 시스템 자원 및 외부 망에 악성 명령어 체인을 시도하는 것을 원천 방지합니다.
* **샌드박싱 (Sandboxing)**: OS 레벨 커널 통제 모델(예: macOS의 Seatbelt 샌드박스)을 활용해 터미널 명령어 실행 시 임의의 디렉토리 외부에 쓰기 권한이 인가되는 것을 구조적으로 차단합니다.

## 🛠️ 3. 변경 검토 및 소스 제어 (Change Review & Git)
에이전트가 수행한 수정을 최종적으로 배포하기 전에 확인하는 통제 게이트입니다.
* **변경 사항 검토 (Source Control Review)**: 에이전트 매니저 패널 및 에디터 인라인 사이드바에서 개별 파일에 대해 실시간 diff를 확인하고 코드에 주석 피드백을 남길 수 있습니다.
* **소스 제어 연동**: 수정된 내용들을 에이전트 매니저 화면에서 직접 Git staging에 올리고 커밋(Commit)할 수 있어, 버전 관리 신뢰도를 제공합니다.
