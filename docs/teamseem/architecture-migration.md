# 아키텍처 마이그레이션 가이드 (Architecture Migration)

## 1. 개요
기존 TeamSeem은 Claude Code의 Webhook 기능을 이용해 `POST /api/events`로 이벤트를 수신했습니다. 그러나 Antigravity 환경에서는 이러한 Webhook 기능이 내장되어 있지 않으며, 대신 로컬 파일 시스템에 로그(`transcript.jsonl`)를 남깁니다.

## 2. 해결 방안: File Watcher (Middleman Agent)
TeamSeem 서버와 Antigravity 사이에 **File Watcher 데몬**을 두어 문제를 해결합니다.

### 워크플로우
1. **Antigravity**가 작업을 수행하며 `<appDataDir>\brain\<conversation-id>\.system_generated\logs\transcript.jsonl`에 한 줄씩 JSON 이벤트를 추가합니다.
2. **File Watcher (Node.js/Python 스크립트)**가 이 파일의 끝부분(`tail -f`)을 감시합니다.
3. 새로운 라인이 감지되면 JSON을 파싱하고, [[event-mapping-rules]]에 따라 TeamSeem 포맷으로 변환합니다.
4. 변환된 이벤트를 `http://localhost:3000/api/events`로 `POST` 전송합니다.

## 3. 왜 이 방식을 선택했는가?
이 방식(옵션 A)을 사용하면 TeamSeem 서버 내부 코드를 수정할 필요가 없으며, 기존의 SSE(Server-Sent Events) 아키텍처를 그대로 활용할 수 있기 때문에 가장 안정적입니다.
