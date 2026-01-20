'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from '@/components/ui/sheet'
import {
    Inbox,
    Bell,
    Check,
    CheckCheck,
    AlertCircle,
    MessageSquare,
    Calendar,
    DollarSign,
    LayoutGrid,
    Filter
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Alerta, TipoAlerta } from '@/lib/supabase'

interface NotificationInboxProps {
    userId: number
}

const tipoIcons: Record<TipoAlerta, React.ReactNode> = {
    tarefa: <LayoutGrid className="h-4 w-4" />,
    campanha: <Bell className="h-4 w-4" />,
    cobranca: <DollarSign className="h-4 w-4" />,
    sistema: <AlertCircle className="h-4 w-4" />,
}

const tipoColors: Record<TipoAlerta, string> = {
    tarefa: 'bg-blue-100 text-blue-700',
    campanha: 'bg-purple-100 text-purple-700',
    cobranca: 'bg-green-100 text-green-700',
    sistema: 'bg-orange-100 text-orange-700',
}

const tipoLabels: Record<TipoAlerta, string> = {
    tarefa: 'Tarefa',
    campanha: 'Campanha',
    cobranca: 'Cobrança',
    sistema: 'Sistema',
}

export function NotificationInbox({ userId }: NotificationInboxProps) {
    const [notifications, setNotifications] = useState<Alerta[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)
    const [filter, setFilter] = useState<'all' | 'unread'>('all')
    const [isOpen, setIsOpen] = useState(false)

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/alertas?limit=100')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
                setUnreadCount(data.filter((n: Alerta) => !n.lido).length)
            }
        } catch (error) {
            console.error('Erro ao buscar notificações:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
        // Polling a cada 30 segundos
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [userId])

    const markAsRead = async (alertaId: number) => {
        // Atualização otimista
        setNotifications(prev => prev.map(n =>
            n.id === alertaId ? { ...n, lido: true } : n
        ))
        setUnreadCount(prev => Math.max(0, prev - 1))

        await fetch(`/api/alertas?id=${alertaId}`, { method: 'PATCH' })
    }

    const markAllAsRead = async () => {
        // Atualização otimista
        setNotifications(prev => prev.map(n => ({ ...n, lido: true })))
        setUnreadCount(0)

        await fetch('/api/alertas?mark_all=true', { method: 'PATCH' })
    }

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.lido)
        : notifications

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Inbox className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] p-0">
                <SheetHeader className="p-4 border-b space-y-3">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2">
                            <Inbox className="h-5 w-5" />
                            Caixa de Entrada
                        </SheetTitle>
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                                <CheckCheck className="h-4 w-4 mr-1" />
                                Marcar todas como lidas
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={filter === 'all' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilter('all')}
                        >
                            Todas ({notifications.length})
                        </Button>
                        <Button
                            variant={filter === 'unread' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilter('unread')}
                        >
                            Não lidas ({unreadCount})
                        </Button>
                    </div>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-140px)]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                            <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">
                                {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                                        !notification.lido && "bg-primary/5"
                                    )}
                                    onClick={() => !notification.lido && markAsRead(notification.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "p-2 rounded-full shrink-0",
                                            tipoColors[notification.tipo]
                                        )}>
                                            {tipoIcons[notification.tipo]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={cn(
                                                    "font-medium text-sm truncate",
                                                    !notification.lido && "text-primary"
                                                )}>
                                                    {notification.titulo}
                                                </span>
                                                {!notification.lido && (
                                                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {notification.mensagem}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    {tipoLabels[notification.tipo]}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(notification.created_at), {
                                                        addSuffix: true,
                                                        locale: ptBR
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        {!notification.lido && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 shrink-0"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    markAsRead(notification.id)
                                                }}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}
