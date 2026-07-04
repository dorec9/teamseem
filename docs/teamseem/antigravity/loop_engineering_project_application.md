# 루프 엔지니어링 × 풍력발전량 예측 프로젝트 적용 전략

- **관련 문서**:
  - [[loop_engineering]] — 루프 엔지니어링 이론
  - [[docs/domain/wind_physics]] — 풍력 발전 물리 지식
  - [[docs/raw/11 루프 엔지니어링 (Loop Engineering)|원본 스크래핑]]

---

## 🎯 프로젝트 개요 (BARAM 2026)

- **목표**: 태백가덕산풍력발전소(64.2MW, 17기) 3개 그룹의 시간별 발전량 예측
- **평가**: `Score = (1-NMAE)×0.5 + 정산금획득률×0.5`
- **핵심 제약**: 실제 발전량 10% 미만 시간대는 채점 제외, 전날 14시 기준 Day+1 예측

> **원본 문서에서의 직접 언급**: 닫힌 루프(Closed Loop)의 주요 적용 분야로 **"전력망 발전량 예측제 연동"**이 명시되어 있음

---

## 🔄 적용 전략 1: 닫힌 루프(Closed Loop) 기반 실험 자동화

### 개념 매핑

| 루프 엔지니어링 요소 | 풍력 프로젝트 적용 |
|---|---|
| **목표 정의** | "NMAE < 0.06 달성 + 정산금 최대화" |
| **정량적 Verifier** | `nMAE` 계산 함수 + 정산금 시뮬레이터 (이미 `metrics.py`에 구현) |
| **내부 루프 (Inner Loop)** | 피처 생성 → 모델 학습 → CV 평가 → 결과 관찰 → 하이퍼파라미터/피처 교정 |
| **외부 루프 (Outer Loop)** | 실험 스케줄러가 N개 실험 조합을 생성하고 순차/병렬 배분 |
| **Hard Timeout** | 실험당 최대 30분, 전체 루프 최대 4시간으로 비용 폭발 방지 |

### 구체적 구현 구조

```
[외부 루프: 실험 오케스트레이터]
    │
    ├── 실험 1: {model: LightGBM, features: v1, groups: separate}
    ├── 실험 2: {model: CatBoost, features: v2, groups: unified}
    ├── 실험 3: {model: XGBoost, features: v1+physics, groups: separate}
    │      ...
    │
    └── [내부 루프: 각 실험]
         ├── 피처 엔지니어링 실행
         ├── K-Fold 시계열 CV 학습
         ├── nMAE + 정산금 Verifier 평가  ◀── 닫힌 루프 핵심
         ├── 결과 기록 → experiments/ 폴더 (영속성 상태 저장소)
         └── Verifier 기준 미달 시 → 하이퍼파라미터 조정 후 재시도
```

---

## 🏗️ 적용 전략 2: 루프 엔지니어링 6대 구성 요소 → 프로젝트 매핑

### ① 오토메이션 (Automations) → 야간 자동 실험 실행

```python
# 개념적 구조: Cron 또는 /goal 슬래시 커맨드로 트리거
# "밤새 10개 피처 조합 × 3개 모델 = 30개 실험을 자율 순환 실행"

EXPERIMENT_BUDGET = {
    "max_experiments": 30,
    "max_time_per_experiment_min": 30,
    "total_budget_hours": 6,
    "early_stop_if_no_improvement_for": 5  # 5회 연속 개선 없으면 중단
}
```

- Antigravity의 `/goal` 커맨드 또는 `schedule` 도구를 활용하여 야간 무인 실험 루프 구동 가능
- **리스크 방지**: `early_stop_if_no_improvement_for` 정책으로 무한 루프 차단

### ② 워크트리 (Worktrees) → Git 브랜치 기반 실험 격리

```
main
├── experiment/lgbm-physics-v1     ← 에이전트 A가 독립 작업
├── experiment/catboost-ensemble-v2 ← 에이전트 B가 독립 작업  
└── experiment/xgb-stacking-v3     ← 에이전트 C가 독립 작업
```

- 각 실험이 별도 브랜치에서 `src/features.py`, `src/train.py`를 독립 수정
- 충돌 없이 병렬 실험 후, 최고 성능 브랜치를 `main`에 병합

### ③ 스킬 (Skills) → 프로젝트 불변 규칙 문서화

이미 `.cursorrules`에 일부 존재하나, 루프 엔지니어링 관점에서 강화해야 할 규칙들:

```markdown
# INVARIANTS (불변 규칙)
1. 풍속 < 3.0 m/s 또는 > 25.0 m/s → 예측값 강제 0 클리핑
2. 예측값은 절대 그룹별 설비용량(21.6/21.6/21.0 MW)을 초과할 수 없음
3. 테스트 데이터는 절대 학습에 사용 불가 (Pseudo-labeling 금지)
4. NWP 예보 시간은 h016~h039만 사용 (Data Leakage 방지)
5. 그룹 3(Unison U136)은 그룹 1·2(Vestas V126)와 Swept Area가 다름 → 별도 모델링 또는 피처 분리 필수
```

### ④ 플러그인/커넥터 (MCP) → 외부 기상 API 연동

- 공개된 공공 기상 데이터(기상청 API, ERA5 재분석 자료 등)를 MCP 서버를 통해 실시간 가져올 수 있는 커넥터 구축
- 대회 규정상 "공개된 공공 데이터"만 활용 가능하므로 출처 증빙 자동화

### ⑤ 서브에이전트 (Sub-agents) → 생성/검증 분리

| 서브에이전트 역할 | 구체적 임무 |
|---|---|
| **피처 생성 에이전트** | 물리 기반 피처(밀도 보정 풍속, dynamic α, LLJ 지표) 생산 |
| **모델 학습 에이전트** | LightGBM/CatBoost/XGBoost 학습 및 CV 수행 |
| **검증 서브에이전트** | 독립적으로 nMAE + 정산금 검증, 물리 제약 위반 탐지, 제출 파일 무결성 점검 |
| **앙상블 에이전트** | 최고 성능 단일 모델들의 가중 앙상블 최적화 |

> **핵심**: 학습 에이전트가 직접 자기 결과를 검증하면 편향 발생 → 검증 서브에이전트가 독립 교차 검증

### ⑥ 영속성 상태 저장소 → 실험 로그 디스크 기록

```
experiments/
├── experiment_log.md          ← 전체 실험 히스토리 (컨텍스트 윈도우 폭발 방지)
├── best_score.json            ← 현재까지 최고 성적
├── 2026-07-07_lgbm_v1/
│   ├── config.yaml
│   ├── cv_results.json
│   └── feature_importance.png
└── 2026-07-08_catboost_v2/
    ├── config.yaml
    └── cv_results.json
```

- 에이전트 대화가 리셋되어도 `experiment_log.md`를 읽어 이전 실험 결과를 복원
- **컨텍스트 윈도우 폭발 방지**: 수십 번의 실험 결과가 대화 이력에 쌓이지 않고 디스크에 격리

---

## 📊 적용 전략 3: 평가자-최적화자(Evaluator-Optimizer) 패턴 적용

풍력 예측에서 가장 직접적으로 적용 가능한 오케스트레이션 패턴:

```
┌─────────────────────────────────────────────┐
│           Evaluator-Optimizer Loop           │
│                                              │
│  [Generator]          [Evaluator]            │
│  모델 학습 +    ───→  nMAE 계산 +            │
│  예측값 생성          정산금 시뮬레이션       │
│       ↑                    │                 │
│       └── 피드백 ──────────┘                 │
│       "그룹3의 야간 시간대 NMAE가             │
│        0.12로 높음. 야간 LLJ 피처             │
│        추가를 제안"                           │
└─────────────────────────────────────────────┘
```

### 정산금 최적화를 위한 닫힌 루프 Verifier

```python
def verifier(predictions, actuals, capacity):
    """닫힌 루프의 핵심: 정량적 성공 기준"""
    nmae = calculate_nmae(predictions, actuals, capacity)
    settlement = calculate_settlement_rate(predictions, actuals, capacity)
    score = (1 - nmae) * 0.5 + settlement * 0.5

    # 통과 기준
    if score >= 0.75:
        return "PASS", score
    else:
        return "RETRY", {
            "score": score,
            "feedback": analyze_worst_segments(predictions, actuals),
            "suggestion": "야간/새벽 시간대 오차 집중 개선 필요"
        }
```

---

## 👥 적용 전략 4: 인간 참여 수준 설계 (HOTL)

우리 프로젝트에는 **인간 관리형(HOTL)** 구조가 최적:

| 단계 | 자율 실행 (AEE) | 인간 개입 지점 (ACE) |
|---|---|---|
| 피처 엔지니어링 | 물리 기반 피처 자동 생성 | 새로운 도메인 피처 아이디어 제안 시 검토 |
| 모델 학습 | CV 자동 실행, 하이퍼파라미터 탐색 | — |
| 검증 | nMAE + 정산금 자동 계산 | — |
| 실험 판단 | 최고 성적 자동 갱신 기록 | nMAE 개선 정체 시 전략 방향 전환 판단 |
| **최종 제출** | 제출 파일 생성 | ⚠️ **반드시 인간이 최종 확인 후 수동 제출** |

> **인지적 자포자기 방지**: 에이전트가 "Score 0.78 달성, 제출 준비 완료"라고 보고해도, 반드시 물리 제약 위반 여부 · 제출 파일 행수/결측값 등을 인간이 직접 점검

---

## ⚠️ 프로젝트 특화 리스크 통제

| 리스크 | 루프 엔지니어링 대응 | 프로젝트 구체 대응 |
|---|---|---|
| **무인 폭주** | Hard Timeout + 반복 컷오프 | 실험당 30분, 전체 6시간, 5회 연속 미개선 시 중단 |
| **이해도 부채** | MRP 인간 가독형 요약 | 실험 완료 시 `walkthrough.md`에 "왜 이 피처가 효과적인지" 물리적 근거 기록 |
| **Data Leakage** | BriefingScript 불변 조건 | NWP h016~h039 사용, SCADA는 학습만, 테스트 데이터 절대 학습 미사용 |
| **과적합** | Evaluator-Optimizer | 시계열 CV(Expanding Window)로 미래 구간 일반화 성능 검증 |

---

## 🗺️ 실행 로드맵

```mermaid
graph LR
    A["7/6 대회 시작<br>데이터 확인"] --> B["Day 1-2<br>BriefingScript 작성<br>불변 규칙 확정"]
    B --> C["Day 3-7<br>닫힌 루프 실험<br>Evaluator-Optimizer"]
    C --> D["Week 2-3<br>야간 자동 실험<br>HOTL 관제"]
    D --> E["Week 4-5<br>앙상블 최적화<br>서브에이전트 교차검증"]
    E --> F["8/14<br>최종 제출<br>HITL 인간 승인"]
```
