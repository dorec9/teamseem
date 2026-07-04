const fs = require('fs');
const lines = fs.readFileSync('C:/Users/ehgus/.gemini/antigravity/brain/ff4e9f5a-47be-4c78-8332-4295af8b6a5e/.system_generated/logs/transcript.jsonl', 'utf-8').split('\n');
lines.forEach(line => {
  if(!line.trim()) return;
  try {
    const entry = JSON.parse(line);
    if(entry.type === 'INVOKE_SUBAGENT' && entry.source === 'MODEL'){
      const content = entry.content || '';
      const match = content.match(/"conversationId":\s*"([^"]+)"/);
      console.log(match ? match[1] : 'no match');
    }
  } catch(e){}
});
