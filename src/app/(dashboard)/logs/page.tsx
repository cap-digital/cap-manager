import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { LogsClient } from './logs-client'

export default async function LogsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'admin') {
    redirect('/')
  }

  return (
    <div>
      <Header title="Logs de Acesso" subtitle="Histórico de login dos usuários" />
      <div className="p-4 lg:p-8">
        <LogsClient />
      </div>
    </div>
  )
}
