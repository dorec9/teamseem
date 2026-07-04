"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

import { useSessionStore } from "@/stores/session-store";
import { useAgentStore } from "@/stores/agent-store";
import { useMessageStore } from "@/stores/message-store";
import { useTaskStore } from "@/stores/task-store";

const HOOK_CONFIG = `{
  "hooks": {
    "SessionStart": [
      { "hooks": [{ "type": "http", "url": "http://localhost:3000/api/events" }] }
    ],
    "Stop": [
      { "hooks": [{ "type": "http", "url": "http://localhost:3000/api/events" }] }
    ],
    "PreToolUse": [
      { "hooks": [{ "type": "http", "url": "http://localhost:3000/api/events" }] }
    ],
    "PostToolUse": [
      { "hooks": [{ "type": "http", "url": "http://localhost:3000/api/events" }] }
    ],
    "TaskCreated": [
      { "hooks": [{ "type": "http", "url": "http://localhost:3000/api/events" }] }
    ],
    "TaskCompleted": [
      { "hooks": [{ "type": "http", "url": "http://localhost:3000/api/events" }] }
    ],
    "TeammateIdle": [
      { "hooks": [{ "type": "http", "url": "http://localhost:3000/api/events" }] }
    ],
    "SubagentStart": [
      { "hooks": [{ "type": "http", "url": "http://localhost:3000/api/events" }] }
    ],
    "SubagentStop": [
      { "hooks": [{ "type": "http", "url": "http://localhost:3000/api/events" }] }
    ]
  }
}`;

const USAGE_STEPS = [
  {
    step: 1,
    title: "TeamSeem 서버 시작",
    code: "npm run dev",
  },
  {
    step: 2,
    title: "Hook 설정 복사",
    description:
      "아래 JSON을 프로젝트의 .claude/settings.json에 hooks 필드로 추가하세요. 기존 hooks가 있다면 병합하세요.",
  },
  {
    step: 3,
    title: "에이전트 세션 시작",
    description:
      "설정이 적용된 환경에서 에이전트를 실행하면 이벤트가 TeamSeem으로 전송됩니다.",
  },
  {
    step: 4,
    title: "대시보드 확인",
    code: "http://localhost:3000",
  },
];

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const clearSessions = useSessionStore((s) => s.clear);
  const clearAgents = useAgentStore((s) => s.clear);
  const clearMessages = useMessageStore((s) => s.clear);
  const clearTasks = useTaskStore((s) => s.clear);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(HOOK_CONFIG);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 권한 거부 시 무시
    }
  }, []);

  const handleClearDatabase = async () => {
    if (!confirm("모든 세션, 에이전트, 태스크, 메시지가 영구적으로 삭제됩니다. 계속하시겠습니까?")) return;
    
    setIsClearing(true);
    try {
      const res = await fetch("/api/database/clear", { method: "DELETE" });
      if (res.ok) {
        clearSessions();
        clearAgents();
        clearMessages();
        clearTasks();
        alert("데이터베이스가 초기화되었습니다.");
      } else {
        alert("데이터 초기화에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("데이터 초기화 중 오류가 발생했습니다.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-foreground/10 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-foreground/50 transition-colors hover:text-foreground"
          >
            &larr; 대시보드
          </Link>
          <h1 className="text-lg font-bold">설정</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-6 py-8">
        {/* 사용 방법 */}
        <section>
          <h2 className="mb-4 text-base font-semibold">사용 방법</h2>
          <ol className="space-y-4">
            {USAGE_STEPS.map((item) => (
              <li key={item.step} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-xs font-bold text-foreground/60">
                  {item.step}
                </span>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 text-sm text-foreground/50">
                      {item.description}
                    </p>
                  )}
                  {item.code && (
                    <code className="mt-1 inline-block rounded bg-foreground/5 px-2 py-0.5 text-xs text-foreground/70">
                      {item.code}
                    </code>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Hook 설정 JSON */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">에이전트 Hook 설정</h2>
            <button
              onClick={handleCopy}
              className="rounded-md bg-foreground/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-foreground/20"
            >
              {copied ? "복사됨!" : "JSON 복사"}
            </button>
          </div>
          <p className="mb-3 text-sm text-foreground/50">
            이 설정을 에이전트 환경의{" "}
            <code className="text-foreground/70">hooks</code> 또는 이벤트 필드에 연동하세요.
          </p>
          <pre className="overflow-x-auto rounded-lg border border-foreground/10 bg-foreground/[0.03] p-4 text-xs leading-relaxed text-foreground/80">
            {HOOK_CONFIG}
          </pre>
        </section>

        {/* 주의사항 */}
        <section className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
          <h3 className="mb-2 text-sm font-semibold text-yellow-400">
            주의사항
          </h3>
          <ul className="space-y-1 text-sm text-foreground/60">
            <li>&bull; TeamSeem 서버가 실행 중이어야 이벤트가 수신됩니다</li>
            <li>
              &bull; 포트가 다르면 URL의 <code>3000</code>을 변경하세요
            </li>
            <li>
              &bull; 기존 hooks 설정이 있다면 이벤트 배열에 추가하세요 (덮어쓰기 금지)
            </li>
            <li>&bull; 서버 재시작 시 인메모리 데이터가 초기화됩니다</li>
          </ul>
        </section>

        {/* 위험 구역 */}
        <section className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 mt-8">
          <h3 className="mb-2 text-sm font-semibold text-red-400">
            위험 구역 (Danger Zone)
          </h3>
          <p className="mb-4 text-sm text-foreground/60">
            TeamSeem 데이터베이스의 모든 세션, 에이전트, 태스크, 대화 내역을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.
          </p>
          <button
            onClick={handleClearDatabase}
            disabled={isClearing}
            className="rounded-md bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-50"
          >
            {isClearing ? "초기화 중..." : "전체 데이터 초기화"}
          </button>
        </section>
      </main>
    </div>
  );
}
