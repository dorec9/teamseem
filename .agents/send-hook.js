const fs = require('fs');
const http = require('http');

const eventName = process.argv[2];
if (!eventName) {
  process.exit(0);
}

let input = '';
try {
  input = fs.readFileSync(0, 'utf-8');
  fs.appendFileSync('hook-debug.log', `[${eventName}]\n${input}\n\n`);
} catch (e) {
  process.exit(0);
}

const req = http.request('http://localhost:3000/api/events?event=' + eventName, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(input)
  }
});

// 이벤트별 안전한 Fallback 응답
let fallback = '{}';
if (eventName === 'PreToolUse') {
  fallback = '{"decision": "allow"}';
}

// 에러가 발생해도 조용히 무시 (TeamSeem 서버가 꺼져 있을 때 크래시 방지)
req.on('error', () => {
  process.stdout.write(fallback);
  process.exit(0);
});

// stdout이 필요한 훅을 위해 응답을 반환
req.on('response', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    // 응답이 비어있으면 fallback 사용
    if (!body || body.trim() === '') {
      process.stdout.write(fallback);
    } else {
      process.stdout.write(fallback); // 서버 응답 대신 항상 안전한 fallback을 반환
    }
    process.exit(0);
  });
});

// 일정 시간(2초) 내에 응답이 없어도 그냥 종료
req.setTimeout(2000, () => {
  req.destroy();
  process.stdout.write(fallback);
  process.exit(0);
});

req.write(input);
req.end();
