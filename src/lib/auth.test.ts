import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    set: vi.fn(),
    delete: vi.fn(),
  }),
}))

import { validatePin } from './auth'

describe('validatePin', () => {
  beforeEach(() => {
    process.env.PIN_PASSWORD = 'test-pin-123'
  })

  it('returns true for the correct PIN', () => {
    expect(validatePin('test-pin-123')).toBe(true)
  })

  it('returns false for a wrong PIN', () => {
    expect(validatePin('wrong')).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(validatePin('')).toBe(false)
  })
})
