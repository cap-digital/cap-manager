'use client'

import { CardKanban, Projeto } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
    Calendar, Folder, User, CheckCircle2,
    MoreHorizontal, X, MessageSquare, Clock, Tag, ChevronRight, Edit
} from 'lucide-react'
import { TaskActivity } from './task-activity'
import { SubtaskList } from '@/app/(dashboard)/gestao-trafego/subtask-list'
import { cn } from '@/lib/utils'

interface TaskDetailsLayoutProps {
    card: CardKanban
    projeto?: { id: number; nome: string; tipo_cobranca: string }
    traderNome?: string
    usuarios: { id: number; nome: string }[]
    usuarioLogadoId: number
    onClose: () => void
    onEdit: () => void
}

export function TaskDetailsLayout({
    card,
    projeto,
    traderNome,
    usuarios,
    usuarioLogadoId,
    onClose,
    onEdit
}: TaskDetailsLayoutProps) {

    const prioridadeColors: Record<string, string> = {
        baixa: 'bg-slate-500 hover:bg-slate-600',
        media: 'bg-blue-500 hover:bg-blue-600',
        alta: 'bg-orange-500 hover:bg-orange-600',
        urgente: 'bg-red-500 hover:bg-red-600',
    }

    return (
        <div className="flex flex-col md:flex-row h-[85vh] w-full max-w-[1200px] bg-background rounded-lg overflow-hidden border">
            {/* Left Column - Task Details */}
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                {/* Header */}
                <div className="p-6 pb-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 uppercase tracking-wider font-semibold border px-2 py-0.5 rounded">
                                {card.area.replace('_', ' ')}
                            </span>
                            <ChevronRight className="h-3 w-3" />
                            <span>#{card.id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={onEdit}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                            </Button>
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold mb-4 leading-tight">{card.titulo}</h1>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
                        <div className="space-y-1">
                            <span className="text-muted-foreground text-xs font-medium uppercase">Status</span>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="rounded-sm px-2 py-1 font-medium capitalize">
                                    {card.status.replace(/_/g, ' ')}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-muted-foreground text-xs font-medium uppercase">Responsável</span>
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className={!traderNome ? 'text-muted-foreground' : ''}>
                                    {traderNome || 'Vazio'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-muted-foreground text-xs font-medium uppercase">Prioridade</span>
                            <div>
                                <Badge className={cn("text-white border-0 capitalize", prioridadeColors[card.prioridade])}>
                                    {card.prioridade}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-muted-foreground text-xs font-medium uppercase">Prazo</span>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className={!card.data_vencimento ? 'text-muted-foreground' : ''}>
                                    {card.data_vencimento
                                        ? new Date(card.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')
                                        : 'Vazio'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 space-y-8 pb-10">
                    {/* Description */}
                    <div className="space-y-3 group">
                        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-wide">
                            <div className="h-px bg-border flex-1" />
                            Descrição
                            <div className="h-px bg-border flex-1" />
                        </h3>
                        <div className={cn(
                            "min-h-[80px] text-sm whitespace-pre-wrap rounded-md p-3 transition-colors",
                            card.descricao ? "" : "text-muted-foreground italic bg-muted/20"
                        )}>
                            {card.descricao || "Adicionar descrição..."}
                        </div>
                    </div>

                    {/* Custom Fields (Project/Client) */}
                    {(projeto || card.cliente_id) && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-wide">
                                <div className="h-px bg-border flex-1" />
                                Relacionamentos
                                <div className="h-px bg-border flex-1" />
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                {projeto && (
                                    <div className="bg-muted/20 p-3 rounded-md flex items-center gap-3">
                                        <Folder className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium uppercase">Projeto</p>
                                            <p className="text-sm font-medium">{projeto.nome}</p>
                                        </div>
                                    </div>
                                )}
                                {card.cliente_id && (
                                    <div className="bg-muted/20 p-3 rounded-md flex items-center gap-3">
                                        <User className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium uppercase">Cliente</p>
                                            <p className="text-sm font-medium">#{card.cliente_id}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Subtasks */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-wide w-full">
                                <div className="h-px bg-border flex-1" />
                                Subtarefas
                                <div className="h-px bg-border flex-1" />
                            </h3>
                        </div>
                        <SubtaskList tarefaId={card.id} usuarios={usuarios} />
                    </div>
                </div>
            </div>

            {/* Right Column - Activity */}
            <div className="w-full md:w-[400px] flex-shrink-0 border-l bg-muted/5">
                <TaskActivity tarefaId={card.id} usuarioLogadoId={usuarioLogadoId} />
            </div>
        </div>
    )
}
