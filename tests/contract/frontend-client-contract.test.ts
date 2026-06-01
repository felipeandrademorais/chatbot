import { describe, expect, it } from 'vitest'

import { createWorkflowApiClient } from '../../apps/web/src/api/client.js'
import type { paths } from '../../apps/web/src/api/generated/openapi-types.js'

describe('frontend OpenAPI client contract', () => {
  it('exposes typed method payload aligned with OpenAPI request schema', () => {
    type CreatePayload =
      paths['/api/v1/workflows']['post']['requestBody']['content']['application/json']
    const _typedPayload: CreatePayload = {
      taskType: 'summary',
      payload: { prompt: 'hello' },
    }

    const client = createWorkflowApiClient('http://localhost:3000')
    expect(typeof client.createWorkflow).toBe('function')
  })
})
