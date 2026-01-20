'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
    DialogDescription
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, maskCurrency, parseCurrency } from '@/lib/utils'
import { Plus, Pencil, Trash2, Calendar, FileText, Search, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import type { Contrato, Cliente } from '@/lib/supabase'

interface ContratosClientProps {
    initialContratos: Contrato[]
    clientes: Pick<Cliente, 'id' | 'nome'>[]
}

export function ContratosClient({ initialContratos, clientes }: ContratosClientProps) {
    const [contratos, setContratos] = useState<Contrato[]>(initialContratos)
    const [search, setSearch] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [editingContrato, setEditingContrato] = useState<Contrato | null>(null)

    const { toast } = useToast()
    const router = useRouter()

    const [formData, setFormData] = useState({
        cliente_id: '',
        recorrente: false,
        data_inicio: '',
        data_fim: '',
        valor: '',
        observacao: ''
    })

    const resetForm = () => {
        setFormData({
            cliente_id: '',
            recorrente: false,
            data_inicio: '',
            data_fim: '',
            valor: '',
            observacao: ''
        })
        setEditingContrato(null)
    }

    const openEditDialog = (contrato: Contrato) => {
        setEditingContrato(contrato)
        setFormData({
            cliente_id: contrato.cliente_id.toString(),
            recorrente: contrato.recorrente,
            data_inicio: contrato.data_inicio,
            data_fim: contrato.data_fim || '',
            valor: maskCurrency(contrato.valor.toFixed(2)),
            observacao: contrato.observacao || ''
        })
        setIsOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const payload = {
                cliente_id: parseInt(formData.cliente_id),
                recorrente: formData.recorrente,
                data_inicio: formData.data_inicio,
                data_fim: formData.data_fim || null,
                valor: parseCurrency(formData.valor),
                observacao: formData.observacao
            }

            const url = editingContrato
                ? `/api/contratos?id=${editingContrato.id}`
                : '/api/contratos'

            const method = editingContrato ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) throw new Error('Falha ao salvar contrato')

            const savedContrato = await res.json()

            if (editingContrato) {
                setContratos(prev => prev.map(c => c.id === savedContrato.id ? savedContrato : c))
                toast({ title: 'Contrato atualizado com sucesso!' })
            } else {
                setContratos(prev => [savedContrato, ...prev])
                toast({ title: 'Contrato criado com sucesso!' })
            }

            setIsOpen(false)
            resetForm()
            router.refresh()
        } catch (error) {
            console.error(error)
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Ocorreu um erro ao salvar o contrato.'
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este contrato?')) return

        try {
            const res = await fetch(`/api/contratos?id=${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Falha ao excluir')

            setContratos(prev => prev.filter(c => c.id !== id))
            toast({ title: 'Contrato excluído' })
            router.refresh()
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Erro ao excluir contrato.'
            })
        }
    }

    const filteredContratos = contratos.filter(c =>
        c.cliente?.nome?.toLowerCase().includes(search.toLowerCase()) ||
        c.observacao?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar contratos..."
                        className="pl-8"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <Dialog open={isOpen} onOpenChange={open => {
                    setIsOpen(open)
                    if (!open) resetForm()
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Contrato
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>{editingContrato ? 'Editar Contrato' : 'Novo Contrato'}</DialogTitle>
                                <DialogDescription>
                                    Preencha as informações do contrato abaixo.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <Label>Cliente *</Label>
                                    <Select
                                        value={formData.cliente_id}
                                        onValueChange={v => setFormData(p => ({ ...p, cliente_id: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um cliente" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clientes.map(cliente => (
                                                <SelectItem key={cliente.id} value={cliente.id.toString()}>
                                                    {cliente.nome}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="recorrente"
                                        checked={formData.recorrente}
                                        onCheckedChange={(c: boolean) => setFormData(p => ({ ...p, recorrente: c }))}
                                    />
                                    <Label htmlFor="recorrente">Contrato Recorrente</Label>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Data Início *</Label>
                                        <Input
                                            type="date"
                                            value={formData.data_inicio}
                                            onChange={e => setFormData(p => ({ ...p, data_inicio: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Data Fim</Label>
                                        <Input
                                            type="date"
                                            value={formData.data_fim}
                                            onChange={e => setFormData(p => ({ ...p, data_fim: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Valor do Contrato (R$) *</Label>
                                    <Input
                                        value={formData.valor}
                                        onChange={e => {
                                            const v = e.target.value.replace(/\D/g, '')
                                            setFormData(p => ({ ...p, valor: maskCurrency(v) }))
                                        }}
                                        placeholder="R$ 0,00"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Observação</Label>
                                    <Input
                                        value={formData.observacao}
                                        onChange={e => setFormData(p => ({ ...p, observacao: e.target.value }))}
                                        placeholder="Detalhes adicionais..."
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={isLoading || !formData.cliente_id || !formData.data_inicio || !formData.valor}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingContrato ? 'Salvar' : 'Criar'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Vigência</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredContratos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    Nenhum contrato encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredContratos.map(contrato => (
                                <TableRow key={contrato.id}>
                                    <TableCell className="font-medium">{contrato.cliente?.nome}</TableCell>
                                    <TableCell>
                                        {contrato.recorrente ? (
                                            <Badge variant="secondary">Recorrente</Badge>
                                        ) : (
                                            <Badge variant="outline">Pontual</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(contrato.data_inicio), 'dd/MM/yyyy')}
                                            {contrato.data_fim && ` - ${format(new Date(contrato.data_fim), 'dd/MM/yyyy')}`}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(contrato.valor)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={contrato.ativo ? 'default' : 'secondary'} className={contrato.ativo ? 'bg-green-600 hover:bg-green-700' : ''}>
                                            {contrato.ativo ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(contrato)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(contrato.id)} className="text-destructive hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
