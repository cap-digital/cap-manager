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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Pi {
  id: string
  identificador: string
  valor_bruto: number
  projetos_count: number
  created_at: string
  updated_at: string
}

interface PiClientProps {
  pis: Pi[]
}

export function PiClient({ pis: initialPis }: PiClientProps) {
  const [pis, setPis] = useState<Pi[]>(initialPis)
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [editingPi, setEditingPi] = useState<Pi | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    identificador: '',
    valor_bruto: '',
  })
  const router = useRouter()
  const { toast } = useToast()

  const filteredPis = pis.filter(pi =>
    pi.identificador.toLowerCase().includes(search.toLowerCase())
  )

  const totalValor = pis.reduce((acc, pi) => acc + pi.valor_bruto, 0)

  const resetForm = () => {
    setFormData({ identificador: '', valor_bruto: '' })
    setEditingPi(null)
  }

  const openEditDialog = (pi: Pi) => {
    setEditingPi(pi)
    setFormData({
      identificador: pi.identificador,
      valor_bruto: pi.valor_bruto.toString(),
    })
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const payload = {
      identificador: formData.identificador,
      valor_bruto: parseFloat(formData.valor_bruto) || 0,
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

        setPis(prev =>
          prev.map(p =>
            p.id === editingPi.id
              ? { ...p, identificador: payload.identificador, valor_bruto: payload.valor_bruto }
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

        setPis(prev => [
          {
            id: data.id,
            identificador: data.identificador,
            valor_bruto: Number(data.valorBruto),
            projetos_count: 0,
            created_at: data.createdAt,
            updated_at: data.updatedAt,
          },
          ...prev,
        ])
        toast({ title: 'PI criado com sucesso!' })
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
                  <Input
                    id="identificador"
                    placeholder="Ex: PI-2024-001"
                    value={formData.identificador}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, identificador: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_bruto">Valor Bruto Total (R$) *</Label>
                  <Input
                    id="valor_bruto"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formData.valor_bruto}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, valor_bruto: e.target.value }))
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
                  {editingPi ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      {filteredPis.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Lista de PIs</CardTitle>
            <CardDescription>
              {filteredPis.length} PI(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identificador</TableHead>
                  <TableHead className="text-right">Valor Bruto</TableHead>
                  <TableHead className="text-center">Projetos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPis.map(pi => (
                  <TableRow key={pi.id}>
                    <TableCell className="font-medium">{pi.identificador}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {formatCurrency(pi.valor_bruto)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Megaphone className="h-3 w-3" />
                        {pi.projetos_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
