# Stage 07 Alert Policies

SLO-oriented alert policies for observability baseline.

## Severity Model

- **P1**: full outage, corruption, or security incident
- **P2**: critical-path degradation

## Policy Set (AC-07-003)

### P1 - Gateway Unavailable

- Condition: `sum(up{job="gateway"} == 0) > 0` for `2m`
- Ack target median: `< 10m`
- Escalation: on-call engineer -> incident channel -> engineering lead

### P1 - Orchestrator Unavailable

- Condition: `sum(up{job="orchestrator"} == 0) > 0` for `2m`
- Ack target median: `< 10m`
- Escalation: on-call engineer -> incident channel -> engineering lead

### P2 - Elevated API Error Rate

- Condition:
  - `sum(rate(chatbot_http_request_errors_total{service="gateway"}[5m]))`
  - `/ sum(rate(chatbot_http_requests_total{service="gateway"}[5m])) > 0.05`
  - for `10m`
- Ack target median: `< 10m`
- Escalation: on-call engineer -> service owner

### P2 - Queue Saturation

- Condition: `chatbot_queue_depth{service="orchestrator",queue="workflow"} > 200` for `10m`
- Ack target median: `< 10m`
- Escalation: on-call engineer -> orchestrator owner

### P2 - Ollama Health Degraded

- Condition: `chatbot_ollama_health{service="worker"} < 1` for `5m`
- Ack target median: `< 10m`
- Escalation: on-call engineer -> worker/integrations owner

## Validation Procedure

Synthetic drill commands:

1. Stop gateway (expect P1 gateway alert)
2. Stop orchestrator (expect P1 orchestrator alert)
3. Inject failing requests for error-rate burn (expect P2 API error alert)
4. Simulate queue buildup in orchestrator metrics adapter (expect P2 queue alert)
5. Set worker Ollama health gauge to `0` (expect P2 Ollama alert)

Record for each drill:

- fired timestamp
- ack timestamp
- ack latency (minutes)
- resolver
