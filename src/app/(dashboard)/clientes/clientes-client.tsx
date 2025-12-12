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
  Calendar,
  CreditCard,
  ExternalLink,
  Search,
  Loader2,
} from 'lucide-react'
import type { Cliente, Agencia } from '@/types'
import { formatCNPJ, formatPhone } from '@/lib/utils'

interface ClientesClientProps {
  clientes: (Cliente & { agencia: Agencia | null })[]
  agencias: Agencia[]
}

const formasPagamento = [
  { value: 'pix', label: 'PIX' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'transferencia', label: 'Transferência' },
]

export function ClientesClient({
  clientes: initialClientes,
  agencias,
}: ClientesClientProps) {
  const [clientes, setClientes] = useState(initialClientes)
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    agencia_id: '',
    link_drive: '',
    contato: '',
    cnpj: '',
    email: '',
    dia_cobranca: 1,
    forma_pagamento: 'pix' as 'pix' | 'boleto' | 'cartao' | 'transferencia',
    whatsapp: '',
  })
  const router = useRouter()
  const { toast } = useToast()

  const filteredClientes = clientes.filter(
    cliente =>
      cliente.nome.toLowerCase().includes(search.toLowerCase()) ||
      cliente.email.toLowerCase().includes(search.toLowerCase()) ||
      cliente.agencia?.nome.toLowerCase().includes(search.toLowerCase())
  )

  const resetForm = () => {
    setFormData({
      nome: '',
      agencia_id: '',
      link_drive: '',
      contato: '',
      cnpj: '',
      email: '',
      dia_cobranca: 1,
      forma_pagamento: 'pix',
      whatsapp: '',
    })
    setEditingCliente(null)
  }

  const openEditDialog = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({
      nome: cliente.nome,
      agencia_id: cliente.agencia_id || '',
      link_drive: cliente.link_drive || '',
      contato: cliente.contato,
      cnpj: cliente.cnpj || '',
      email: cliente.email,
      dia_cobranca: cliente.dia_cobranca,
      forma_pagamento: cliente.forma_pagamento,
      whatsapp: cliente.whatsapp || '',
    })
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Erro ao salvar cliente')

      const data = await response.json()

      if (editingCliente) {
        setClientes(prev =>
          prev.map(c => (c.id === editingCliente.id ? data : c))
        )
        toast({ title: 'Cliente atualizado com sucesso!' })
      } else {
        setClientes(prev => [...prev, data])
        toast({ title: 'Cliente criado com sucesso!' })
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
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      const response = await fetch(`/api/clientes?id=${id}`, {
        method: 'DELETE',
      })

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
            if (!open) resetForm()
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
                      setFormData(prev => ({ ...prev, nome: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agencia_id">Agência</Label>
                  <Select
                    value={formData.agencia_id}
                    onValueChange={value =>
                      setFormData(prev => ({ ...prev, agencia_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma agência" />
                    </SelectTrigger>
                    <SelectContent>
                      {agencias.map(agencia => (
                        <SelectItem key={agencia.id} value={agencia.id}>
                          {agencia.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contato">Contato *</Label>
                  <Input
                    id="contato"
                    placeholder="Nome do contato"
                    value={formData.contato}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, contato: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    placeholder="(11) 99999-9999"
                    value={formData.whatsapp}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, whatsapp: e.target.value }))
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
                      setFormData(prev => ({ ...prev, cnpj: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dia_cobranca">Dia da Cobrança *</Label>
                  <Input
                    id="dia_cobranca"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Dia do mês"
                    value={formData.dia_cobranca}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        dia_cobranca: parseInt(e.target.value) || 1,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
                  <Select
                    value={formData.forma_pagamento}
                    onValueChange={value =>
                      setFormData(prev => ({
                        ...prev,
                        forma_pagamento: value as 'pix' | 'boleto' | 'cartao' | 'transferencia',
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {formasPagamento.map(forma => (
                        <SelectItem key={forma.value} value={forma.value}>
                          {forma.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="link_drive">Link do Drive (Peças)</Label>
                  <Input
                    id="link_drive"
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={formData.link_drive}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, link_drive: e.target.value }))
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

      {/* Clientes Grid */}
      {filteredClientes.length > 0 ? (
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
                      {!cliente.ativo && (
                        <Badge variant="secondary">Inativo</Badge>
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
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{cliente.email}</span>
                  </div>
                  {cliente.whatsapp && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{formatPhone(cliente.whatsapp)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Dia {cliente.dia_cobranca}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <Badge variant="outline" className="text-xs">
                      {formasPagamento.find(f => f.value === cliente.forma_pagamento)?.label}
                    </Badge>
                  </div>
                </div>
                {cliente.cnpj && (
                  <p className="text-sm text-muted-foreground">
                    CNPJ: {formatCNPJ(cliente.cnpj)}
                  </p>
                )}
                {cliente.link_drive && (
                  <a
                    href={cliente.link_drive}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Acessar Drive
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
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
