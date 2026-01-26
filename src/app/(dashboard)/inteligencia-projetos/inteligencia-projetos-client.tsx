'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
    Plus,
    MoreVertical,
    Pencil,
    Trash2,
    ExternalLink,
    Search,
    Loader2,
    LayoutGrid,
    List,
    Globe,
    Code2,
    User,
    CheckCircle2,
} from 'lucide-react'
import type { InteligenciaProjeto, Cliente, Usuario, TipoProjeto } from '@/lib/supabase'
import { BarChart3 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

interface InteligenciaProjetosClientProps {
    projetos: InteligenciaProjeto[]
    clientes: Cliente[]
    usuarios: Usuario[]
}

export function InteligenciaProjetosClient({
    projetos: initialProjetos,
    clientes,
    usuarios
}: InteligenciaProjetosClientProps) {
    const [projetos, setProjetos] = useState<InteligenciaProjeto[]>(initialProjetos)
    const [search, setSearch] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [editingProjeto, setEditingProjeto] = useState<InteligenciaProjeto | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    const [formData, setFormData] = useState({
        nome_projeto: '',
        tipo_projeto: 'lp' as TipoProjeto,
        data_criacao: new Date().toISOString().split('T')[0],
        link_lovable: '',
        link_vercel: '',
        link_render_railway: '',
        link_dominio: '',
        link_looker_studio: '',
        feito_por_id: '',
        revisado_por_id: '',
        cliente_id: '',
    })

    const router = useRouter()
    const { toast } = useToast()

    const filteredProjetos = projetos.filter(
        p =>
            p.nome_projeto.toLowerCase().includes(search.toLowerCase()) ||
            p.cliente?.nome.toLowerCase().includes(search.toLowerCase()) ||
            (p.feito_por?.nome && p.feito_por.nome.toLowerCase().includes(search.toLowerCase()))
    )

    const resetForm = () => {
        setFormData({
            nome_projeto: '',
            tipo_projeto: 'lp' as TipoProjeto,
            data_criacao: new Date().toISOString().split('T')[0],
            link_lovable: '',
            link_vercel: '',
            link_render_railway: '',
            link_dominio: '',
            link_looker_studio: '',
            feito_por_id: '',
            revisado_por_id: '',
            cliente_id: '',
        })
        setEditingProjeto(null)
    }

    const openEditDialog = (projeto: InteligenciaProjeto) => {
        setEditingProjeto(projeto)
        setFormData({
            nome_projeto: projeto.nome_projeto,
            tipo_projeto: (projeto.tipo_projeto || 'lp') as TipoProjeto,
            data_criacao: projeto.data_criacao || '',
            link_lovable: projeto.link_lovable || '',
            link_vercel: projeto.link_vercel || '',
            link_render_railway: projeto.link_render_railway || '',
            link_dominio: projeto.link_dominio || '',
            link_looker_studio: projeto.link_looker_studio || '',
            feito_por_id: projeto.feito_por_id?.toString() || '',
            revisado_por_id: projeto.revisado_por_id?.toString() || '',
            cliente_id: projeto.cliente_id?.toString() || '',
        })
        setIsOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const payload = {
            ...formData,
            cliente_id: formData.cliente_id ? parseInt(formData.cliente_id) : null,
            feito_por_id: formData.feito_por_id ? parseInt(formData.feito_por_id) : null,
            revisado_por_id: formData.revisado_por_id ? parseInt(formData.revisado_por_id) : null,
        }

        try {
            const url = editingProjeto
                ? `/api/inteligencia-projetos?id=${editingProjeto.id}`
                : '/api/inteligencia-projetos'

            const response = await fetch(url, {
                method: editingProjeto ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!response.ok) throw new Error('Erro ao salvar projeto')

            const data = await response.json()

            if (editingProjeto) {
                setProjetos(prev =>
                    prev.map(p => p.id === editingProjeto.id ? data : p)
                )
                toast({ title: 'Projeto atualizado com sucesso!' })
            } else {
                setProjetos(prev => [data, ...prev])
                toast({ title: 'Projeto criado com sucesso!' })
            }

            setIsOpen(false)
            resetForm()
        } catch (error) {
            console.error(error)
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Não foi possível salvar o projeto. Verifique se a tabela existe no banco de dados.',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este projeto?')) return

        try {
            const response = await fetch(`/api/inteligencia-projetos?id=${id}`, {
                method: 'DELETE',
            })

            if (!response.ok) throw new Error('Erro ao excluir projeto')

            setProjetos(prev => prev.filter(p => p.id !== id))
            toast({ title: 'Projeto excluído com sucesso!' })
        } catch (error) {
            console.error(error)
            toast({
                variant: 'destructive',
                title: 'Erro ao excluir',
                description: 'Ocorreu um erro ao excluir o projeto.',
            })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar projetos..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Dialog open={isOpen} onOpenChange={open => {
                    setIsOpen(open)
                    if (!open) resetForm()
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Projeto
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingProjeto ? 'Editar Projeto' : 'Novo Projeto'}
                                </DialogTitle>
                                <DialogDescription>
                                    Preencha os detalhes do projeto técnico.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nome_projeto">Nome do Projeto *</Label>
                                    <Input
                                        id="nome_projeto"
                                        placeholder="Ex: Landing Page Campanha X"
                                        value={formData.nome_projeto}
                                        onChange={e => setFormData(prev => ({ ...prev, nome_projeto: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tipo_projeto">Tipo de Projeto</Label>
                                    <Select
                                        value={formData.tipo_projeto}
                                        onValueChange={v => setFormData(prev => ({ ...prev, tipo_projeto: v as TipoProjeto }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="dashboard">Dashboard</SelectItem>
                                            <SelectItem value="lp">LP (Landing Page)</SelectItem>
                                            <SelectItem value="site">Site</SelectItem>
                                            <SelectItem value="saas">SaaS</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cliente_id">Cliente</Label>
                                    <Select
                                        value={formData.cliente_id}
                                        onValueChange={v => setFormData(prev => ({ ...prev, cliente_id: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o cliente" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clientes.map(c => (
                                                <SelectItem key={c.id} value={c.id.toString()}>{c.nome}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="data_criacao">Data de Criação</Label>
                                    <Input
                                        id="data_criacao"
                                        type="date"
                                        value={formData.data_criacao}
                                        onChange={e => setFormData(prev => ({ ...prev, data_criacao: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="feito_por_id">Feito por</Label>
                                    <Select
                                        value={formData.feito_por_id}
                                        onValueChange={v => setFormData(prev => ({ ...prev, feito_por_id: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o desenvolvedor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {usuarios.map(u => (
                                                <SelectItem key={u.id} value={u.id.toString()}>{u.nome}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="revisado_por_id">Revisado por</Label>
                                    <Select
                                        value={formData.revisado_por_id}
                                        onValueChange={v => setFormData(prev => ({ ...prev, revisado_por_id: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o revisor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {usuarios.map(u => (
                                                <SelectItem key={u.id} value={u.id.toString()}>{u.nome}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2 md:col-span-2 border-t pt-4 mt-2">
                                    <Label className="text-primary font-bold">Links do Projeto</Label>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="link_lovable">Link do Lovable</Label>
                                    <Input
                                        id="link_lovable"
                                        placeholder="https://lovable.dev/..."
                                        value={formData.link_lovable}
                                        onChange={e => setFormData(prev => ({ ...prev, link_lovable: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="link_vercel">Link do Vercel</Label>
                                    <Input
                                        id="link_vercel"
                                        placeholder="https://project.vercel.app"
                                        value={formData.link_vercel}
                                        onChange={e => setFormData(prev => ({ ...prev, link_vercel: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="link_render_railway">Link do Render/Railway</Label>
                                    <Input
                                        id="link_render_railway"
                                        placeholder="https://render.com/..."
                                        value={formData.link_render_railway}
                                        onChange={e => setFormData(prev => ({ ...prev, link_render_railway: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="link_dominio">Link do Domínio</Label>
                                    <Input
                                        id="link_dominio"
                                        placeholder="https://www.cliente.com.br"
                                        value={formData.link_dominio}
                                        onChange={e => setFormData(prev => ({ ...prev, link_dominio: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="link_looker_studio">Link Looker Studio</Label>
                                    <Input
                                        id="link_looker_studio"
                                        placeholder="https://lookerstudio.google.com/..."
                                        value={formData.link_looker_studio}
                                        onChange={e => setFormData(prev => ({ ...prev, link_looker_studio: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    {editingProjeto ? 'Salvar Alterações' : 'Criar Projeto'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex justify-end p-1">
                <div className="flex items-center space-x-2 border rounded-md p-1">
                    <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="h-8 px-2"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="h-8 px-2"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {filteredProjetos.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProjetos.map(projeto => (
                            <Card key={projeto.id} className="group overflow-hidden">
                                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <Code2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg line-clamp-1">{projeto.nome_projeto}</CardTitle>
                                            <CardDescription>{projeto.cliente?.nome || 'Sem cliente'}</CardDescription>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditDialog(projeto)}>
                                                <Pencil className="h-4 w-4 mr-2" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(projeto.id)} className="text-destructive">
                                                <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        {projeto.tipo_projeto && (
                                            <div className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded flex items-center gap-1 font-medium">
                                                {projeto.tipo_projeto === 'dashboard' && 'Dashboard'}
                                                {projeto.tipo_projeto === 'lp' && 'LP'}
                                                {projeto.tipo_projeto === 'site' && 'Site'}
                                                {projeto.tipo_projeto === 'saas' && 'SaaS'}
                                            </div>
                                        )}
                                        {projeto.data_criacao && (
                                            <div className="px-2 py-1 bg-muted rounded flex items-center gap-1">
                                                Criado: {formatDate(projeto.data_criacao)}
                                            </div>
                                        )}
                                        {projeto.feito_por && (
                                            <div className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded flex items-center gap-1">
                                                By: {projeto.feito_por.nome}
                                            </div>
                                        )}
                                        {projeto.revisado_por && (
                                            <div className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded flex items-center gap-1">
                                                Checked: {projeto.revisado_por.nome}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        {projeto.link_lovable && (
                                            <a href={projeto.link_lovable} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                                                <ExternalLink className="h-3 w-3" /> Lovable
                                            </a>
                                        )}
                                        {projeto.link_vercel && (
                                            <a href={projeto.link_vercel} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                                                <ExternalLink className="h-3 w-3" /> Vercel
                                            </a>
                                        )}
                                        {projeto.link_render_railway && (
                                            <a href={projeto.link_render_railway} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                                                <ExternalLink className="h-3 w-3" /> Render
                                            </a>
                                        )}
                                        {projeto.link_dominio && (
                                            <a href={projeto.link_dominio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline font-bold">
                                                <Globe className="h-3 w-3" /> Domínio
                                            </a>
                                        )}
                                        {projeto.link_looker_studio && (
                                            <a href={projeto.link_looker_studio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-orange-600 hover:underline font-medium">
                                                <BarChart3 className="h-3 w-3" /> Looker Studio
                                            </a>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Projeto</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Criação</TableHead>
                                    <TableHead>Feito por</TableHead>
                                    <TableHead>Revisado</TableHead>
                                    <TableHead className="text-right">Links</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProjetos.map(projeto => (
                                    <TableRow key={projeto.id}>
                                        <TableCell className="font-medium">{projeto.nome_projeto}</TableCell>
                                        <TableCell>
                                            {projeto.tipo_projeto && (
                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded text-xs font-medium">
                                                    {projeto.tipo_projeto === 'dashboard' && 'Dashboard'}
                                                    {projeto.tipo_projeto === 'lp' && 'LP'}
                                                    {projeto.tipo_projeto === 'site' && 'Site'}
                                                    {projeto.tipo_projeto === 'saas' && 'SaaS'}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>{projeto.cliente?.nome || '-'}</TableCell>
                                        <TableCell>{projeto.data_criacao ? formatDate(projeto.data_criacao) : '-'}</TableCell>
                                        <TableCell>{projeto.feito_por?.nome || '-'}</TableCell>
                                        <TableCell>{projeto.revisado_por?.nome || '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {projeto.link_lovable && <a href={projeto.link_lovable} target="_blank" rel="noopener noreferrer" title="Lovable"><Code2 className="h-4 w-4" /></a>}
                                                {projeto.link_vercel && <a href={projeto.link_vercel} target="_blank" rel="noopener noreferrer" title="Vercel"><ExternalLink className="h-4 w-4" /></a>}
                                                {projeto.link_dominio && <a href={projeto.link_dominio} target="_blank" rel="noopener noreferrer" title="Domínio"><Globe className="h-4 w-4" /></a>}
                                                {projeto.link_looker_studio && <a href={projeto.link_looker_studio} target="_blank" rel="noopener noreferrer" title="Looker Studio"><BarChart3 className="h-4 w-4 text-orange-600" /></a>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditDialog(projeto)}>
                                                        <Pencil className="h-4 w-4 mr-2" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(projeto.id)} className="text-destructive">
                                                        <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )
            ) : (
                <Card className="p-12">
                    <div className="text-center">
                        <Code2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
                        <h3 className="mt-4 text-lg font-semibold">Nenhum projeto de inteligência encontrado</h3>
                        <p className="text-muted-foreground mt-2">
                            {search ? 'Tente buscar com outros termos' : 'Comece registrando seu primeiro projeto técnico'}
                        </p>
                        {!search && (
                            <Button className="mt-4" onClick={() => setIsOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Registrar Projeto
                            </Button>
                        )}
                    </div>
                </Card>
            )}
        </div>
    )
}
