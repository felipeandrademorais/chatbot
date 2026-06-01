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

describe('frontend workflow integration', () => {
  it('submits workflow and redirects to workflow page', async () => {
    const submitResponse = await webApp.inject({
      method: 'POST',
      url: '/workflows',
      payload: new URLSearchParams({
        taskType: 'summary',
        payload: '{"topic":"health"}',
      }).toString(),
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    })

    expect(submitResponse.statusCode).toBe(302)
    const location = submitResponse.headers.location
    expect(location).toMatch(/^\/workflows\/wf-\d+$/)

    const detailsResponse = await webApp.inject({
      method: 'GET',
      url: String(location),
    })
    expect(detailsResponse.statusCode).toBe(200)
    expect(detailsResponse.body).toContain('Workflow wf-1')
    expect(detailsResponse.body).toContain('Result')
  })
})
