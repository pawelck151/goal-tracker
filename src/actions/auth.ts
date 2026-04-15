'use server'

import { redirect } from 'next/navigation'
import { validatePin, setSession, clearSession } from '@/lib/auth'

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const pin = formData.get('pin') as string
  if (!validatePin(pin)) {
    return { error: 'Nieprawidłowy PIN' }
  }
  await setSession()
  redirect('/dashboard')
}

export async function logoutAction(): Promise<void> {
  await clearSession()
  redirect('/login')
}
