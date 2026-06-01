/**
 * Health endpoint contract (Stage 02).
 */

export type HealthStatus = 'ok' | 'degraded' | 'unhealthy'

export interface LivenessResponse {
  status: 'ok'
  service: string
  timestamp: string
}

export interface ReadinessCheck {
  status: HealthStatus
  message?: string
}

export interface ReadinessResponse {
  status: HealthStatus
  service: string
  timestamp: string
  checks: Record<string, ReadinessCheck>
}

export const HEALTH_ROUTES = {
  live: '/health/live',
  ready: '/health/ready',
} as const
