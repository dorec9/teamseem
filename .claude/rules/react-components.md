---
description: React 컴포넌트 작성 규칙
paths:
  - "src/components/**"
  - "src/app/**/*.tsx"
---

# React Component Rules

- Props 인터페이스를 컴포넌트 바로 위에 정의 (예: interface ChatMessageProps)
- 컴포넌트 파일명 = export 컴포넌트명 (PascalCase)
- 'use client' 디렉티브는 실제 클라이언트 기능(useState, useEffect, 이벤트 핸들러) 사용 시에만 추가
- 서버 컴포넌트를 기본으로 사용하고, 필요한 부분만 클라이언트 컴포넌트로 분리
- 조건부 렌더링은 early return 패턴 우선
- 이벤트 핸들러 네이밍: handle + 대상 + 액션 (예: handleMessageSend)
