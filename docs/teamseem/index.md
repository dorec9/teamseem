# Gemini / Antigravity 마이그레이션 가이드

이 문서는 기존 **Claude Code**에 맞춰져 있던 TeamSeem의 이벤트 연동 방식을 **Gemini 및 Antigravity SDK** 환경으로 전환하기 위한 가이드 모음입니다.

이 문서는 옵시디언(Obsidian)에서 열람하기에 최적화되어 있습니다.

## 목차 (Table of Contents)
- [[architecture-migration]] : 왜 아키텍처를 변경해야 하며, 어떤 방식으로 구성할 것인지(File Watcher 접근법)에 대한 가이드
- [[event-mapping-rules]] : Antigravity에서 뿜어내는 로그 데이터를 TeamSeem 포맷으로 변환하는 매핑 규칙
