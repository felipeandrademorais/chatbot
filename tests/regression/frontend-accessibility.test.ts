import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { JSDOM } from 'jsdom'

import { renderAppPage } from '../../apps/web/src/ui/render.js'

const require = createRequire(import.meta.url)
const axePath = require.resolve('axe-core/axe.min.js')

interface AxeViolation {
  impact: string | null
}

interface AxeResults {
  violations: AxeViolation[]
}

async function scan(html: string): Promise<AxeResults> {
  const dom = new JSDOM(html, { runScripts: 'outside-only' })
  const { window } = dom
  try {
    const source = await readFile(axePath, 'utf8')
    window.eval(source)
    const axeRun = (
      window as unknown as {
        axe: { run: (target: Document, options: unknown) => Promise<AxeResults> }
      }
    ).axe.run
    const results = await axeRun(window.document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa'],
      },
      rules: {
        // jsdom does not implement canvas APIs used by this rule.
        'color-contrast': { enabled: false },
      },
    })
    return results
  } finally {
    window.close()
  }
}

describe('frontend accessibility baseline', () => {
  it('home screen has no critical/serious violations', async () => {
    const results = await scan(renderAppPage({}))
    const seriousOrWorse = results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    )
    expect(seriousOrWorse).toHaveLength(0)
  })

  it('workflow result screen has no critical/serious violations', async () => {
    const html = renderAppPage({
      workflow: {
        workflowId: 'wf-1',
        status: 'completed',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:02.000Z',
        timeline: [{ status: 'completed', timestamp: '2026-01-01T00:00:02.000Z' }],
        result: 'Done',
      },
    })
    const results = await scan(html)
    const seriousOrWorse = results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    )
    expect(seriousOrWorse).toHaveLength(0)
  })
})
