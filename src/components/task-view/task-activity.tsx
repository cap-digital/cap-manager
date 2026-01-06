'use client'

import { useState, useEffect, useRef } from 'react'
import { Comentario } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskActivityProps {
    tarefaId: number
    usuarioLogadoId: number
    usuarios: { id: number; nome: string }[]
}

export function TaskActivity({ tarefaId, usuarioLogadoId, usuarios }: TaskActivityProps) {
    const [comentarios, setComentarios] = useState<Comentario[]>([])
    const [novoComentario, setNovoComentario] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Mention state
    const [showMentions, setShowMentions] = useState(false)
    const [mentionQuery, setMentionQuery] = useState('')
    const [cursorPosition, setCursorPosition] = useState(0)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

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

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value
        const selectionStart = e.target.selectionStart
        setNovoComentario(value)
        setCursorPosition(selectionStart)

        // Check for @
        const textBeforeCursor = value.slice(0, selectionStart)
        const lastAt = textBeforeCursor.lastIndexOf('@')

        if (lastAt !== -1) {
            const textAfterAt = textBeforeCursor.slice(lastAt + 1)
            // Show mention list if @ is at start or preceded by space, and no spaces in query yet
            if ((lastAt === 0 || textBeforeCursor[lastAt - 1] === ' ') && !textAfterAt.includes(' ')) {
                setShowMentions(true)
                setMentionQuery(textAfterAt)
                return
            }
        }
        setShowMentions(false)
    }

    const insertMention = (usuario: { id: number; nome: string }) => {
        const textBeforeCursor = novoComentario.slice(0, cursorPosition) // Text so far
        const lastAt = textBeforeCursor.lastIndexOf('@')
        const prefix = novoComentario.slice(0, lastAt)
        const suffix = novoComentario.slice(cursorPosition)

        const newValue = `${prefix}@${usuario.nome} ${suffix}`
        setNovoComentario(newValue)
        setShowMentions(false)

        // Return focus
        if (textareaRef.current) {
            textareaRef.current.focus()
        }
    }

    const filteredUsers = usuarios.filter(u =>
        u.nome.toLowerCase().includes(mentionQuery.toLowerCase())
    )

    const renderConteudo = (conteudo: string) => {
        // Simple regex to highlight @Nome
        // Note: This matches @Word. For perfect matching with user IDs, we'd need a structured format or more complex regex.
        // For now, highlighting any @Word is a good MVP.
        const parts = conteudo.split(/(@\w+)/g)
        return parts.map((part, i) => {
            if (part.startsWith('@')) {
                return (
                    <span key={i} className="text-blue-500 font-semibold bg-blue-500/10 rounded px-1">
                        {part}
                    </span>
                )
            }
            return part
        })
    }

    return (
        <div className="flex flex-col h-full bg-muted/10 border-l relative">
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
                                    {renderConteudo(comentario.conteudo)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Mention Suggestions Popover */}
            {showMentions && filteredUsers.length > 0 && (
                <div className="absolute bottom-[100px] left-4 z-50 w-64 bg-popover text-popover-foreground shadow-md rounded-md border p-1 animate-in fade-in slide-in-from-bottom-2">
                    <div className="text-xs text-muted-foreground px-2 py-1.5 font-medium border-b mb-1">
                        Mencionar...
                    </div>
                    <ScrollArea className="h-[200px]">
                        {filteredUsers.map(user => (
                            <button
                                key={user.id}
                                className="w-full flex items-center gap-2 p-2 hover:bg-accent hover:text-accent-foreground rounded-sm text-sm transition-colors text-left"
                                onClick={() => insertMention(user)}
                            >
                                <Avatar className="h-6 w-6">
                                    <AvatarFallback>{user.nome[0]}</AvatarFallback>
                                </Avatar>
                                <span>{user.nome}</span>
                            </button>
                        ))}
                    </ScrollArea>
                </div>
            )}

            <div className="p-4 border-t bg-background">
                <div className="flex gap-2">
                    <Textarea
                        ref={textareaRef}
                        placeholder="Escreva um comentário... (@ para mencionar)"
                        value={novoComentario}
                        onChange={handleTextChange}
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
