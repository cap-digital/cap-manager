'use client'

import { useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  FileText,
  Search,
  Loader2,
  DollarSign,
  Megaphone,
  Building2,
  Users,
  X,
} from 'lucide-react'
import { formatCurrency, maskCurrency, parseCurrency } from '@/lib/utils'
import type { Agencia, Cliente } from '@/types'

interface SimplifiedAgencia {
  id: number
  nome: string
}

interface SimplifiedCliente {
  id: number
  nome: string
  agencia_id: number | null
}

interface Pi {
  id: number
  identificador: string
  valor_bruto: number
  agencia_id: number | null
  agencia?: SimplifiedAgencia | null
  cliente_id: number | null
  cliente?: SimplifiedCliente | null
  projetos_count: number
  created_at: string
  updated_at: string
}

interface PiClientProps {
  pis: Pi[]
  agencias: SimplifiedAgencia[]
  clientes: SimplifiedCliente[]
}

export function PiClient({ pis: initialPis, agencias, clientes }: PiClientProps) {
  const [pis, setPis] = useState<Pi[]>(initialPis)
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [editingPi, setEditingPi] = useState<Pi | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Filter states
  const [agenciaFilter, setAgenciaFilter] = useState<string>('all')
  const [clienteFilter, setClienteFilter] = useState<string>('all')
  const [minValorFilter, setMinValorFilter] = useState<string>('')
  const [maxValorFilter, setMaxValorFilter] = useState<string>('')

  const [formData, setFormData] = useState({
    identificador: '',
    valor_bruto: '',
    agencia_id: null as number | null,
    cliente_id: null as number | null,
  })
  const router = useRouter()
  const { toast } = useToast()

  // Filtrar clientes pela agência selecionada (mas sempre mostrar todos se não houver agência)
  const filteredClientes = formData.agencia_id
    ? clientes.filter(c => c.agencia_id === formData.agencia_id || !c.agencia_id)
    : clientes

  // Filtrar clientes para o filtro baseado na agência filtrada
  const clientesParaFiltro = agenciaFilter !== 'all'
    ? clientes.filter(c => c.agencia_id === parseInt(agenciaFilter) || !c.agencia_id)
    : clientes

  const filteredPis = pis.filter(pi => {
    const matchesSearch =
      pi.identificador.toLowerCase().includes(search.toLowerCase()) ||
      (pi.agencia && pi.agencia.nome.toLowerCase().includes(search.toLowerCase())) ||
      (pi.cliente && pi.cliente.nome.toLowerCase().includes(search.toLowerCase()))

    const matchesAgencia = agenciaFilter === 'all' || pi.agencia_id === parseInt(agenciaFilter)
    const matchesCliente = clienteFilter === 'all' || pi.cliente_id === parseInt(clienteFilter)

    const minValor = minValorFilter ? parseCurrency(minValorFilter) : 0
    const maxValor = maxValorFilter ? parseCurrency(maxValorFilter) : Infinity
    const matchesValor = pi.valor_bruto >= minValor && pi.valor_bruto <= maxValor

    return matchesSearch && matchesAgencia && matchesCliente && matchesValor
  })

  const totalValor = pis.reduce((acc, pi) => acc + pi.valor_bruto, 0)

  const resetForm = () => {
    setFormData({ identificador: '', valor_bruto: '', agencia_id: null, cliente_id: null })
    setEditingPi(null)
  }

  const openEditDialog = (pi: Pi) => {
    setEditingPi(pi)
    // Remove o prefixo "PI - " se existir para edição
    const identificadorSemPrefixo = pi.identificador.replace(/^PI\s*-\s*/i, '')
    setFormData({
      identificador: identificadorSemPrefixo,
      valor_bruto: formatCurrency(pi.valor_bruto),
      agencia_id: pi.agencia_id,
      cliente_id: pi.cliente_id,
    })
    setIsOpen(true)
  }

  // Reset cliente quando agência muda
  useEffect(() => {
    if (formData.agencia_id && formData.cliente_id) {
      const clienteValido = clientes.find(
        c => c.id === formData.cliente_id && c.agencia_id === formData.agencia_id
      )
      if (!clienteValido) {
        setFormData(prev => ({ ...prev, cliente_id: null }))
      }
    }
  }, [formData.agencia_id, formData.cliente_id, clientes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (!formData.agencia_id) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Selecione uma agência',
      })
      return
    }

    if (!formData.cliente_id) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Selecione um cliente',
      })
      return
    }

    const valorBruto = parseCurrency(formData.valor_bruto)
    if (!formData.valor_bruto || valorBruto <= 0) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Informe um valor bruto válido maior que zero',
      })
      return
    }

    setIsLoading(true)

    // Adiciona o prefixo "PI - " se não existir
    let identificador = formData.identificador.trim()
    if (!identificador.toUpperCase().startsWith('PI')) {
      identificador = `PI - ${identificador}`
    } else if (!identificador.includes('-')) {
      identificador = identificador.replace(/^PI\s*/i, 'PI - ')
    }

    const payload = {
      identificador,
      valor_bruto: parseCurrency(formData.valor_bruto),
      agencia_id: formData.agencia_id,
      cliente_id: formData.cliente_id,
    }

    try {
      if (editingPi) {
        const response = await fetch(`/api/pis?id=${editingPi.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao atualizar PI')
        }

        // Atualizar estado local imediatamente
        setPis(prev =>
          prev.map(p =>
            p.id === editingPi.id
              ? {
                ...p,
                identificador: data.identificador,
                valor_bruto: Number(data.valor_bruto),
                agencia_id: data.agencia_id,
                agencia: data.agencias ? { id: data.agencias.id, nome: data.agencias.nome } : null,
                cliente_id: data.cliente_id,
                cliente: data.clientes ? { id: data.clientes.id, nome: data.clientes.nome, agencia_id: data.clientes.agencia_id } : null,
              }
              : p
          )
        )
        toast({ title: 'PI atualizado com sucesso!' })
      } else {
        const response = await fetch('/api/pis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao criar PI')
        }

        // Adicionar novo PI ao estado local imediatamente
        setPis(prev => [
          {
            id: data.id,
            identificador: data.identificador,
            valor_bruto: Number(data.valor_bruto),
            agencia_id: data.agencia_id,
            agencia: data.agencias ? { id: data.agencias.id, nome: data.agencias.nome } : null,
            cliente_id: data.cliente_id,
            cliente: data.clientes ? { id: data.clientes.id, nome: data.clientes.nome, agencia_id: data.clientes.agencia_id } : null,
            projetos_count: 0,
            created_at: data.created_at,
            updated_at: data.updated_at,
          },
          ...prev, // Add to start of list
        ])
        toast({ title: 'PI criado com sucesso!' })
      }

      setIsOpen(false)
      resetForm()
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

  const handleDelete = async (pi: Pi) => {
    if (pi.projetos_count > 0) {
      toast({
        variant: 'destructive',
        title: 'Não é possível excluir',
        description: `Este PI está sendo usado por ${pi.projetos_count} projeto(s)`,
      })
      return
    }

    if (!confirm('Tem certeza que deseja excluir este PI?')) return

    try {
      const response = await fetch(`/api/pis?id=${pi.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir PI')
      }

      setPis(prev => prev.filter(p => p.id !== pi.id))
      toast({ title: 'PI excluído com sucesso!' })
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de PIs</p>
                <p className="text-3xl font-bold mt-1">{pis.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(totalValor)}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Projetos Vinculados</p>
                <p className="text-3xl font-bold mt-1">
                  {pis.reduce((acc, pi) => acc + pi.projetos_count, 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-100">
                <Megaphone className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar PIs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo PI
          </Button>
        </div>

        {/* Filters Bar */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Agência</Label>
              <Select value={agenciaFilter} onValueChange={v => {
                setAgenciaFilter(v)
                if (v !== agenciaFilter) setClienteFilter('all') // Reset cliente when agencia changes
              }}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {agencias.map(a => (
                    <SelectItem key={a.id} value={a.id.toString()}>{a.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Cliente</Label>
              <Select value={clienteFilter} onValueChange={setClienteFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {clientesParaFiltro.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="h-9 border-l mx-1" />

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Valor Mínimo</Label>
              <Input
                placeholder="R$ 0,00"
                value={minValorFilter}
                onChange={e => setMinValorFilter(maskCurrency(e.target.value))}
                className="w-[130px] h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Valor Máximo</Label>
              <Input
                placeholder="R$ 999.999,99"
                value={maxValorFilter}
                onChange={e => setMaxValorFilter(maskCurrency(e.target.value))}
                className="w-[130px] h-9"
              />
            </div>

            {(agenciaFilter !== 'all' || clienteFilter !== 'all' || minValorFilter || maxValorFilter) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9"
                onClick={() => {
                  setAgenciaFilter('all')
                  setClienteFilter('all')
                  setMinValorFilter('')
                  setMaxValorFilter('')
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}

            <div className="ml-auto text-sm text-muted-foreground">
              {filteredPis.length} PI(s)
            </div>
          </div>
        </Card>
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
            Novo PI
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingPi ? 'Editar PI' : 'Novo PI'}</DialogTitle>
              <DialogDescription>
                {editingPi
                  ? 'Atualize os dados do PI'
                  : 'Preencha os dados para criar um novo PI'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="identificador">Identificador do PI *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">PI - </span>
                  <Input
                    id="identificador"
                    placeholder="Ex: 2024-001"
                    value={formData.identificador}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, identificador: e.target.value }))
                    }
                    required
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor_bruto">Valor Bruto Total *</Label>
                <Input
                  id="valor_bruto"
                  type="text"
                  placeholder="R$ 0,00"
                  value={formData.valor_bruto}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, valor_bruto: maskCurrency(e.target.value) }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agencia_id">Agência *</Label>
                <Select
                  value={formData.agencia_id?.toString() || ''}
                  onValueChange={value =>
                    setFormData(prev => ({
                      ...prev,
                      agencia_id: value ? parseInt(value) : null,
                      cliente_id: null // Reset cliente quando agência muda
                    }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma agência" />
                  </SelectTrigger>
                  <SelectContent>
                    {agencias.map(agencia => (
                      <SelectItem key={agencia.id} value={agencia.id.toString()}>
                        {agencia.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cliente_id">Cliente *</Label>
                <Select
                  value={formData.cliente_id?.toString() || ''}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, cliente_id: value ? parseInt(value) : null }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClientes.map(cliente => (
                      <SelectItem key={cliente.id} value={cliente.id.toString()}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                {editingPi ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PIs Grid */}
      {filteredPis.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPis.map(pi => (
            <Card key={pi.id} className="group">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-primary/10 mt-1">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {pi.identificador}
                      <Badge variant="outline" className="ml-auto">
                        {pi.projetos_count} projeto{pi.projetos_count !== 1 ? 's' : ''}
                      </Badge>
                    </CardTitle>
                    {pi.agencia && (
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Building2 className="h-3 w-3" />
                        {pi.agencia.nome}
                      </CardDescription>
                    )}
                  </div>
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
                    <DropdownMenuItem onClick={() => openEditDialog(pi)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(pi)}
                      className="text-destructive"
                      disabled={pi.projetos_count > 0}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-3">
                {pi.cliente && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{pi.cliente.nome}</span>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Valor Bruto</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(pi.valor_bruto)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Nenhum PI encontrado</h3>
            <p className="text-muted-foreground mt-2">
              {search ? 'Tente buscar com outros termos' : 'Comece criando seu primeiro PI'}
            </p>
            {!search && (
              <Button className="mt-4" onClick={() => setIsOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar PI
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
