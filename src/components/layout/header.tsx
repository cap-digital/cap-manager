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
import { NotificationInbox } from './notification-inbox'

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

    // Poll every min
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [session])

  // @ts-ignore
  const userId = session?.user?.id

  return (
    <header className="px-4 lg:px-8 pt-6 pb-4">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Title area */}
        <div className="flex items-start gap-3 min-w-0">
          {backHref && (
            <Button
              variant="outline"
              size="icon"
              className="mt-0.5 h-9 w-9 shrink-0 rounded-xl border-border/50 shadow-sm"
              asChild
            >
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Search */}
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              className="w-56 pl-9 h-9 rounded-xl bg-muted/40 border-border/50 text-sm focus-visible:bg-background"
            />
          </div>

          {/* Inbox / Caixa de Entrada */}
          {userId && <NotificationInbox userId={Number(userId)} />}

          {/* Quick Notifications Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl">
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs variant-default">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-xl">
              <div className="flex items-center justify-between px-4 py-2.5 border-b">
                <span className="font-semibold text-sm">Notificações Recentes</span>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAsRead}>
                    Marcar como lidas
                  </Button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Nenhuma notificação recente.
                </div>
              ) : (
                notifications.slice(0, 5).map(notification => (
                  <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 p-4 cursor-pointer">
                    <span className={`font-medium ${!notification.lido ? 'text-primary' : ''}`}>{notification.titulo}</span>
                    <span className="text-sm text-muted-foreground line-clamp-2">
                      {notification.mensagem}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
              {notifications.length > 5 && (
                <div className="p-2 text-center border-t">
                  <span className="text-xs text-muted-foreground">
                    Clique na caixa de entrada para ver todas
                  </span>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
