'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  MessageSquare,
  Clock,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Search,
  Loader2,
  User,
  FolderKanban,
} from 'lucide-react'
import { formatDateTime, getInitials } from '@/lib/utils'
import type { Usuario } from '@/types'

interface FollowUpClientProps {
  projetos: {
    id: string
    nome: string
    status: string
    cliente: { nome: string } | null
    trader: { id: string; nome: string } | null
  }[]
  followUps: {
    id: string
    conteudo: string
    tipo: string
    created_at: string
    projeto: {
      id: string
      nome: string
      cliente: { nome: string } | null
    } | null
    trader: { id: string; nome: string } | null
  }[]
  traders: { id: string; nome: string }[]
  currentUser: Usuario | null
}

const tipoOptions = [
  { value: 'nota', label: 'Nota', icon: MessageSquare, color: 'bg-blue-100 text-blue-700' },
  { value: 'alerta', label: 'Alerta', icon: AlertTriangle, color: 'bg-red-100 text-red-700' },
  { value: 'atualizacao', label: 'Atualização', icon: RefreshCw, color: 'bg-green-100 text-green-700' },
  { value: 'reuniao', label: 'Reunião', icon: Calendar, color: 'bg-purple-100 text-purple-700' },
]

export function FollowUpClient({
  projetos,
  followUps: initialFollowUps,
  traders,
  currentUser,
}: FollowUpClientProps) {
  const [followUps, setFollowUps] = useState(initialFollowUps)
  const [search, setSearch] = useState('')
  const [traderFilter, setTraderFilter] = useState<string>('all')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    projeto_id: '',
    conteudo: '',
    tipo: 'nota',
  })
  const router = useRouter()
  const { toast } = useToast()

  const filteredFollowUps = followUps.filter(followUp => {
    const matchesSearch =
      followUp.conteudo.toLowerCase().includes(search.toLowerCase()) ||
      followUp.projeto?.nome.toLowerCase().includes(search.toLowerCase()) ||
      followUp.projeto?.cliente?.nome.toLowerCase().includes(search.toLowerCase())

    const matchesTrader =
      traderFilter === 'all' || followUp.trader?.id === traderFilter

    return matchesSearch && matchesTrader
  })

  const projetosDoTrader =
    traderFilter === 'all'
      ? projetos
      : projetos.filter(p => p.trader?.id === traderFilter)

  const resetForm = () => {
    setFormData({
      projeto_id: '',
      conteudo: '',
      tipo: 'nota',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: 'Usuário não identificado',
      })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projeto_id: formData.projeto_id,
          trader_id: currentUser.id,
          conteudo: formData.conteudo,
          tipo: formData.tipo,
        }),
      })

      if (!response.ok) throw new Error('Erro ao criar follow-up')

      toast({ title: 'Follow-up adicionado!' })
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

  const getTipoConfig = (tipo: string) => {
    return tipoOptions.find(t => t.value === tipo) || tipoOptions[0]
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar follow-ups..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={traderFilter} onValueChange={setTraderFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por trader" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os traders</SelectItem>
              {traders.map(trader => (
                <SelectItem key={trader.id} value={trader.id}>
                  {trader.nome}
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
              Novo Follow-up
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Novo Follow-up</DialogTitle>
                <DialogDescription>
                  Adicione uma atualização sobre o projeto
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="projeto_id">Projeto *</Label>
                  <Select
                    value={formData.projeto_id}
                    onValueChange={value =>
                      setFormData(prev => ({ ...prev, projeto_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projetosDoTrader.map(projeto => (
                        <SelectItem key={projeto.id} value={projeto.id}>
                          {projeto.nome}
                          {projeto.cliente && (
                            <span className="text-muted-foreground ml-2">
                              ({projeto.cliente.nome})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={value =>
                      setFormData(prev => ({ ...prev, tipo: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tipoOptions.map(tipo => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          <div className="flex items-center gap-2">
                            <tipo.icon className="h-4 w-4" />
                            {tipo.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conteudo">Conteúdo *</Label>
                  <Textarea
                    id="conteudo"
                    placeholder="Descreva a atualização ou nota..."
                    value={formData.conteudo}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, conteudo: e.target.value }))
                    }
                    rows={4}
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
                  Adicionar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="projetos">Por Projeto</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          {filteredFollowUps.length > 0 ? (
            <div className="space-y-4">
              {filteredFollowUps.map(followUp => {
                const tipoConfig = getTipoConfig(followUp.tipo)
                return (
                  <Card key={followUp.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="shrink-0">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {getInitials(followUp.trader?.nome || 'U')}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-medium">
                              {followUp.trader?.nome || 'Usuário'}
                            </span>
                            <Badge className={tipoConfig.color}>
                              <tipoConfig.icon className="h-3 w-3 mr-1" />
                              {tipoConfig.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDateTime(followUp.created_at)}
                            </span>
                          </div>

                          {followUp.projeto && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <FolderKanban className="h-3 w-3" />
                              <span className="font-medium">
                                {followUp.projeto.nome}
                              </span>
                              {followUp.projeto.cliente && (
                                <span>• {followUp.projeto.cliente.nome}</span>
                              )}
                            </div>
                          )}

                          <p className="text-sm whitespace-pre-wrap">
                            {followUp.conteudo}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">
                  Nenhum follow-up encontrado
                </h3>
                <p className="text-muted-foreground mt-2">
                  {search || traderFilter !== 'all'
                    ? 'Tente ajustar os filtros'
                    : 'Comece adicionando atualizações dos projetos'}
                </p>
                {!search && traderFilter === 'all' && (
                  <Button className="mt-4" onClick={() => setIsOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Follow-up
                  </Button>
                )}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="projetos">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projetosDoTrader.map(projeto => {
              const projetoFollowUps = filteredFollowUps.filter(
                f => f.projeto?.id === projeto.id
              )

              return (
                <Card key={projeto.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{projeto.nome}</CardTitle>
                        <CardDescription>
                          {projeto.cliente?.nome || 'Sem cliente'}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={projeto.status === 'ativo' ? 'default' : 'secondary'}
                      >
                        {projeto.status}
                      </Badge>
                    </div>
                    {projeto.trader && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                        <User className="h-3 w-3" />
                        {projeto.trader.nome}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {projetoFollowUps.length > 0 ? (
                      <>
                        {projetoFollowUps.slice(0, 3).map(followUp => {
                          const tipoConfig = getTipoConfig(followUp.tipo)
                          return (
                            <div
                              key={followUp.id}
                              className="p-2 bg-muted/50 rounded-lg text-sm"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  className={`${tipoConfig.color} text-xs`}
                                >
                                  {tipoConfig.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDateTime(followUp.created_at)}
                                </span>
                              </div>
                              <p className="line-clamp-2">{followUp.conteudo}</p>
                            </div>
                          )
                        })}
                        {projetoFollowUps.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{projetoFollowUps.length - 3} mais atualizações
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum follow-up ainda
                      </p>
                    )}

                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, projeto_id: projeto.id }))
                        setIsOpen(true)
                      }}
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Adicionar
                    </Button>
                  </CardContent>
                </Card>
              )
            })}

            {projetosDoTrader.length === 0 && (
              <Card className="col-span-full p-12">
                <div className="text-center">
                  <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">
                    Nenhum projeto ativo
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    {traderFilter !== 'all'
                      ? 'Este trader não possui projetos ativos'
                      : 'Não há projetos ativos no momento'}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
