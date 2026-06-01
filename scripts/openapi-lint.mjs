#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const specPath = path.resolve(root, 'packages/contracts/openapi/v1.0.0.openapi.json')

const fail = (message) => {
  process.stderr.write(`openapi-lint: ${message}\n`)
  process.exit(1)
}

const mustBeObject = (value, label) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${label} must be an object`)
  }
}

const specRaw = await readFile(specPath, 'utf8').catch((error) => {
  fail(`unable to read spec at ${specPath}: ${error instanceof Error ? error.message : String(error)}`)
})

const spec = JSON.parse(specRaw)
mustBeObject(spec, 'document')

if (spec.openapi !== '3.1.0') {
  fail('openapi version must be 3.1.0')
}

mustBeObject(spec.info, 'info')
if (typeof spec.info.version !== 'string' || spec.info.version.length === 0) {
  fail('info.version is required')
}
if (!spec.info.version.startsWith('1.')) {
  fail('stage 04 requires major v1 contract')
}

mustBeObject(spec.paths, 'paths')
if (!Object.keys(spec.paths).every((entry) => entry.startsWith('/api/v1'))) {
  fail('all API paths must be versioned under /api/v1')
}

const requiredPaths = [
  '/api/v1/openapi.json',
  '/api/v1/sessions',
  '/api/v1/conversations',
  '/api/v1/conversations/{conversationId}/messages',
  '/api/v1/workflows',
  '/api/v1/workflows/{workflowId}/tasks/{taskId}/complete',
  '/api/v1/workflows/{workflowId}/cancel',
]

for (const requiredPath of requiredPaths) {
  if (!(requiredPath in spec.paths)) {
    fail(`missing required path: ${requiredPath}`)
  }
}

mustBeObject(spec.components, 'components')
mustBeObject(spec.components.schemas, 'components.schemas')
if (!('ErrorEnvelope' in spec.components.schemas)) {
  fail('components.schemas.ErrorEnvelope is required')
}

process.stdout.write('openapi-lint: OK\n')
