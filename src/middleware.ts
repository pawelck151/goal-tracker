import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function base64urlEncode(bytes: ArrayBuffer): string {
  const b = new Uint8Array(bytes)
  let str = ''
  for (let i = 0; i < b.length; i++) str += String.fromCharCode(b[i])
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function verifySession(token: string, secret: string): Promise<boolean> {
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return false
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const computed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  const expected = base64urlEncode(computed)
  if (expected.length !== sig.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  return diff === 0
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/token/') ||
    pathname.startsWith('/api/cron/')
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('session')?.value
  const secret = process.env.AUTH_SECRET
  if (!token || !secret || !(await verifySession(token, secret))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
