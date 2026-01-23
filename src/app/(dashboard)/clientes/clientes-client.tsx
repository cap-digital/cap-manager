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
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
  Mail,
  Phone,
  Building2,
  Search,
  Loader2,
  LayoutGrid,
  List,
} from 'lucide-react'
import type { Agencia } from '@/types'
import { formatPhone, maskPhone, maskCNPJ, formatCNPJ } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface SimplifiedCliente {
  id: number
  nome: string
  agencia_id: number | null
  agencia: Agencia | null
  contato: string | null
  cnpj: string | null
  email: string | null
  whatsapp: string | null
  tipo_cobranca: 'td' | 'fee'
  ativo: boolean
  created_at: string
  updated_at: string
}

interface ClientesClientProps {
  clientes: SimplifiedCliente[]
  agencias: Agencia[]
}

const tiposCobranca = [
  { value: 'td', label: 'TD (Trading Desk)' },
  { value: 'fee', label: 'FEE' },
]

export function ClientesClient({
  clientes: initialClientes,
  agencias: initialAgencias,
}: ClientesClientProps) {
  const [clientes, setClientes] = useState(initialClientes)
  const [agencias, setAgencias] = useState(initialAgencias)
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<SimplifiedCliente | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAgencias, setIsLoadingAgencias] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    agencia_id: null as number | null,
    contato: '',
    cnpj: '',
    email: '',
    whatsapp: '',
    tipo_cobranca: 'td' as 'td' | 'fee',
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const router = useRouter()
  const { toast } = useToast()

  // Fetch agencies dynamically when dialog opens
  const fetchAgencias = async () => {
    setIsLoadingAgencias(true)
    try {
      const response = await fetch('/api/agencias', { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setAgencias(data)
      }
    } catch (error) {
      console.error('Erro ao buscar agências:', error)
    } finally {
      setIsLoadingAgencias(false)
    }
  }

  const filteredClientes = clientes.filter(
    cliente =>
      cliente.nome.toLowerCase().includes(search.toLowerCase()) ||
      (cliente.email && cliente.email.toLowerCase().includes(search.toLowerCase())) ||
      (cliente.agencia && cliente.agencia.nome.toLowerCase().includes(search.toLowerCase()))
  )

  const resetForm = () => {
    setFormData({
      nome: '',
      agencia_id: null,
      contato: '',
      cnpj: '',
      email: '',
      whatsapp: '',
      tipo_cobranca: 'td',
    })
    setEditingCliente(null)
  }

  const openEditDialog = (cliente: SimplifiedCliente) => {
    setEditingCliente(cliente)
    setFormData({
      nome: cliente.nome,
      agencia_id: cliente.agencia_id,
      contato: cliente.contato || '',
      cnpj: cliente.cnpj ? maskCNPJ(cliente.cnpj) : '',
      email: cliente.email || '',
      whatsapp: cliente.whatsapp ? maskPhone(cliente.whatsapp) : '',
      tipo_cobranca: cliente.tipo_cobranca,
    })
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação: agência obrigatória apenas para TD
    if (formData.tipo_cobranca === 'td' && !formData.agencia_id) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Selecione uma agência para clientes TD',
      })
      return
    }

    setIsLoading(true)

    // Limpar máscaras antes de enviar
    const payload = {
      nome: formData.nome.toUpperCase(),
      agencia_id: formData.agencia_id,
      contato: formData.contato || null,
      cnpj: formData.cnpj ? formData.cnpj.replace(/\D/g, '') : null,
      email: formData.email || null,
      whatsapp: formData.whatsapp ? formData.whatsapp.replace(/\D/g, '') : null,
      tipo_cobranca: formData.tipo_cobranca,
    }

    try {
      if (editingCliente) {
        const response = await fetch(`/api/clientes?id=${editingCliente.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Erro ao atualizar cliente')
        }

        const data = await response.json()

        // Atualizar estado local imediatamente
        setClientes(prev =>
          prev.map(c =>
            c.id === editingCliente.id
              ? {
                ...c,
                nome: data.nome,
                agencia_id: data.agencia_id,
                agencia: data.agencia ? { id: data.agencia.id, nome: data.agencia.nome, cnpj: null, telefone: null, email: null, contato: null, created_at: '', updated_at: '' } : null,
                contato: data.contato,
                cnpj: data.cnpj,
                email: data.email,
                whatsapp: data.whatsapp,
                tipo_cobranca: data.tipo_cobranca,
              }
              : c
          )
        )
        toast({ title: 'Cliente atualizado com sucesso!' })
      } else {
        const response = await fetch('/api/clientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Erro ao criar cliente')
        }

        const data = await response.json()

        // Adicionar novo cliente ao estado local imediatamente
        setClientes(prev => [
          ...prev,
          {
            id: data.id,
            nome: data.nome,
            agencia_id: data.agencia_id,
            agencia: data.agencia ? { id: data.agencia.id, nome: data.agencia.nome, cnpj: null, telefone: null, email: null, contato: null, created_at: '', updated_at: '' } : null,
            contato: data.contato,
            cnpj: data.cnpj,
            email: data.email,
            whatsapp: data.whatsapp,
            tipo_cobranca: data.tipo_cobranca,
            ativo: data.ativo,
            created_at: data.created_at,
            updated_at: data.updated_at,
          },
        ])
        toast({ title: 'Cliente criado com sucesso!' })
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

  const handleDelete = async (id: number, force = false) => {
    if (!force && !confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      const url = force ? `/api/clientes?id=${id}&force=true` : `/api/clientes?id=${id}`
      const response = await fetch(url, { method: 'DELETE' })

      // Handle 409 - has linked items
      if (response.status === 409) {
        const data = await response.json()
        const linkedItems = []
        if (data.linkedPIs?.length > 0) {
          linkedItems.push(`PIs: ${data.linkedPIs.map((p: { identificador: string }) => p.identificador).join(', ')}`)
        }
        if (data.linkedProjetos?.length > 0) {
          linkedItems.push(`Projetos: ${data.linkedProjetos.map((p: { nome: string }) => p.nome).join(', ')}`)
        }

        const confirmForce = confirm(
          `⚠️ Este cliente possui vínculos:\n\n${linkedItems.join('\n')}\n\nDeseja excluir o cliente E todos os itens vinculados?`
        )

        if (confirmForce) {
          return handleDelete(id, true)
        }
        return
      }

      if (!response.ok) throw new Error('Erro ao excluir')

      setClientes(prev => prev.filter(c => c.id !== id))
      toast({ title: 'Cliente excluído com sucesso!' })
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
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Dialog
          open={isOpen}
          onOpenChange={open => {
            setIsOpen(open)
            if (open) {
              fetchAgencias() // Fetch fresh agencies when dialog opens
            } else {
              resetForm()
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
                </DialogTitle>
                <DialogDescription>
                  {editingCliente
                    ? 'Atualize os dados do cliente'
                    : 'Preencha os dados para criar um novo cliente'}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Cliente *</Label>
                  <Input
                    id="nome"
                    placeholder="Nome do cliente"
                    value={formData.nome}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, nome: e.target.value.toUpperCase() }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_cobranca">Tipo de Cobrança *</Label>
                  <Select
                    value={formData.tipo_cobranca}
                    onValueChange={value =>
                      setFormData(prev => ({
                        ...prev,
                        tipo_cobranca: value as 'td' | 'fee',
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposCobranca.map(tipo => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agencia_id">
                    Agência {formData.tipo_cobranca === 'td' && '*'}
                  </Label>
                  <Select
                    value={formData.agencia_id?.toString() || ''}
                    onValueChange={value =>
                      setFormData(prev => ({ ...prev, agencia_id: value ? parseInt(value) : null }))
                    }
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
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contato">Contato</Label>
                  <Input
                    id="contato"
                    placeholder="Nome do contato"
                    value={formData.contato}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, contato: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    placeholder="(11) 99999-9999"
                    value={formData.whatsapp}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, whatsapp: maskPhone(e.target.value) }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, cnpj: maskCNPJ(e.target.value) }))
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
                  {editingCliente ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Toggle */}
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

      {/* Clientes Grid/List */}
      {filteredClientes.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredClientes.map(cliente => (
              <Card key={cliente.id} className="group">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 mt-1">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {cliente.nome}
                        <Badge variant={cliente.tipo_cobranca === 'td' ? 'default' : 'secondary'}>
                          {cliente.tipo_cobranca.toUpperCase()}
                        </Badge>
                        {!cliente.ativo && (
                          <Badge variant="outline">Inativo</Badge>
                        )}
                      </CardTitle>
                      {cliente.agencia && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Building2 className="h-3 w-3" />
                          {cliente.agencia.nome}
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
                      <DropdownMenuItem onClick={() => openEditDialog(cliente)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(cliente.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {cliente.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{cliente.email}</span>
                      </div>
                    )}
                    {cliente.whatsapp && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{formatPhone(cliente.whatsapp)}</span>
                      </div>
                    )}
                  </div>
                  {cliente.cnpj && (
                    <p className="text-sm text-muted-foreground">
                      CNPJ: {formatCNPJ(cliente.cnpj)}
                    </p>
                  )}
                  {cliente.contato && (
                    <p className="text-sm text-muted-foreground">
                      Contato: {cliente.contato}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Agência</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.map(cliente => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">{cliente.nome}</TableCell>
                    <TableCell>
                      <Badge variant={cliente.tipo_cobranca === 'td' ? 'default' : 'secondary'}>
                        {cliente.tipo_cobranca.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{cliente.agencia?.nome || '-'}</TableCell>
                    <TableCell>{cliente.contato || '-'}</TableCell>
                    <TableCell>{cliente.email || '-'}</TableCell>
                    <TableCell>{cliente.whatsapp ? formatPhone(cliente.whatsapp) : '-'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(cliente)}>
                            <Pencil className="h-4 w-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(cliente.id)} className="text-destructive">
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
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">
              Nenhum cliente encontrado
            </h3>
            <p className="text-muted-foreground mt-2">
              {search
                ? 'Tente buscar com outros termos'
                : 'Comece criando seu primeiro cliente'}
            </p>
            {!search && (
              <Button className="mt-4" onClick={() => setIsOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Cliente
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
