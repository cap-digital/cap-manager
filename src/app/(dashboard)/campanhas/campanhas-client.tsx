'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Megaphone,
  User,
  Target,
  Calendar,
  DollarSign,
  Search,
  Loader2,
  Copy,
  Link2,
} from 'lucide-react'
import type { Campanha, CampanhaStatus, CampanhaObjetivo } from '@/types'
import { formatCurrency, formatDate, generateNomenclatura } from '@/lib/utils'

interface CampanhasClientProps {
  campanhas: (Campanha & {
    cliente: { id: string; nome: string } | null
    trader: { id: string; nome: string } | null
  })[]
  clientes: { id: string; nome: string }[]
  traders: { id: string; nome: string }[]
}

const statusOptions: { value: CampanhaStatus; label: string; color: string }[] = [
  { value: 'rascunho', label: 'Rascunho', color: 'secondary' },
  { value: 'ativa', label: 'Ativa', color: 'success' },
  { value: 'pausada', label: 'Pausada', color: 'warning' },
  { value: 'finalizada', label: 'Finalizada', color: 'default' },
  { value: 'cancelada', label: 'Cancelada', color: 'destructive' },
]

const objetivoOptions: { value: CampanhaObjetivo; label: string }[] = [
  { value: 'awareness', label: 'Awareness' },
  { value: 'consideracao', label: 'Consideração' },
  { value: 'conversao', label: 'Conversão' },
  { value: 'leads', label: 'Leads' },
  { value: 'vendas', label: 'Vendas' },
  { value: 'trafego', label: 'Tráfego' },
  { value: 'engajamento', label: 'Engajamento' },
]

export function CampanhasClient({
  campanhas: initialCampanhas,
  clientes,
  traders,
}: CampanhasClientProps) {
  const [campanhas, setCampanhas] = useState(initialCampanhas)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isOpen, setIsOpen] = useState(false)
  const [editingCampanha, setEditingCampanha] = useState<Campanha | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    cliente_id: '',
    nome: '',
    pi: '',
    porcentagem_plataforma: 0,
    porcentagem_agencia: 0,
    trader_id: '',
    objetivo: 'conversao' as CampanhaObjetivo,
    status: 'rascunho' as CampanhaStatus,
    id_campanha_plataforma: '',
    data_inicio: '',
    data_fim: '',
    orcamento: '',
  })
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const filteredCampanhas = campanhas.filter(campanha => {
    const matchesSearch =
      campanha.nome.toLowerCase().includes(search.toLowerCase()) ||
      campanha.cliente?.nome.toLowerCase().includes(search.toLowerCase()) ||
      campanha.id_campanha_plataforma.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || campanha.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const resetForm = () => {
    setFormData({
      cliente_id: '',
      nome: '',
      pi: '',
      porcentagem_plataforma: 0,
      porcentagem_agencia: 0,
      trader_id: '',
      objetivo: 'conversao',
      status: 'rascunho',
      id_campanha_plataforma: '',
      data_inicio: '',
      data_fim: '',
      orcamento: '',
    })
    setEditingCampanha(null)
  }

  const openEditDialog = (campanha: Campanha) => {
    setEditingCampanha(campanha)
    setFormData({
      cliente_id: campanha.cliente_id,
      nome: campanha.nome,
      pi: campanha.pi || '',
      porcentagem_plataforma: campanha.porcentagem_plataforma,
      porcentagem_agencia: campanha.porcentagem_agencia,
      trader_id: campanha.trader_id || '',
      objetivo: campanha.objetivo,
      status: campanha.status,
      id_campanha_plataforma: campanha.id_campanha_plataforma,
      data_inicio: campanha.data_inicio || '',
      data_fim: campanha.data_fim || '',
      orcamento: campanha.orcamento?.toString() || '',
    })
    setIsOpen(true)
  }

  const generateNomenclaturaForCampanha = () => {
    const cliente = clientes.find(c => c.id === formData.cliente_id)
    if (!cliente) return

    const nomenclatura = generateNomenclatura({
      plataforma: 'META', // Pode ser customizado
      tipo: 'CAMP',
      objetivo: formData.objetivo.toUpperCase(),
      segmentacao: cliente.nome.slice(0, 10),
      formato: 'FEED',
    })

    setFormData(prev => ({ ...prev, nome: nomenclatura }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const payload = {
      cliente_id: formData.cliente_id,
      nome: formData.nome,
      pi: formData.pi || null,
      porcentagem_plataforma: formData.porcentagem_plataforma,
      porcentagem_agencia: formData.porcentagem_agencia,
      trader_id: formData.trader_id || null,
      objetivo: formData.objetivo,
      status: formData.status,
      id_campanha_plataforma: formData.id_campanha_plataforma,
      data_inicio: formData.data_inicio || null,
      data_fim: formData.data_fim || null,
      orcamento: formData.orcamento ? parseFloat(formData.orcamento) : null,
      nomenclatura_padrao: formData.nome,
    }

    try {
      if (editingCampanha) {
        const { data, error } = await supabase
          .from('cap_manager_campanhas')
          .update(payload)
          .eq('id', editingCampanha.id)
          .select('*, cliente:cap_manager_clientes(id, nome), trader:cap_manager_usuarios(id, nome)')
          .single()

        if (error) throw error

        setCampanhas(prev =>
          prev.map(c => (c.id === editingCampanha.id ? data : c))
        )
        toast({ title: 'Campanha atualizada com sucesso!' })
      } else {
        const { data, error } = await supabase
          .from('cap_manager_campanhas')
          .insert(payload)
          .select('*, cliente:cap_manager_clientes(id, nome), trader:cap_manager_usuarios(id, nome)')
          .single()

        if (error) throw error

        setCampanhas(prev => [data, ...prev])
        toast({ title: 'Campanha criada com sucesso!' })
      }

      setIsOpen(false)
      resetForm()
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro'
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta campanha?')) return

    try {
      const { error } = await supabase.from('cap_manager_campanhas').delete().eq('id', id)

      if (error) throw error

      setCampanhas(prev => prev.filter(c => c.id !== id))
      toast({ title: 'Campanha excluída com sucesso!' })
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro'
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: errorMessage,
      })
    }
  }

  const copyNomenclatura = (nome: string) => {
    navigator.clipboard.writeText(nome)
    toast({ title: 'Nomenclatura copiada!' })
  }

  const getStatusBadge = (status: CampanhaStatus) => {
    const statusConfig = statusOptions.find(s => s.value === status)
    return (
      <Badge variant={statusConfig?.color as 'default' | 'secondary' | 'destructive'}>
        {statusConfig?.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar campanhas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {statusOptions.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog
          open={isOpen}
          onOpenChange={open => {
            setIsOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingCampanha ? 'Editar Campanha' : 'Nova Campanha'}
                </DialogTitle>
                <DialogDescription>
                  {editingCampanha
                    ? 'Atualize os dados da campanha'
                    : 'Preencha os dados para criar uma nova campanha'}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente_id">Cliente *</Label>
                  <Select
                    value={formData.cliente_id}
                    onValueChange={value =>
                      setFormData(prev => ({ ...prev, cliente_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map(cliente => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_campanha_plataforma">
                    ID da Campanha (Plataforma) *
                  </Label>
                  <Input
                    id="id_campanha_plataforma"
                    placeholder="Ex: 123456789"
                    value={formData.id_campanha_plataforma}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        id_campanha_plataforma: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="nome">Nome da Campanha *</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={generateNomenclaturaForCampanha}
                      disabled={!formData.cliente_id}
                    >
                      <Link2 className="h-3 w-3 mr-1" />
                      Gerar Nomenclatura
                    </Button>
                  </div>
                  <Input
                    id="nome"
                    placeholder="Nome padronizado da campanha"
                    value={formData.nome}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, nome: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pi">PI (Pedido de Inserção)</Label>
                  <Input
                    id="pi"
                    placeholder="Número do PI"
                    value={formData.pi}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, pi: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trader_id">Trader Responsável</Label>
                  <Select
                    value={formData.trader_id}
                    onValueChange={value =>
                      setFormData(prev => ({ ...prev, trader_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um trader" />
                    </SelectTrigger>
                    <SelectContent>
                      {traders.map(trader => (
                        <SelectItem key={trader.id} value={trader.id}>
                          {trader.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="porcentagem_plataforma">% Plataforma</Label>
                  <Input
                    id="porcentagem_plataforma"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="Ex: 30"
                    value={formData.porcentagem_plataforma}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        porcentagem_plataforma: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="porcentagem_agencia">% Agência</Label>
                  <Input
                    id="porcentagem_agencia"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="Ex: 15"
                    value={formData.porcentagem_agencia}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        porcentagem_agencia: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objetivo">Objetivo *</Label>
                  <Select
                    value={formData.objetivo}
                    onValueChange={value =>
                      setFormData(prev => ({
                        ...prev,
                        objetivo: value as CampanhaObjetivo,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o objetivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {objetivoOptions.map(obj => (
                        <SelectItem key={obj.value} value={obj.value}>
                          {obj.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={value =>
                      setFormData(prev => ({
                        ...prev,
                        status: value as CampanhaStatus,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_inicio">Data de Início</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={formData.data_inicio}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, data_inicio: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_fim">Data de Fim</Label>
                  <Input
                    id="data_fim"
                    type="date"
                    value={formData.data_fim}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, data_fim: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="orcamento">Orçamento (R$)</Label>
                  <Input
                    id="orcamento"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex: 5000.00"
                    value={formData.orcamento}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, orcamento: e.target.value }))
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingCampanha ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campanhas List */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Cards</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          {filteredCampanhas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCampanhas.map(campanha => (
                <Card key={campanha.id} className="group">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(campanha.status)}
                      </div>
                      <CardTitle className="text-base line-clamp-2">
                        {campanha.nome}
                      </CardTitle>
                      <CardDescription>
                        {campanha.cliente?.nome || 'Sem cliente'}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => copyNomenclatura(campanha.nome)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar Nomenclatura
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(campanha)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(campanha.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Target className="h-3 w-3" />
                        <span className="capitalize">{campanha.objetivo}</span>
                      </div>
                      {campanha.trader && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="truncate">{campanha.trader.nome}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      {campanha.orcamento && (
                        <div className="flex items-center gap-1 text-green-600 font-medium">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(campanha.orcamento)}
                        </div>
                      )}
                      {campanha.data_inicio && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(campanha.data_inicio)}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        ID: {campanha.id_campanha_plataforma}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center">
                <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">
                  Nenhuma campanha encontrada
                </h3>
                <p className="text-muted-foreground mt-2">
                  {search || statusFilter !== 'all'
                    ? 'Tente ajustar os filtros'
                    : 'Comece criando sua primeira campanha'}
                </p>
                {!search && statusFilter === 'all' && (
                  <Button className="mt-4" onClick={() => setIsOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Campanha
                  </Button>
                )}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="list">
          {filteredCampanhas.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Campanha</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">
                      Cliente
                    </th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">
                      Trader
                    </th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium hidden sm:table-cell">
                      Orçamento
                    </th>
                    <th className="text-right p-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampanhas.map(campanha => (
                    <tr
                      key={campanha.id}
                      className="border-t hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-medium truncate max-w-[200px]">
                            {campanha.nome}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {campanha.id_campanha_plataforma}
                          </p>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        {campanha.cliente?.nome || '-'}
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        {campanha.trader?.nome || '-'}
                      </td>
                      <td className="p-4">{getStatusBadge(campanha.status)}</td>
                      <td className="p-4 text-right hidden sm:table-cell">
                        {campanha.orcamento
                          ? formatCurrency(campanha.orcamento)
                          : '-'}
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => copyNomenclatura(campanha.nome)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copiar Nomenclatura
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openEditDialog(campanha)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(campanha.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center">
                <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">
                  Nenhuma campanha encontrada
                </h3>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
