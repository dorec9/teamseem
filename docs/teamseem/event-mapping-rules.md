# 이벤트 매핑 규칙 (Event Mapping Rules)

File Watcher 스크립트는 Antigravity의 로그를 파싱하여 기존 TeamSeem이 인식할 수 있는 `RawHookPayload` 포맷으로 변환해야 합니다.

## 1. Antigravity 원본 데이터 포맷
Antigravity의 `transcript.jsonl`에 기록되는 데이터 구조는 다음과 같습니다.
```json
{
  "step_index": 3,
  "source": "MODEL",
  "type": "PLANNER_RESPONSE",
  "status": "DONE",
  "created_at": "2026-07-01T08:30:52Z",
  "content": "실행 결과물...",
  "tool_calls": [{"name": "list_dir", "args": {...}}]
}
```

## 2. 매핑 테이블
| Antigravity 필드/타입 | TeamSeem `hook_event_name` 변환 | 설명 / 매핑 로직 |
|---|---|---|
| `type: "USER_INPUT"` | `UserPrompt` | 사용자의 지시사항을 나타냄. `tool_input`에 `content`를 담아 전송 |
| `type: "PLANNER_RESPONSE"` (tool_calls 포함) | `PreToolUse` | AI가 도구(Tool)를 사용하기 직전. `tool_name`에 `tool_calls[0].name` 지정 |
| `type: "RUN_COMMAND"` / `VIEW_FILE` 등 | `PostToolUse` | 도구 사용 결과물. `tool_response.stdout`에 `content` 결과값 매핑 |
| `type: "MCP_TOOL"` | `PostToolUse` / `PreToolUse` | MCP 통신 결과 로그 |

## 3. 구현 시 유의사항
- `session_id`는 로그가 위치한 디렉토리 명(`<conversation-id>`)을 파싱하여 사용해야 합니다.
- Antigravity는 내부적으로 여러 하위 도구 호출을 `PLANNER_RESPONSE` 안에 배열로 가질 수 있으므로, 배열 내의 도구들을 개별적인 `PreToolUse` 이벤트로 나누어서 전송하는 로직이 필요합니다.
