import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    set: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  }),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: vi.fn() } },
}))

import { hashPassword, verifyPassword } from './auth'

describe('password hashing', () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = 'test-secret'
  })

  it('hashes and verifies a correct password', () => {
    const hash = hashPassword('hunter2-long')
    expect(verifyPassword('hunter2-long', hash)).toBe(true)
  })

  it('rejects a wrong password', () => {
    const hash = hashPassword('hunter2-long')
    expect(verifyPassword('wrong-pass', hash)).toBe(false)
  })

  it('returns false for malformed hash', () => {
    expect(verifyPassword('any', 'not-a-valid-hash')).toBe(false)
  })
})
