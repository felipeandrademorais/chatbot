import { describe, expect, it } from 'vitest'

import { createOllamaModelContractFromEnv } from '../src/ollama-config.js'

describe('createOllamaModelContractFromEnv', () => {
  it('includes the default model and configured approved list', () => {
    const contract = createOllamaModelContractFromEnv({
      model: 'gemma4:e2b',
      approvedModelsCsv: 'gemma4:e2b,gemma4:e4b',
      fallbackModel: 'gemma4:e4b',
    })

    expect(contract.fallbackModel).toBe('gemma4:e4b')
    expect(contract.approvedModels.map((entry) => entry.name).sort()).toEqual([
      'gemma4:e2b',
      'gemma4:e4b',
    ])
  })
})
