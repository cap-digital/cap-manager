'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  Users,
  MoreHorizontal,
  Edit,
  UserX,
  UserCheck,
  Shield,
  Search,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface Usuario {
  id: number
  email: string
  nome: string
  role: 'admin' | 'trader' | 'gestor' | 'cliente'
  whatsapp: string | null
  ativo: boolean
  created_at: string
}

interface UsuariosClientProps {
  usuarios: Usuario[]
}

const roleLabels = {
  admin: { label: 'Administrador', color: 'bg-red-100 text-red-700' },
  gestor: { label: 'Gestor', color: 'bg-purple-100 text-purple-700' },
  trader: { label: 'Trader', color: 'bg-blue-100 text-blue-700' },
  cliente: { label: 'Cliente', color: 'bg-green-100 text-green-700' },
}

export function UsuariosClient({ usuarios: initialUsuarios }: UsuariosClientProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsuarios)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    role: 'trader' as 'admin' | 'trader' | 'gestor' | 'cliente',
    whatsapp: '',
  })
  const { toast } = useToast()
  const router = useRouter()

  const filteredUsuarios = usuarios.filter(
    u =>
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (user: Usuario) => {
    setEditingUser(user)
    setFormData({
      nome: user.nome,
      email: user.email,
      role: user.role,
      whatsapp: user.whatsapp || '',
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingUser) return

    try {
      const response = await fetch(`/api/usuarios/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: data.error || 'Erro ao atualizar usuário',
        })
        return
      }

      setUsuarios(
        usuarios.map(u =>
          u.id === editingUser.id
            ? { ...u, ...formData }
            : u
        )
      )

      toast({
        title: 'Sucesso',
        description: 'Usuário atualizado com sucesso',
      })

      setIsDialogOpen(false)
      router.refresh()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao atualizar usuário',
      })
    }
  }

  const handleToggleActive = async (user: Usuario) => {
    try {
      const response = await fetch(`/api/usuarios/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !user.ativo }),
      })

      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Erro ao atualizar status do usuário',
        })
        return
      }

      setUsuarios(
        usuarios.map(u =>
          u.id === user.id ? { ...u, ativo: !user.ativo } : u
        )
      )

      toast({
        title: 'Sucesso',
        description: user.ativo ? 'Usuário desativado' : 'Usuário ativado',
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao atualizar status do usuário',
      })
    }
  }

  const stats = {
    total: usuarios.length,
    ativos: usuarios.filter(u => u.ativo).length,
    admins: usuarios.filter(u => u.role === 'admin').length,
    traders: usuarios.filter(u => u.role === 'trader').length,
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.ativos}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.admins}</p>
                <p className="text-xs text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.traders}</p>
                <p className="text-xs text-muted-foreground">Traders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsuarios.map(user => {
                    const roleInfo = roleLabels[user.role]
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.nome}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={roleInfo.color} variant="secondary">
                            {roleInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.ativo ? 'default' : 'secondary'}
                            className={user.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                          >
                            {user.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.whatsapp || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                                {user.ativo ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    Desativar
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Ativar
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={formData.nome}
                onChange={e => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Cargo</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="trader">Trader</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input
                value={formData.whatsapp}
                onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
