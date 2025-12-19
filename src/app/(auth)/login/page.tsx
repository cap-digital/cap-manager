'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkSetup()
  }, [])

  const checkSetup = async () => {
    try {
      const response = await fetch('/api/setup', {
        cache: 'no-store',
      })

      // Se der erro de conexão, mostrar login mesmo assim
      if (!response.ok) {
        console.error('Erro ao verificar setup:', response.status)
        setIsChecking(false)
        return
      }

      const data = await response.json()

      // Só redirecionar para setup se explicitamente não tiver admin
      if (data.hasAdmin === false) {
        router.push('/setup')
        return
      }
    } catch (error) {
      // Em caso de erro de rede, mostrar login
      console.error('Erro de rede ao verificar setup:', error)
    }
    setIsChecking(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao entrar',
          description: result.error,
        })
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Ocorreu um erro ao fazer login',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-lg">Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <span className="text-primary-foreground font-bold text-2xl">C</span>
            </div>
            <span className="font-bold text-3xl">CAP Manager</span>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Entrar</CardTitle>
            <CardDescription>
              Entre com seu e-mail e senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
