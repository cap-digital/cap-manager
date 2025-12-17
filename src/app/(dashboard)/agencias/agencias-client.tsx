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
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Building2,
  Phone,
  Mail,
  User,
  Search,
  Loader2,
} from 'lucide-react'
import type { Agencia } from '@/types'
import { maskPhone, maskCNPJ } from '@/lib/utils'

interface AgenciasClientProps {
  agencias: Agencia[]
}

export function AgenciasClient({ agencias: initialAgencias }: AgenciasClientProps) {
  const [agencias, setAgencias] = useState<Agencia[]>(initialAgencias)
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [editingAgencia, setEditingAgencia] = useState<Agencia | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
    contato: '',
  })
  const router = useRouter()
  const { toast } = useToast()

  const filteredAgencias = agencias.filter(
    agencia =>
      agencia.nome.toLowerCase().includes(search.toLowerCase()) ||
      (agencia.email && agencia.email.toLowerCase().includes(search.toLowerCase())) ||
      (agencia.contato && agencia.contato.toLowerCase().includes(search.toLowerCase()))
  )

  const resetForm = () => {
    setFormData({ nome: '', cnpj: '', telefone: '', email: '', contato: '' })
    setEditingAgencia(null)
  }

  const openEditDialog = (agencia: Agencia) => {
    setEditingAgencia(agencia)
    setFormData({
      nome: agencia.nome,
      cnpj: agencia.cnpj ? maskCNPJ(agencia.cnpj) : '',
      telefone: agencia.telefone ? maskPhone(agencia.telefone) : '',
      email: agencia.email || '',
      contato: agencia.contato || '',
    })
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Limpar máscaras antes de enviar
    const payload = {
      nome: formData.nome,
      cnpj: formData.cnpj ? formData.cnpj.replace(/\D/g, '') : null,
      telefone: formData.telefone ? formData.telefone.replace(/\D/g, '') : null,
      email: formData.email || null,
      contato: formData.contato || null,
    }

    try {
      if (editingAgencia) {
        const response = await fetch(`/api/agencias?id=${editingAgencia.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) throw new Error('Erro ao atualizar agência')

        const data = await response.json()

        // Atualizar estado local imediatamente
        setAgencias(prev =>
          prev.map(a =>
            a.id === editingAgencia.id
              ? {
                  ...a,
                  nome: data.nome,
                  cnpj: data.cnpj,
                  telefone: data.telefone,
                  email: data.email,
                  contato: data.contato,
                }
              : a
          )
        )
        toast({ title: 'Agência atualizada com sucesso!' })
      } else {
        const response = await fetch('/api/agencias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) throw new Error('Erro ao criar agência')

        const data = await response.json()

        // Adicionar nova agência ao estado local imediatamente
        setAgencias(prev => [
          ...prev,
          {
            id: data.id,
            nome: data.nome,
            cnpj: data.cnpj,
            telefone: data.telefone,
            email: data.email,
            contato: data.contato,
            created_at: data.createdAt,
            updated_at: data.updatedAt,
          },
        ])
        toast({ title: 'Agência criada com sucesso!' })
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

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta agência?')) return

    try {
      const response = await fetch(`/api/agencias?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Erro ao excluir agência')

      setAgencias(prev => prev.filter(a => a.id !== id))
      toast({ title: 'Agência excluída com sucesso!' })
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
            placeholder="Buscar agências..."
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
              Nova Agência
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingAgencia ? 'Editar Agência' : 'Nova Agência'}
                </DialogTitle>
                <DialogDescription>
                  {editingAgencia
                    ? 'Atualize os dados da agência'
                    : 'Preencha os dados para criar uma nova agência'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Agência *</Label>
                  <Input
                    id="nome"
                    placeholder="Nome da agência"
                    value={formData.nome}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, nome: e.target.value }))
                    }
                    required
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

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    placeholder="(11) 99999-9999"
                    value={formData.telefone}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, telefone: maskPhone(e.target.value) }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contato@agencia.com"
                    value={formData.email}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contato">Nome do Contato (opcional)</Label>
                  <Input
                    id="contato"
                    placeholder="Nome da pessoa de contato"
                    value={formData.contato}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, contato: e.target.value }))
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
                  {editingAgencia ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Agencias Grid */}
      {filteredAgencias.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgencias.map(agencia => (
            <Card key={agencia.id} className="group">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{agencia.nome}</CardTitle>
                    {agencia.contato && (
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <User className="h-3 w-3" />
                        {agencia.contato}
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
                    <DropdownMenuItem onClick={() => openEditDialog(agencia)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(agencia.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-2">
                {agencia.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {agencia.email}
                  </div>
                )}
                {agencia.telefone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {maskPhone(agencia.telefone)}
                  </div>
                )}
                {agencia.cnpj && (
                  <div className="text-sm text-muted-foreground">
                    CNPJ: {maskCNPJ(agencia.cnpj)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Nenhuma agência encontrada</h3>
            <p className="text-muted-foreground mt-2">
              {search
                ? 'Tente buscar com outros termos'
                : 'Comece criando sua primeira agência'}
            </p>
            {!search && (
              <Button className="mt-4" onClick={() => setIsOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Agência
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
