#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const currentPath = path.resolve(root, 'packages/contracts/openapi/v1.0.0.openapi.json')
const baselinePath = path.resolve(root, 'packages/contracts/openapi/baseline/v1.0.0.openapi.json')

const readJson = async (filePath) => {
  const raw = await readFile(filePath, 'utf8')
  return JSON.parse(raw)
}

const fail = (message) => {
  process.stderr.write(`contract-compat: ${message}\n`)
  process.exit(1)
}

const current = await readJson(currentPath).catch((error) => {
  fail(`unable to read current contract: ${error instanceof Error ? error.message : String(error)}`)
})
const baseline = await readJson(baselinePath).catch((error) => {
  fail(`unable to read baseline contract: ${error instanceof Error ? error.message : String(error)}`)
})

if (current.info?.version !== baseline.info?.version) {
  fail(
    `version mismatch (${String(baseline.info?.version)} -> ${String(current.info?.version)}). ` +
      'Breaking changes require a major version path and deprecation process.',
  )
}

const currentPaths = current.paths ?? {}
const baselinePaths = baseline.paths ?? {}

for (const [pathName, baselinePathItem] of Object.entries(baselinePaths)) {
  const currentPathItem = currentPaths[pathName]
  if (currentPathItem === undefined) {
    fail(`breaking change detected: removed path ${pathName}`)
  }

  const baselineMethods = Object.keys(baselinePathItem)
  for (const method of baselineMethods) {
    if (!(method in currentPathItem)) {
      fail(`breaking change detected: removed method ${method.toUpperCase()} ${pathName}`)
    }

    const baselineResponse = baselinePathItem[method]?.responses?.['200'] ?? baselinePathItem[method]?.responses?.['201']
    const currentResponse = currentPathItem[method]?.responses?.['200'] ?? currentPathItem[method]?.responses?.['201']
    if (baselineResponse !== undefined && currentResponse === undefined) {
      fail(`breaking change detected: missing success response on ${method.toUpperCase()} ${pathName}`)
    }
  }
}

process.stdout.write('contract-compat: OK\n')
