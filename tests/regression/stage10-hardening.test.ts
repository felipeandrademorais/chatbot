import { access, readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const root = path.resolve(process.cwd())

async function expectFileExists(relativePath: string): Promise<void> {
  await expect(access(path.join(root, relativePath))).resolves.toBeUndefined()
}

describe('stage 10 hardening assets', () => {
  it('defines hardening scripts in package.json', async () => {
    const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>
    }
    const scripts = packageJson.scripts ?? {}

    expect(scripts['test:regression']).toBeDefined()
    expect(scripts['test:chaos']).toBeDefined()
    expect(scripts['test:rollback']).toBeDefined()
    expect(scripts['contract:freeze']).toBeDefined()
    expect(scripts['contract:compat']).toBeDefined()
  })

  it('ships release workflow helper scripts', async () => {
    const requiredScripts = [
      'scripts/deploy-staging.sh',
      'scripts/smoke-staging.sh',
      'scripts/e2e-critical.sh',
      'scripts/deploy-production.sh',
      'scripts/smoke-production.sh',
      'scripts/rollback-production.sh',
    ]

    await Promise.all(requiredScripts.map((scriptPath) => expectFileExists(scriptPath)))
  })

  it('includes stage 10 readiness documentation artifacts', async () => {
    const requiredDocs = [
      'docs/stages/10-final-hardening/contract-freeze.json',
      'docs/stages/10-final-hardening/operations-checklist.md',
      'docs/stages/10-final-hardening/rollback-playbook.md',
      'docs/stages/10-final-hardening/release-notes.md',
      'docs/stages/10-final-hardening/go-no-go.md',
    ]

    await Promise.all(requiredDocs.map((docPath) => expectFileExists(docPath)))
  })

  it('wires release workflow to enforce hardening gates', async () => {
    const workflow = await readFile(path.join(root, '.github/workflows/release.yml'), 'utf8')

    expect(workflow).toContain('pnpm run contract:freeze')
    expect(workflow).toContain('pnpm run contract:compat')
    expect(workflow).toContain('pnpm run test:regression')
    expect(workflow).toContain('pnpm run test:rollback')
    expect(workflow).toContain('generate-security-report.sh')
    expect(workflow).toContain('generate-license-report.sh')
    expect(workflow).toContain('release-compliance-${{ github.run_id }}')
  })
})
