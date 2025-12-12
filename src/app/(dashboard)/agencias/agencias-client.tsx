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
  MapPin,
  Percent,
  Search,
  Loader2,
} from 'lucide-react'
import type { Agencia } from '@/types'

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
    porcentagem: 0,
    local: '',
  })
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const filteredAgencias = agencias.filter(
    agencia =>
      agencia.nome.toLowerCase().includes(search.toLowerCase()) ||
      agencia.local.toLowerCase().includes(search.toLowerCase())
  )

  const resetForm = () => {
    setFormData({ nome: '', porcentagem: 0, local: '' })
    setEditingAgencia(null)
  }

  const openEditDialog = (agencia: Agencia) => {
    setEditingAgencia(agencia)
    setFormData({
      nome: agencia.nome,
      porcentagem: agencia.porcentagem,
      local: agencia.local,
    })
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (editingAgencia) {
        const { data, error } = await supabase
          .from('cap_manager_agencias')
          .update(formData)
          .eq('id', editingAgencia.id)
          .select()
          .single()

        if (error) throw error

        setAgencias(prev =>
          prev.map(a => (a.id === editingAgencia.id ? data : a))
        )
        toast({ title: 'Agência atualizada com sucesso!' })
      } else {
        const { data, error } = await supabase
          .from('cap_manager_agencias')
          .insert(formData)
          .select()
          .single()

        if (error) throw error

        setAgencias(prev => [...prev, data])
        toast({ title: 'Agência criada com sucesso!' })
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
    if (!confirm('Tem certeza que deseja excluir esta agência?')) return

    try {
      const { error } = await supabase.from('cap_manager_agencias').delete().eq('id', id)

      if (error) throw error

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
                  <Label htmlFor="nome">Nome da Agência</Label>
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
                  <Label htmlFor="porcentagem">Porcentagem (%)</Label>
                  <Input
                    id="porcentagem"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="Ex: 15"
                    value={formData.porcentagem}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        porcentagem: parseFloat(e.target.value) || 0,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="local">Local</Label>
                  <Input
                    id="local"
                    placeholder="Cidade/Estado"
                    value={formData.local}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, local: e.target.value }))
                    }
                    required
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
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {agencia.local}
                    </CardDescription>
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
              <CardContent>
                <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                  <Percent className="h-5 w-5" />
                  {agencia.porcentagem}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Porcentagem da agência
                </p>
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
