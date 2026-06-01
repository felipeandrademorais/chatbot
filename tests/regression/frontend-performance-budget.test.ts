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

describe('frontend performance budget', () => {
  it('serves primary screen within LCP target proxy budget', async () => {
    const startedAt = performance.now()
    const response = await webApp.inject({ method: 'GET', url: '/' })
    const elapsedMs = performance.now() - startedAt

    expect(response.statusCode).toBe(200)
    expect(elapsedMs).toBeLessThan(2500)
    expect(Buffer.byteLength(response.body, 'utf8')).toBeLessThan(75_000)
  })
})
