import { cookies } from 'next/headers'
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'crypto'
import { prisma } from '@/lib/prisma'

const SESSION_COOKIE = 'session'
const SCRYPT_KEYLEN = 64

function getSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET not set')
  return secret
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex')
  return `${salt}:${derived}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN)
  const hashBuf = Buffer.from(hash, 'hex')
  if (derived.length !== hashBuf.length) return false
  return timingSafeEqual(derived, hashBuf)
}

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function signPayload(payload: string): string {
  return base64url(createHmac('sha256', getSecret()).update(payload).digest())
}

function makeSessionToken(userId: string): string {
  const payload = base64url(Buffer.from(userId))
  return `${payload}.${signPayload(payload)}`
}

function parseSessionToken(token: string): string | null {
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expected = signPayload(payload)
  if (sig.length !== expected.length) return null
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  try {
    return Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
  } catch {
    return null
  }
}

export async function setSession(userId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, makeSessionToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return parseSessionToken(token)
}

export async function getCurrentUser() {
  const userId = await getCurrentUserId()
  if (!userId) return null
  return prisma.user.findUnique({ where: { id: userId } })
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}
