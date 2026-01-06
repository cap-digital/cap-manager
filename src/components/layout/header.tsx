'use client'

import Link from 'next/link'
import { ArrowLeft, Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { Alerta } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface HeaderProps {
  title: string
  subtitle?: string
  backHref?: string
}

export function Header({ title, subtitle, backHref }: HeaderProps) {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Alerta[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    if (!session?.user) return

    // @ts-ignore
    const userId = session.user.id

    const { data } = await supabase
      .from('cap_manager_alertas')
      .select('*')
      .eq('destinatario_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.lido).length)
    }
  }

  const markAsRead = async () => {
    if (!session?.user || unreadCount === 0) return

    // @ts-ignore
    const userId = session.user.id

    // Optimistic update
    setNotifications(notifications.map(n => ({ ...n, lido: true })))
    setUnreadCount(0)

    await supabase
      .from('cap_manager_alertas')
      .update({ lido: true })
      .eq('destinatario_id', userId)
      .eq('lido', false)
  }

  useEffect(() => {
    fetchNotifications()

    // Optional: Subscribe to realtime (omitted for now to keep it simple as requested "fix inadequately")
    // If user wants realtime, we can add it later. Polling or just fetch on mount is safer for now.
    const interval = setInterval(fetchNotifications, 60000) // Poll every min
    return () => clearInterval(interval)
  }, [session])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-8">
      <div className="flex-1 flex items-center gap-4">
        {backHref && (
          <Button variant="ghost" size="icon" asChild>
            <Link href={backHref}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        )}
        <div className="hidden md:block">
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="w-64 pl-9 bg-muted/50"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs variant-default">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="font-semibold">Notificações</span>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs" onClick={markAsRead}>
                  Marcar como lidas
                </Button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhuma notificação recente.
              </div>
            ) : (
              notifications.map(notification => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 p-4 cursor-pointer">
                  <span className={`font-medium ${!notification.lido ? 'text-primary' : ''}`}>{notification.titulo}</span>
                  <span className="text-sm text-muted-foreground">
                    {notification.mensagem}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
