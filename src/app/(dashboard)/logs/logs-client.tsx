'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LogIn, RefreshCw, Shield, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface LoginLog {
  usuario_id: number
  nome: string
  email: string
  role: string
  avatar_url: string | null
  ativo: boolean
  login_count: number
  ultimo_login: string
  providers: string[]
}

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  trader: 'Trader',
  gestor: 'Gestor',
  cliente: 'Cliente',
}

export function LogsClient() {
  const [logs, setLogs] = useState<LoginLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/login-logs')
      if (res.ok) {
        const data = await res.json()
        setLogs(data)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LogIn className="h-4 w-4" />
          <span>{logs.length} usuários com registro de login</span>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} className="rounded-xl">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Usuário</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Cargo</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Provider</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Logins</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Último Login</th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    Nenhum registro de login encontrado.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.usuario_id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={log.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {log.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{log.nome}</span>
                            {!log.ativo && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Inativo</Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{log.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="rounded-lg text-xs font-normal">
                        {log.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                        {log.role === 'gestor' || log.role === 'trader' ? <User className="h-3 w-3 mr-1" /> : null}
                        {roleLabels[log.role] || log.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {log.providers.map(p => (
                          <Badge key={p} variant="secondary" className="text-[10px] rounded-md">
                            {p === 'google' ? 'Google' : 'Email'}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold tabular-nums">{log.login_count}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-foreground">
                          {format(new Date(log.ultimo_login), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.ultimo_login), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
