import { describe, expect, it } from 'vitest'

import { createTelemetryCorrelation, TELEMETRY_ROUTES } from '../src/telemetry.js'

describe('telemetry contract', () => {
  it('defines canonical telemetry endpoints', () => {
    expect(TELEMETRY_ROUTES.metrics).toBe('/metrics')
    expect(TELEMETRY_ROUTES.context).toBe('/internal/telemetry/context')
    expect(TELEMETRY_ROUTES.traces).toBe('/internal/telemetry/traces')
  })

  it('builds valid telemetry correlation payloads', () => {
    expect(
      createTelemetryCorrelation('req-123', 'wf-456'),
    ).toEqual({
      requestId: 'req-123',
      workflowId: 'wf-456',
    })
  })

  it('rejects empty correlation identifiers', () => {
    expect(() => createTelemetryCorrelation('', 'wf-456')).toThrow('requestId must not be empty')
    expect(() => createTelemetryCorrelation('req-123', '  ')).toThrow(
      'workflowId must not be empty',
    )
  })
})
