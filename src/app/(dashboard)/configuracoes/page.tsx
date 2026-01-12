import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { ConfiguracoesClient } from './configuracoes-client'

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <>
      <Header title="Configurações" subtitle="Configure suas preferências de notificações" />
      <ConfiguracoesClient />
    </>
  )
}
