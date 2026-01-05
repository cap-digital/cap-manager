'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SubtaskList({ tarefaId }: { tarefaId: number }) {
    const [subtarefas, setSubtarefas] = useState<any[]>([])
    const [newSubtarefa, setNewSubtarefa] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const fetchSubtarefas = async () => {
        const res = await fetch(`/api/subtarefas?tarefa_id=${tarefaId}`)
        if (res.ok) {
            const data = await res.json()
            setSubtarefas(data)
        }
    }

    useEffect(() => {
        fetchSubtarefas()
    }, [tarefaId])

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newSubtarefa.trim()) return

        setIsLoading(true)
        await fetch('/api/subtarefas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tarefa_id: tarefaId, titulo: newSubtarefa }),
        })
        setNewSubtarefa('')
        await fetchSubtarefas()
        setIsLoading(false)
    }

    const handleToggle = async (id: number, concluida: boolean) => {
        // Optimistic update
        setSubtarefas(subtarefas.map(s => s.id === id ? { ...s, concluida } : s))

        await fetch(`/api/subtarefas?id=${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ concluida }),
        })
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Excluir subtarefa?')) return

        setSubtarefas(subtarefas.filter(s => s.id !== id))
        await fetch(`/api/subtarefas?id=${id}`, { method: 'DELETE' })
    }

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                {subtarefas.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between group p-2 hover:bg-muted/50 rounded-md transition-colors">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={sub.concluida}
                                onCheckedChange={(checked) => handleToggle(sub.id, !!checked)}
                            />
                            <span className={cn("text-sm", sub.concluida && "line-through text-muted-foreground")}>
                                {sub.titulo}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                            onClick={() => handleDelete(sub.id)}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                ))}
            </div>

            <form onSubmit={handleAdd} className="flex gap-2">
                <Input
                    placeholder="Adicionar subtarefa..."
                    value={newSubtarefa}
                    onChange={e => setNewSubtarefa(e.target.value)}
                    className="h-8 text-sm"
                />
                <Button type="submit" size="sm" disabled={isLoading || !newSubtarefa.trim()}>
                    <Plus className="h-4 w-4" />
                </Button>
            </form>
        </div>
    )
}
