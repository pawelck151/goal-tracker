import { cookies } from 'next/headers'

export function validatePin(pin: string): boolean {
  return Boolean(pin) && pin === process.env.PIN_PASSWORD
}

export async function setSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('session', process.env.AUTH_SECRET!, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
