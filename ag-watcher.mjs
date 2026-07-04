import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';

const BRAIN_DIR = "C:\\Users\\ehgus\\.gemini\\antigravity\\brain";

const watchers = new Map();
const debounceTimers = new Map();

function notifyTeamSeem(mainConvoId, transcriptPath, agentId) {
  const debounceKey = `${mainConvoId}_${agentId}`;
  if (debounceTimers.has(debounceKey)) clearTimeout(debounceTimers.get(debounceKey));
  
  const timer = setTimeout(async () => {
    try {
      let projectName = "Unknown";
      let title = "새로운 대화";
      let timestamp = new Date().toISOString();
      if (fs.existsSync(transcriptPath)) {
        const data = fs.readFileSync(transcriptPath, "utf-8");
        const lines = data.split("\n");
        let foundProj = false;
        let foundTitle = false;
        let foundTime = false;
        for (const line of lines) {
          if (!line.trim()) continue;
          if (foundProj && foundTitle && foundTime) break;
          try {
            const entry = JSON.parse(line);
            if (!foundTime && entry.created_at) {
              timestamp = entry.created_at;
              foundTime = true;
            }
            if (!foundProj && entry.content) {
              const match = entry.content.match(/scratch[/\\]([\w-]+)/);
              if (match && match[1]) {
                projectName = match[1];
                foundProj = true;
              }
            }
            if (!foundTitle && entry.type === "USER_INPUT" && entry.content) {
              let text = entry.content.replace(/<[^>]+>/g, "").trim();
              if (text) {
                title = text.length > 25 ? text.substring(0, 25) + "..." : text;
                foundTitle = true;
              }
            }
          } catch(e) {}
        }
      }

      const payload = {
        hook_event_name: "AgentStateChange",
        conversationId: mainConvoId,
        transcriptPath,
        agentId,
        agentName: agentId.endsWith("-antigravity-1") ? "안티그래비티 (관전 모드)" : `서브 에이전트 (${agentId.substring(0,6)})`,
        timestamp,
        metadata: { projectName, title }
      };

      const attemptSync = async (retries = 5) => {
        try {
          const res = await fetch("http://localhost:3000/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const text = await res.text();
          console.log(`[AG Watcher] Sync triggered for ${mainConvoId.substring(0,6)} (${agentId.substring(0,6)}): ${res.status} ${text}`);
        } catch (e) {
          if (retries > 0) {
            console.log(`[AG Watcher] Fetch failed for ${mainConvoId.substring(0,6)}, retrying in 2s...`);
            setTimeout(() => attemptSync(retries - 1), 2000);
          } else {
            console.error(`[AG Watcher] Failed to sync ${mainConvoId.substring(0,6)} after retries:`, e.message);
          }
        }
      };
      await attemptSync();
    } catch (e) {
      console.error("[AG Watcher] Error in notification timer:", e);
    }
  }, 300);
  
  debounceTimers.set(debounceKey, timer);
}

function watchTranscript(mainConvoId, agentId, transcriptPath, isMain) {
  const watchKey = `${mainConvoId}_${agentId}`;
  if (watchers.has(watchKey)) return;
  if (!fs.existsSync(transcriptPath)) return;

  console.log(`[AG Watcher] Watching new transcript for: ${mainConvoId} (${agentId})`);
  notifyTeamSeem(mainConvoId, transcriptPath, agentId);

  const watcher = chokidar.watch(transcriptPath, {
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    },
    usePolling: false // use fs.watch events instead of polling
  });

  watcher.on('change', () => {
    notifyTeamSeem(mainConvoId, transcriptPath, agentId);
    if (isMain) {
      scanForSubagents(mainConvoId, transcriptPath);
    }
  });
  
  watchers.set(watchKey, watcher);
}

function scanForSubagents(mainConvoId, mainTranscriptPath) {
  if (!fs.existsSync(mainTranscriptPath)) return;
  try {
    const data = fs.readFileSync(mainTranscriptPath, "utf-8");
    for (const line of data.split("\n")) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        if (entry.type === "INVOKE_SUBAGENT" && entry.source === "MODEL") {
          const match = (entry.content || "").match(/"conversationId":\s*"([^"]+)"/);
          if (match && match[1]) {
            const subId = match[1];
            if (!watchers.has(subId)) {
              const subPath = path.join(BRAIN_DIR, subId, ".system_generated", "logs", "transcript.jsonl");
              watchTranscript(mainConvoId, subId, subPath, false);
            }
          }
        }
      } catch (e) {}
    }
  } catch (e) {
    console.error("[AG Watcher] Error scanning for subagents:", e.message);
  }
}

function discoverSessions() {
  if (!fs.existsSync(BRAIN_DIR)) return;
  const dirs = fs.readdirSync(BRAIN_DIR, { withFileTypes: true }).filter(d => d.isDirectory());
  
  const subagentIds = new Set();
  
  for (const dir of dirs) {
    const transcriptPath = path.join(BRAIN_DIR, dir.name, ".system_generated", "logs", "transcript.jsonl");
    if (!fs.existsSync(transcriptPath)) continue;
    
    try {
      const data = fs.readFileSync(transcriptPath, "utf-8");
      for (const line of data.split("\n")) {
        if (!line.trim()) continue;
        try {
          const entry = JSON.parse(line);
          if (entry.type === "INVOKE_SUBAGENT") {
            const match = (entry.content || "").match(/"conversationId":\s*"([^"]+)"/);
            if (match && match[1]) {
              subagentIds.add(match[1]);
            }
          }
        } catch(e) {}
      }
    } catch(e) {}
  }

  const mainSessions = dirs.map(d => d.name).filter(id => !subagentIds.has(id));
  console.log("[AG Watcher] Discovered main sessions:", mainSessions.length);

  mainSessions.forEach((mainId, index) => {
    setTimeout(() => {
      const transcriptPath = path.join(BRAIN_DIR, mainId, ".system_generated", "logs", "transcript.jsonl");
      if (fs.existsSync(transcriptPath)) {
        watchTranscript(mainId, `${mainId}-antigravity-1`, transcriptPath, true);
        scanForSubagents(mainId, transcriptPath);
      }
    }, index * 200);
  });
}

console.log("[AG Watcher] Starting multi-session observer mode for Antigravity using Chokidar...");
setTimeout(discoverSessions, 5000);

if (fs.existsSync(BRAIN_DIR)) {
  chokidar.watch(BRAIN_DIR, {
    depth: 0,
    ignoreInitial: true
  }).on('addDir', (dirPath) => {
    const sessionId = path.basename(dirPath);
    console.log(`[AG Watcher] Detected new session folder: ${sessionId}`);
    
    let attempts = 0;
    const interval = setInterval(() => {
      const transcriptPath = path.join(dirPath, ".system_generated", "logs", "transcript.jsonl");
      if (fs.existsSync(transcriptPath)) {
        clearInterval(interval);
        const watchKey = `${sessionId}_${sessionId}-antigravity-1`;
        if (!watchers.has(watchKey)) {
          console.log(`[AG Watcher] Hooking into new transcript: ${sessionId}`);
          watchTranscript(sessionId, `${sessionId}-antigravity-1`, transcriptPath, true);
          scanForSubagents(sessionId, transcriptPath);
        }
      } else if (attempts++ > 30) {
        clearInterval(interval);
      }
    }, 1000);
  });
}

// Run auto-stop cron every 5 minutes
setInterval(() => {
  fetch("http://localhost:3000/api/cron")
    .then(r => r.json())
    .then(data => {
      if (data.stopped > 0) {
        console.log(`[AG Watcher] Auto-stopped ${data.stopped} stale sessions.`);
      }
    })
    .catch(() => {});
}, 5 * 60 * 1000);
