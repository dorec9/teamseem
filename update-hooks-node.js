const fs = require("fs");
const path = require("path");

const HOOK_EVENTS = [
  "PreToolUse",
  "PostToolUse",
  "SubagentStart",
  "SubagentStop",
  "Stop",
  "TaskCreated",
  "TaskCompleted",
];

const targetPath = "C:\\Users\\ehgus\\.gemini\\antigravity\\scratch\\teamseem\\.agents\\hooks.json";

function generateHookConfig() {
  // Try passing the payload as a command-line argument wrapped in double quotes
  const command = `node C:/Users/ehgus/.gemini/antigravity/scratch/teamseem/log-hook.js "$CLAUDE_HOOK_PAYLOAD"`;

  const hooks = {};
  for (const event of HOOK_EVENTS) {
    hooks[event] = [{ type: "command", command }];
  }

  return { hooks };
}

const config = generateHookConfig();
fs.writeFileSync(targetPath, JSON.stringify(config, null, 2), "utf8");
console.log("Successfully wrote hooks.json using Node script");
