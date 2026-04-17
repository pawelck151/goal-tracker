'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
  hashPassword,
  verifyPassword,
  setSession,
  clearSession,
} from '@/lib/auth'

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Podaj email i hasło' }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return { error: 'Nieprawidłowy email lub hasło' }
  }

  await setSession(user.id)
  redirect('/dashboard')
}

export async function registerAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (!isValidEmail(email)) {
    return { error: 'Nieprawidłowy email' }
  }
  if (password.length < 8) {
    return { error: 'Hasło musi mieć co najmniej 8 znaków' }
  }
  if (password !== confirm) {
    return { error: 'Hasła nie są takie same' }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: 'Użytkownik o tym emailu już istnieje' }
  }

  const user = await prisma.user.create({
    data: { email, passwordHash: hashPassword(password) },
  })

  await setSession(user.id)
  redirect('/dashboard')
}

export async function logoutAction(): Promise<void> {
  await clearSession()
  redirect('/login')
}
