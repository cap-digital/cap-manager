'use client'

import { useState, useEffect } from 'react'
import { CardKanban, Comentario } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskActivityProps {
    tarefaId: number
    usuarioLogadoId: number
}

export function TaskActivity({ tarefaId, usuarioLogadoId }: TaskActivityProps) {
    const [comentarios, setComentarios] = useState<Comentario[]>([])
    const [novoComentario, setNovoComentario] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const fetchComentarios = async () => {
        const res = await fetch(`/api/comentarios?tarefa_id=${tarefaId}`)
        if (res.ok) {
            const data = await res.json()
            setComentarios(data)
        }
    }

    useEffect(() => {
        fetchComentarios()
    }, [tarefaId])

    const handleEnviar = async () => {
        if (!novoComentario.trim()) return

        setIsLoading(true)
        await fetch('/api/comentarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tarefa_id: tarefaId,
                usuario_id: usuarioLogadoId,
                conteudo: novoComentario,
            }),
        })
        setNovoComentario('')
        await fetchComentarios()
        setIsLoading(false)
    }

    return (
        <div className="flex flex-col h-full bg-muted/10 border-l">
            <div className="p-4 border-b bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/20">
                <h3 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Atividade
                </h3>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                    {comentarios.length === 0 && (
                        <div className="text-center text-muted-foreground text-sm py-8">
                            Nenhum comentário ainda.
                        </div>
                    )}
                    {comentarios.map((comentario) => (
                        <div key={comentario.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                    {comentario.usuario?.nome?.[0] || '?'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{comentario.usuario?.nome}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(comentario.created_at).toLocaleString('pt-BR', {
                                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                <div className="text-sm bg-muted/50 p-2 rounded-md whitespace-pre-wrap">
                                    {comentario.conteudo}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="p-4 border-t bg-background">
                <div className="flex gap-2">
                    <Textarea
                        placeholder="Escreva um comentário..."
                        value={novoComentario}
                        onChange={(e) => setNovoComentario(e.target.value)}
                        className="min-h-[80px] resize-none"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleEnviar()
                            }
                        }}
                    />
                    <Button
                        size="icon"
                        onClick={handleEnviar}
                        disabled={isLoading || !novoComentario.trim()}
                        className="h-[80px]"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
