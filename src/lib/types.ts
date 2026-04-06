export type AgentStatus = "idle" | "working" | "stopped" | "error";
export type TaskStatus = "created" | "in_progress" | "completed" | "failed";

export type HookEventType =
  | "PreToolUse"
  | "PostToolUse"
  | "TaskCreated"
  | "TaskCompleted"
  | "TeammateIdle"
  | "SessionStart"
  | "Stop"
  | "SubagentStart"
  | "SubagentStop";

// 우리가 내부에서 사용하는 정규화된 이벤트
export interface HookEvent {
  type: HookEventType;
  sessionId: string;
  timestamp: string;
  agentId?: string;
  agentName?: string;
  taskId?: string;
  parentTaskId?: string;
  toolName?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

// Claude Code가 실제로 보내는 HTTP hook payload
export interface RawHookPayload {
  session_id: string;
  hook_event_name: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_response?: {
    stdout?: string;
    stderr?: string;
    interrupted?: boolean;
    content?: string;
    filePath?: string;
  };
  tool_use_id?: string;
  transcript_path?: string;
  cwd?: string;
  permission_mode?: string;
  // Agent Team 전용 필드
  agent_id?: string;
  agent_name?: string;
  task_id?: string;
  parent_task_id?: string;
  description?: string;
}

export interface Agent {
  id: string;
  name: string;
  sessionId: string;
  status: AgentStatus;
  lastSeen: string;
  parentAgentId?: string;
}

export interface Message {
  id: string;
  sessionId: string;
  agentId: string;
  agentName: string;
  content: string;
  timestamp: string;
  eventType: HookEventType;
  toolName?: string;
}

export interface Task {
  id: string;
  sessionId: string;
  agentId: string;
  agentName: string;
  description: string;
  status: TaskStatus;
  parentTaskId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Session {
  id: string;
  startedAt: string;
  agents: string[];
  status: "active" | "stopped";
}

export interface SessionDetail extends Omit<Session, "agents"> {
  agents: Agent[];
  messages: Message[];
  tasks: Task[];
}

export type SSEEventType = "agent" | "message" | "task" | "session";

export interface SSEEvent {
  type: SSEEventType;
  data: Agent | Message | Task | Session;
}
