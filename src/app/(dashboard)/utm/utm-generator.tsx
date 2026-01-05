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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  Copy,
  Link2,
  ExternalLink,
  Trash2,
  Check,
  Loader2,
  History,
} from 'lucide-react'
import { generateUTM } from '@/lib/utils'

interface UTMGeneratorProps {
  projetos: {
    id: number
    nome: string
    cliente: { nome: string } | null
  }[]
  utmConfigs: {
    id: number
    projeto_id: number | null
    projeto: { id: number; nome: string } | null
    utm_source: string
    utm_medium: string
    utm_campaign: string
    utm_term: string | null
    utm_content: string | null
    url_destino: string
    url_gerada: string
    created_at: string
  }[]
}

const sourceOptions = [
  { value: 'google', label: 'Google' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'email', label: 'E-mail' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'newsletter', label: 'Newsletter' },
]

const mediumOptions = [
  { value: 'cpc', label: 'CPC (Custo por Clique)' },
  { value: 'cpm', label: 'CPM (Custo por Mil)' },
  { value: 'social', label: 'Social' },
  { value: 'email', label: 'E-mail' },
  { value: 'display', label: 'Display' },
  { value: 'video', label: 'Vídeo' },
  { value: 'affiliate', label: 'Afiliado' },
  { value: 'referral', label: 'Referência' },
  { value: 'organic', label: 'Orgânico' },
]

export function UTMGenerator({ projetos, utmConfigs: initialConfigs }: UTMGeneratorProps) {
  const [utmConfigs, setUtmConfigs] = useState(initialConfigs)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    projeto_id: '',
    url_destino: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: '',
  })
  const [generatedUrl, setGeneratedUrl] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  const handleGenerateUTM = () => {
    if (!formData.url_destino || !formData.utm_source || !formData.utm_medium || !formData.utm_campaign) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Preencha URL, Source, Medium e Campaign',
      })
      return
    }

    try {
      const url = generateUTM({
        url: formData.url_destino,
        source: formData.utm_source,
        medium: formData.utm_medium,
        campaign: formData.utm_campaign,
        term: formData.utm_term || undefined,
        content: formData.utm_content || undefined,
      })
      setGeneratedUrl(url)
    } catch {
      toast({
        variant: 'destructive',
        title: 'URL inválida',
        description: 'Verifique se a URL de destino é válida',
      })
    }
  }

  const handleSaveUTM = async () => {
    if (!generatedUrl) {
      toast({
        variant: 'destructive',
        title: 'Gere a URL primeiro',
      })
      return
    }

    setIsLoading(true)

    try {
      const payload = {
        projeto_id: formData.projeto_id || null,
        url_destino: formData.url_destino,
        utm_source: formData.utm_source,
        utm_medium: formData.utm_medium,
        utm_campaign: formData.utm_campaign,
        utm_term: formData.utm_term || null,
        utm_content: formData.utm_content || null,
        url_gerada: generatedUrl,
      }

      const response = await fetch('/api/utms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Erro ao salvar UTM')

      toast({ title: 'UTM salva com sucesso!' })

      // Limpar formulário
      setFormData({
        projeto_id: '',
        url_destino: '',
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        utm_term: '',
        utm_content: '',
      })
      setGeneratedUrl('')
      // Refresh lista de UTMs
      const response2 = await fetch('/api/utms')
      if (response2.ok) {
        const data = await response2.json()
        setUtmConfigs(data)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro'
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async (text: string, id?: number | string) => {
    await navigator.clipboard.writeText(text)
    setCopied(id !== undefined ? String(id) : 'main')
    setTimeout(() => setCopied(null), 2000)
    toast({ title: 'Copiado!' })
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta UTM?')) return

    try {
      const response = await fetch(`/api/utms?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Erro ao excluir')

      setUtmConfigs(prev => prev.filter(u => u.id !== id))
      toast({ title: 'UTM excluída!' })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
      })
    }
  }

  const handleProjetoSelect = (projetoId: string) => {
    const projeto = projetos.find(p => String(p.id) === projetoId)
    if (projeto) {
      setFormData(prev => ({
        ...prev,
        projeto_id: projetoId,
        utm_campaign: projeto.nome.toLowerCase().replace(/\s+/g, '-'),
      }))
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Gerador */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Gerador de UTM
            </CardTitle>
            <CardDescription>
              Crie URLs com parâmetros UTM para rastrear seus projetos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projeto">Projeto (opcional)</Label>
              <Select
                value={formData.projeto_id}
                onValueChange={handleProjetoSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vincular a um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projetos.map(projeto => (
                    <SelectItem key={projeto.id} value={String(projeto.id)}>
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
              <Label htmlFor="url_destino">URL de Destino *</Label>
              <Input
                id="url_destino"
                type="url"
                placeholder="https://seusite.com.br/pagina"
                value={formData.url_destino}
                onChange={e =>
                  setFormData(prev => ({ ...prev, url_destino: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="utm_source">Source *</Label>
                <Select
                  value={formData.utm_source}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, utm_source: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="utm_medium">Medium *</Label>
                <Select
                  value={formData.utm_medium}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, utm_medium: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {mediumOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="utm_campaign">Campaign *</Label>
              <Input
                id="utm_campaign"
                placeholder="nome-do-projeto"
                value={formData.utm_campaign}
                onChange={e =>
                  setFormData(prev => ({ ...prev, utm_campaign: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="utm_term">Term (opcional)</Label>
                <Input
                  id="utm_term"
                  placeholder="palavras-chave"
                  value={formData.utm_term}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, utm_term: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="utm_content">Content (opcional)</Label>
                <Input
                  id="utm_content"
                  placeholder="variacao-anuncio"
                  value={formData.utm_content}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, utm_content: e.target.value }))
                  }
                />
              </div>
            </div>

            <Button onClick={handleGenerateUTM} className="w-full">
              <Link2 className="h-4 w-4 mr-2" />
              Gerar URL
            </Button>

            {generatedUrl && (
              <div className="space-y-3 pt-4 border-t">
                <Label>URL Gerada</Label>
                <div className="p-3 bg-muted rounded-lg break-all text-sm">
                  {generatedUrl}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleCopy(generatedUrl)}
                  >
                    {copied === 'main' ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copiar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(generatedUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleSaveUTM} disabled={isLoading}>
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Salvar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de UTMs
            </CardTitle>
            <CardDescription>Últimas URLs geradas</CardDescription>
          </CardHeader>
          <CardContent>
            {utmConfigs.length > 0 ? (
              <div className="space-y-3">
                {utmConfigs.map(config => (
                  <div
                    key={config.id}
                    className="p-3 border rounded-lg space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {config.projeto && (
                          <p className="text-sm font-medium truncate">
                            {config.projeto.nome}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground break-all line-clamp-1">
                          {config.url_gerada}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopy(config.url_gerada, config.id)}
                        >
                          {copied === String(config.id) ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100"
                          onClick={() => handleDelete(config.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        {config.utm_source}
                      </span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        {config.utm_medium}
                      </span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        {config.utm_campaign}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma UTM gerada ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
