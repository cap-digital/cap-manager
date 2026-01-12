'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
import { useToast } from '@/hooks/use-toast'
import { maskPhone } from '@/lib/utils'
import { Loader2, Mail, MessageSquare, Save } from 'lucide-react'

interface ConfiguracoesData {
  whatsapp: string
  email_notificacoes: string
}

export function ConfiguracoesClient() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<ConfiguracoesData>({
    whatsapp: '',
    email_notificacoes: '',
  })

  useEffect(() => {
    fetchConfiguracoes()
  }, [])

  const fetchConfiguracoes = async () => {
    try {
      const response = await fetch('/api/configuracoes')
      if (!response.ok) {
        throw new Error('Erro ao carregar configurações')
      }

      const data = await response.json()
      setFormData({
        whatsapp: data.whatsapp ? maskPhone(data.whatsapp) : '',
        email_notificacoes: data.email_notificacoes || data.email || '',
      })
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar suas configurações',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.email_notificacoes || !formData.email_notificacoes.includes('@')) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Por favor, informe um email válido para notificações',
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp: formData.whatsapp,
          email_notificacoes: formData.email_notificacoes,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar configurações')
      }

      toast({
        title: 'Sucesso',
        description: 'Configurações salvas com sucesso!',
      })
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar configurações',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>
            Configure seu WhatsApp e email para receber notificações do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* WhatsApp */}
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </Label>
            <Input
              id="whatsapp"
              type="tel"
              placeholder="(00) 00000-0000"
              value={formData.whatsapp}
              onChange={e => setFormData(prev => ({ ...prev, whatsapp: maskPhone(e.target.value) }))}
              maxLength={15}
            />
            <p className="text-sm text-muted-foreground">
              Número do WhatsApp para receber notificações via mensagem
            </p>
          </div>

          {/* Email de Notificações */}
          <div className="space-y-2">
            <Label htmlFor="email_notificacoes" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email para Notificações
            </Label>
            <Input
              id="email_notificacoes"
              type="email"
              placeholder="seu@email.com"
              value={formData.email_notificacoes}
              onChange={e => setFormData(prev => ({ ...prev, email_notificacoes: e.target.value }))}
            />
            <p className="text-sm text-muted-foreground">
              Email onde você deseja receber as notificações do sistema
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
