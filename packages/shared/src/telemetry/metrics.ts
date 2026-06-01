import client from 'prom-client'

const register = new client.Registry()
client.collectDefaultMetrics({ register })

const requestCount = new client.Counter({
  name: 'chatbot_http_requests_total',
  help: 'Total number of HTTP requests by service and route.',
  labelNames: ['service', 'route', 'method', 'status_code'],
  registers: [register],
})

const requestDurationSeconds = new client.Histogram({
  name: 'chatbot_http_request_duration_seconds',
  help: 'HTTP request duration in seconds.',
  labelNames: ['service', 'route', 'method', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
})

const requestErrors = new client.Counter({
  name: 'chatbot_http_request_errors_total',
  help: 'Total HTTP request failures by service and route.',
  labelNames: ['service', 'route', 'method'],
  registers: [register],
})

const queueDepth = new client.Gauge({
  name: 'chatbot_queue_depth',
  help: 'Current queue depth by queue name.',
  labelNames: ['service', 'queue'],
  registers: [register],
})

const agentExecutions = new client.Counter({
  name: 'chatbot_agent_executions_total',
  help: 'Total agent executions grouped by result.',
  labelNames: ['service', 'agent', 'result'],
  registers: [register],
})

const ollamaHealth = new client.Gauge({
  name: 'chatbot_ollama_health',
  help: 'Ollama runtime health, where 1=healthy and 0=unhealthy.',
  labelNames: ['service'],
  registers: [register],
})

export function recordHttpRequest(input: {
  service: string
  route: string
  method: string
  statusCode: number
  durationMs: number
}): void {
  const labels = {
    service: input.service,
    route: input.route,
    method: input.method.toUpperCase(),
    status_code: String(input.statusCode),
  }
  requestCount.inc(labels)
  requestDurationSeconds.observe(labels, input.durationMs / 1_000)
}

export function recordHttpError(input: { service: string; route: string; method: string }): void {
  requestErrors.inc({
    service: input.service,
    route: input.route,
    method: input.method.toUpperCase(),
  })
}

export function setQueueDepth(input: { service: string; queue: string; depth: number }): void {
  queueDepth.set({ service: input.service, queue: input.queue }, input.depth)
}

export function recordAgentExecution(input: {
  service: string
  agent: string
  result: 'success' | 'failure'
}): void {
  agentExecutions.inc({
    service: input.service,
    agent: input.agent,
    result: input.result,
  })
}

export function setOllamaHealth(service: string, healthy: boolean): void {
  ollamaHealth.set({ service }, healthy ? 1 : 0)
}

export async function renderPrometheusMetrics(): Promise<string> {
  return register.metrics()
}
