import { access, readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const rootDir = process.cwd()

describe('foundation baseline contracts (Stage 01)', () => {
  it('pins Node.js 24 consistently across runtime declarations', async () => {
    const [nvmrcRaw, packageJsonRaw, ciWorkflowRaw] = await Promise.all([
      readFile(path.resolve(rootDir, '.nvmrc'), 'utf8'),
      readFile(path.resolve(rootDir, 'package.json'), 'utf8'),
      readFile(path.resolve(rootDir, '.github/workflows/ci.yml'), 'utf8'),
    ])

    const nvmrc = nvmrcRaw.trim()
    const packageJson = JSON.parse(packageJsonRaw) as {
      packageManager?: string
      engines?: { node?: string; pnpm?: string }
    }

    expect(nvmrc).toBe('24')
    expect(packageJson.engines?.node).toBe('>=24.0.0 <25.0.0')
    expect(packageJson.engines?.pnpm).toBe('9.15.4')
    expect(ciWorkflowRaw).toContain("NODE_VERSION: '24'")
  })

  it('pins package manager and lockfile for deterministic installs', async () => {
    const packageJsonRaw = await readFile(path.resolve(rootDir, 'package.json'), 'utf8')
    const packageJson = JSON.parse(packageJsonRaw) as { packageManager?: string }

    expect(packageJson.packageManager).toBe('pnpm@9.15.4')

    const lockfilePath = path.resolve(rootDir, 'pnpm-lock.yaml')
    await expect(access(lockfilePath)).resolves.toBeUndefined()

    const lockfile = await readFile(lockfilePath, 'utf8')
    expect(lockfile.trim().length).toBeGreaterThan(0)
  })
})
