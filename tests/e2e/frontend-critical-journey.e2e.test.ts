import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { FastifyInstance } from 'fastify'

import { createMockWorkflowApi, createTestWebServer } from '../helpers/frontend-test-utils.js'

let mockApi: FastifyInstance
let webApp: FastifyInstance

beforeEach(async () => {
  const mock = await createMockWorkflowApi()
  mockApi = mock.server
  webApp = await createTestWebServer(mock.url)
})

afterEach(async () => {
  await Promise.all([webApp.close(), mockApi.close()])
})

describe('frontend critical journey', () => {
  it('completes submit -> inspect result flow', async () => {
    const submit = await webApp.inject({
      method: 'POST',
      url: '/workflows',
      payload: new URLSearchParams({ taskType: 'summary', payload: '{}' }).toString(),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    })

    expect(submit.statusCode).toBe(302)
    expect(submit.headers.location).toBe('/workflows/wf-1')

    const details = await webApp.inject({
      method: 'GET',
      url: '/workflows/wf-1',
    })

    expect(details.statusCode).toBe(200)
    expect(details.body).toContain('State: Success state')
    expect(details.body).toContain('Workflow finished')
  })

  it('supports recoverable retry for failed workflows', async () => {
    const submit = await webApp.inject({
      method: 'POST',
      url: '/workflows',
      payload: new URLSearchParams({ taskType: 'fail-once', payload: '{}' }).toString(),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    })
    expect(submit.headers.location).toBe('/workflows/wf-1')

    const failedDetails = await webApp.inject({
      method: 'GET',
      url: '/workflows/wf-1',
    })
    expect(failedDetails.body).toContain('Retry workflow')
    expect(failedDetails.body).toContain('Simulated failure')

    const retry = await webApp.inject({
      method: 'POST',
      url: '/workflows/wf-1/retry',
    })
    expect(retry.statusCode).toBe(302)
    expect(retry.headers.location).toBe('/workflows/wf-1')

    const recovered = await webApp.inject({
      method: 'GET',
      url: '/workflows/wf-1',
    })
    expect(recovered.body).toContain('Retried workflow finished')
    expect(recovered.body).not.toContain('Retry workflow')
  })
})
