# Stage 07 Dashboards

This dashboard set is the Stage 07 baseline for production visibility.

## Dashboard Coverage (AC-07-001)

- **API health and latency**
  - `rate(chatbot_http_requests_total{service="gateway"}[5m])`
  - `histogram_quantile(0.95, sum(rate(chatbot_http_request_duration_seconds_bucket{service="gateway"}[5m])) by (le))`
  - `sum(rate(chatbot_http_request_errors_total{service="gateway"}[5m]))`
- **Queue health**
  - `chatbot_queue_depth{service="orchestrator",queue="workflow"}`
- **Agent health**
  - `sum(increase(chatbot_agent_executions_total{service="worker",result="success"}[10m]))`
  - `sum(increase(chatbot_agent_executions_total{service="worker",result="failure"}[10m]))`
- **Ollama runtime health**
  - `chatbot_ollama_health{service="worker"}`

## Required Panels

1. Gateway request throughput and p95 latency
2. Gateway error rate and status-code split
3. Orchestrator queue depth
4. Worker agent execution success/failure
5. Worker Ollama health gauge

## Correlation Drilldown

Use trace context endpoint and span history for request-level drilldown:

- `GET /internal/telemetry/context`
- `GET /internal/telemetry/traces?limit=50`

Expected fields:

- `requestId`
- `workflowId`
- `traceId`
- `spanId`
- `parentSpanId`
