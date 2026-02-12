'use client'

import { useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'

const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000 // 30 dias em ms

export function SessionTimeout() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated' || !session) return

    // Armazenar timestamp do último login se não existir
    const lastLoginKey = `lastLogin_${session.user.id}`
    const lastLogin = localStorage.getItem(lastLoginKey)

    if (!lastLogin) {
      localStorage.setItem(lastLoginKey, Date.now().toString())
    }

    // Verificar expiração a cada 5 minutos
    const interval = setInterval(async () => {
      const storedLastLogin = localStorage.getItem(lastLoginKey)

      if (storedLastLogin) {
        const loginTime = parseInt(storedLastLogin)
        const now = Date.now()
        const elapsed = now - loginTime

        // Se passou mais de 30 dias, fazer logout
        if (elapsed > SESSION_MAX_AGE) {
          console.log('[SESSION] Sessão expirada após 30 dias, fazendo logout automático')
          localStorage.removeItem(lastLoginKey)
          await signOut({ callbackUrl: '/login' })
          return
        }
      }

      // Verificar se a sessão ainda é válida no servidor
      try {
        const response = await fetch('/api/auth/session')
        const currentSession = await response.json()

        if (!currentSession || !currentSession.user) {
          console.log('[SESSION] Sessão inválida no servidor, fazendo logout automático')
          localStorage.removeItem(lastLoginKey)
          await signOut({ callbackUrl: '/login' })
        }
      } catch (error) {
        console.error('[SESSION] Erro ao verificar sessão:', error)
      }
    }, 5 * 60 * 1000) // 5 minutos

    return () => clearInterval(interval)
  }, [session, status])

  return null
}
