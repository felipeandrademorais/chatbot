import { describe, it, expect } from 'vitest'
import { SHARED_VERSION } from '../src/index.js'

describe('Shared Package', () => {
  it('should export SHARED_VERSION as a string', () => {
    expect(typeof SHARED_VERSION).toBe('string')
  })

  it('should have a valid semver-like version', () => {
    expect(SHARED_VERSION).toMatch(/^0\.\d+\.\d+$/)
  })
})
