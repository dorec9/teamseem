export type AgentStatus = "idle" | "working" | "stopped" | "error";
export type TaskStatus = "created" | "in_progress" | "completed" | "failed";

export type HookEventType =
  | "PreInvocation"
  | "PostInvocation"
  | "PreToolUse"
  | "PostToolUse"
  | "TaskCreated"
  | "TaskCompleted"
  | "TeammateIdle"
  | "SessionStart"
  | "Stop"
  | "SubagentStart"
  | "SubagentStop"
  | "UserPrompt"
  | "AgentResponse"
  | "AgentStateChange";

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

// Antigravity Code가 보내는 HTTP hook payload (stdin)
export interface RawHookPayload {
  conversationId: string;
  transcriptPath?: string;
  workspacePaths?: string[];
  artifactDirectoryPath?: string;
  
  // Query parameter를 통해 주입되는 이벤트 이름
  hook_event_name?: string; 

  // PreToolUse
  toolCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  stepIdx?: number;
  
  // PostToolUse / Stop
  error?: string;
  
  // Stop
  executionNum?: number;
  terminationReason?: string;
  fullyIdle?: boolean;
  
  // PreInvocation / PostInvocation
  invocationNum?: number;
  initialNumSteps?: number;
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
  metadata?: Record<string, unknown>;
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
  title: string;
  projectName: string;
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
