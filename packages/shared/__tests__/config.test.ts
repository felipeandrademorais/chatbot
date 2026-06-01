import { describe, expect, it } from 'vitest'

import { baseEnvSchema, gatewayEnvSchema } from '../src/config/env-schema.js'
import { ConfigValidationError, loadConfig } from '../src/config/load-config.js'

describe('loadConfig', () => {
  it('parses a valid base environment', () => {
    const env = loadConfig(baseEnvSchema, {
      NODE_ENV: 'test',
      LOG_LEVEL: 'info',
      POSTGRES_HOST: 'localhost',
      POSTGRES_PORT: '5432',
      POSTGRES_USER: 'chatbot',
      POSTGRES_PASSWORD: 'secret',
      POSTGRES_DB: 'chatbot',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
    })

    expect(env.POSTGRES_PORT).toBe(5432)
    expect(env.REDIS_PORT).toBe(6379)
  })

  it('throws ConfigValidationError for missing required fields', () => {
    expect(() => loadConfig(baseEnvSchema, {})).toThrow(ConfigValidationError)
  })

  it('rejects an empty POSTGRES_PASSWORD', () => {
    expect(() =>
      loadConfig(baseEnvSchema, {
        NODE_ENV: 'test',
        LOG_LEVEL: 'info',
        POSTGRES_HOST: 'localhost',
        POSTGRES_PORT: '5432',
        POSTGRES_USER: 'chatbot',
        POSTGRES_PASSWORD: '',
        POSTGRES_DB: 'chatbot',
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
      }),
    ).toThrow(ConfigValidationError)
  })

  it('parses gateway-specific environment', () => {
    const env = loadConfig(gatewayEnvSchema, {
      NODE_ENV: 'test',
      LOG_LEVEL: 'info',
      POSTGRES_HOST: 'localhost',
      POSTGRES_PORT: '5432',
      POSTGRES_USER: 'chatbot',
      POSTGRES_PASSWORD: 'secret',
      POSTGRES_DB: 'chatbot',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      GATEWAY_PORT: '3000',
      ORCHESTRATOR_URL: 'http://orchestrator:3001',
      JWT_SECRET: 'test-signing-secret-value-with-at-least-32-chars',
    })

    expect(env.GATEWAY_PORT).toBe(3000)
    expect(env.ORCHESTRATOR_URL).toContain('orchestrator:3001')
  })
})
