import { describe, expect, it } from 'vitest'

import { HEALTH_ROUTES } from '../src/health.js'

describe('health contract', () => {
  it('exposes stable health route paths', () => {
    expect(HEALTH_ROUTES.live).toBe('/health/live')
    expect(HEALTH_ROUTES.ready).toBe('/health/ready')
  })
})
