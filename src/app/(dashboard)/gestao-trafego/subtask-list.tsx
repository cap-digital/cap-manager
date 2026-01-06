'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2, Plus, Calendar, User, AlignLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Subtarefa } from '@/lib/supabase'

interface SubtaskListProps {
    tarefaId: number
    usuarios: { id: number; nome: string }[]
}

export function SubtaskList({ tarefaId, usuarios }: SubtaskListProps) {
    const [subtarefas, setSubtarefas] = useState<Subtarefa[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const [formData, setFormData] = useState({
        titulo: '',
        descricao: '',
        prioridade: 'media' as 'baixa' | 'media' | 'alta' | 'urgente',
        data_vencimento: '',
        responsavel_id: '',
    })

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

    const handleAdd = async () => {
        if (!formData.titulo.trim()) return

        setIsLoading(true)
        await fetch('/api/subtarefas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tarefa_id: tarefaId,
                titulo: formData.titulo,
                descricao: formData.descricao || null,
                prioridade: formData.prioridade,
                data_vencimento: formData.data_vencimento || null,
                responsavel_id: formData.responsavel_id ? parseInt(formData.responsavel_id) : null,
            }),
        })

        setFormData({
            titulo: '',
            descricao: '',
            prioridade: 'media',
            data_vencimento: '',
            responsavel_id: '',
        })
        setIsDialogOpen(false)
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

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'baixa': return 'bg-slate-500 hover:bg-slate-600'
            case 'media': return 'bg-blue-500 hover:bg-blue-600'
            case 'alta': return 'bg-orange-500 hover:bg-orange-600'
            case 'urgente': return 'bg-red-500 hover:bg-red-600'
            default: return 'bg-slate-500'
        }
    }

    const getResponsavelName = (id?: number | null) => {
        if (!id) return null
        return usuarios.find(u => u.id === id)?.nome
    }

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {subtarefas.map(sub => (
                    <div key={sub.id} className="flex flex-col gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors group">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
                                <Checkbox
                                    checked={sub.concluida}
                                    onCheckedChange={(checked) => handleToggle(sub.id, !!checked)}
                                    className="mt-1"
                                />
                                <div className="space-y-1 flex-1">
                                    <div className={cn("text-sm font-medium leading-none", sub.concluida && "line-through text-muted-foreground")}>
                                        {sub.titulo}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="secondary" className={cn("text-[10px] px-1.5 h-5 text-white border-0", getPriorityColor(sub.prioridade))}>
                                            {sub.prioridade}
                                        </Badge>

                                        {sub.data_vencimento && (
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                <Calendar className="h-3 w-3" />
                                                <span>{new Date(sub.data_vencimento).toLocaleDateString()}</span>
                                            </div>
                                        )}

                                        {sub.responsavel_id && (
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                <User className="h-3 w-3" />
                                                <span>{getResponsavelName(sub.responsavel_id)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive -mr-2 -mt-1"
                                onClick={() => handleDelete(sub.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        {sub.descricao && (
                            <div className="pl-6 text-xs text-muted-foreground bg-muted/30 p-2 rounded -mx-1">
                                <AlignLeft className="h-3 w-3 inline mr-1 opacity-70" />
                                {sub.descricao}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full dashed-border">
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Subtarefa
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova Subtarefa</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="titulo">Titulo</Label>
                            <Input
                                id="titulo"
                                value={formData.titulo}
                                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                placeholder="O que precisa ser feito?"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="descricao">Descricao (opcional)</Label>
                            <Textarea
                                id="descricao"
                                value={formData.descricao}
                                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                placeholder="Detalhes adicionais..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Prioridade</Label>
                                <Select
                                    value={formData.prioridade}
                                    onValueChange={(v: any) => setFormData({ ...formData, prioridade: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="baixa">Baixa</SelectItem>
                                        <SelectItem value="media">Media</SelectItem>
                                        <SelectItem value="alta">Alta</SelectItem>
                                        <SelectItem value="urgente">Urgente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Prazo</Label>
                                <Input
                                    type="date"
                                    value={formData.data_vencimento}
                                    onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Responsavel</Label>
                            <Select
                                value={formData.responsavel_id}
                                onValueChange={(v) => setFormData({ ...formData, responsavel_id: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {usuarios.map((u) => (
                                        <SelectItem key={u.id} value={u.id.toString()}>
                                            {u.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAdd} disabled={isLoading || !formData.titulo.trim()}>
                            Adicionar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
