# Stage 07 Operational Runbook

This runbook is the Stage 07 on-call baseline.

## Purpose

Diagnose the top five failure modes using dashboards and telemetry endpoints only.

## Top 5 Failure Modes

1. Gateway request failures spike
2. Orchestrator unavailable
3. Queue saturation (workflow backlog)
4. Worker agent failure growth
5. Ollama runtime degraded

## Required Telemetry Fields

Critical-path logs and spans must include:

- `requestId`
- `workflowId`
- `traceId`
- `spanId`

## Investigation Workflow

1. **Confirm impact**
   - Check gateway throughput and error ratio panel.
2. **Locate failing layer**
   - Compare gateway, orchestrator, and worker health panels.
3. **Follow request trace**
   - Query `GET /internal/telemetry/context` on affected service.
   - Query `GET /internal/telemetry/traces?limit=50`.
4. **Correlate by IDs**
   - Filter logs by `requestId` and `workflowId`.
5. **Mitigate**
   - Apply service-specific action from the matrix below.

## Failure Mode Matrix

### 1) Gateway request failures spike

- Signals:
  - `chatbot_http_request_errors_total{service="gateway"}`
  - p95 latency growth on gateway panel
- Actions:
  - Validate orchestrator dependency is reachable
  - Verify auth configuration and token validation path
  - Roll back latest gateway release if regression confirmed

### 2) Orchestrator unavailable

- Signals:
  - orchestrator `up == 0`
  - gateway internal orchestrator ping fails
- Actions:
  - Restart orchestrator service
  - Validate DB/Redis health checks
  - Confirm startup config and migration status

### 3) Queue saturation

- Signals:
  - `chatbot_queue_depth{service="orchestrator",queue="workflow"} > threshold`
- Actions:
  - Increase worker concurrency within safe limits
  - Rate-limit incoming traffic on gateway
  - Drain stale jobs if operationally safe

### 4) Worker agent failure growth

- Signals:
  - `chatbot_agent_executions_total{service="worker",result="failure"}`
- Actions:
  - Inspect traces for failed span clusters
  - Disable problematic agent or feature flag
  - Re-run failed workflows after mitigation

### 5) Ollama runtime degraded

- Signals:
  - `chatbot_ollama_health{service="worker"} < 1`
- Actions:
  - Validate Ollama process health
  - Trigger provider fallback path
  - Degrade non-critical features to preserve core path

## Alert Acknowledgement Target

- P1 and P2 median alert-to-ack: `< 10 minutes`

## Evidence to Collect During Incident

- Triggered alert name/severity
- Dashboard screenshots or metric snapshots
- Correlated `requestId` and `workflowId`
- Root cause summary
- Mitigation and rollback actions
