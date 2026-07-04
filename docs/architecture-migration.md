# 아키텍처 마이그레이션 가이드

이 문서는 TeamSeem 프로젝트가 기존 **Claude Code (Webhook)** 구조에서 **Gemini / Antigravity (Native Hooks)** 구조로 마이그레이션된 배경과 기술적 변화를 설명합니다.

## 1. 기존 아키텍처 (Claude Code)
- Claude Code는 `~/.claude/settings.json` 내에 `hooks` 필드를 설정하면 이벤트 시점에 쉘 환경변수 `$CLAUDE_HOOK_PAYLOAD` 로 페이로드를 전달하여 `curl`을 통해 웹훅(Webhook)을 전송하는 방식을 사용했습니다.
- **제한점**: Claude 환경에 강하게 종속되어 있었습니다.

## 2. 신규 아키텍처 (Antigravity Native Hooks)
- Antigravity는 내부적으로 `.agents/hooks.json` (또는 `~/.gemini/config/hooks.json`)을 통해 훅 시스템을 동일하게 지원합니다.
- 이벤트가 발생하면 쉘 환경변수가 아닌 **표준 입력(stdin)** 으로 JSON 페이로드를 전달합니다.
- `curl -d @-` 명령어를 통해 표준 입력을 그대로 `POST` Body에 실어 TeamSeem 로컬 서버(`http://localhost:3000/api/events`)로 전송합니다.

### 훅 설정 (`.agents/hooks.json`)
```json
{
  "teamseem-monitor": {
    "PreToolUse": [
      {
        "type": "command",
        "command": "curl -s -X POST 'http://localhost:3000/api/events?event=PreToolUse' -H 'Content-Type: application/json' -d @-"
      }
    ]
  }
}
```

> 💡 **Query Parameter 주입 방식**: Antigravity의 페이로드 본문에는 이벤트 타입(예: `PreToolUse`) 정보가 누락되어 있습니다. 따라서 `curl` 요청 시 `?event=PreToolUse` 와 같이 URL 쿼리 파라미터로 이벤트 타입을 명시적으로 전달합니다.

## 3. TeamSeem 백엔드 변경 사항 (`/api/events`)
- 기존의 스네이크 케이스(`hook_event_name`, `session_id`) 기반의 페이로드를 카멜 케이스(`conversationId`, `toolCall` 등)로 파싱하도록 `normalize-payload.ts` 파서를 전면 개편했습니다.
- 쿼리 파라미터 `event` 를 감지하여 내부 객체의 `hook_event_name` 속성으로 주입하는 로직을 `route.ts`에 추가했습니다.
