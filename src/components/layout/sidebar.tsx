'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  Building2,
  Megaphone,
  Link2,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  BarChart3,
  DollarSign,
  ClipboardCheck,
  PieChart,
  Tag,
  Globe,
  FolderKanban,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavSubCategory {
  name: string
  icon: React.ComponentType<{ className?: string }>
  items: NavItem[]
}

// Itens principais (sem categoria)
const mainNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Agências', href: '/agencias', icon: Building2 },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'PIs', href: '/pi', icon: FileText },
]

// Subcategorias dentro de Gestão de Projetos
const campanhaSubCategory: NavSubCategory = {
  name: 'Campanha',
  icon: Megaphone,
  items: [
    { name: 'Gestão de Tráfego', href: '/gestao-trafego', icon: TrendingUp },
    { name: 'Faturamento', href: '/faturamento', icon: DollarSign },
  ],
}

// Item especial para Projetos Finalizados (fora das subcategorias, dentro de Gestão de Projetos)
const projetosFinalizadosItem: NavItem = {
  name: 'Projetos Finalizados',
  href: '/projetos-finalizados',
  icon: ClipboardCheck,
}

const inteligenciaSubCategory: NavSubCategory = {
  name: 'Inteligência',
  icon: PieChart,
  items: [
    { name: 'Dashboards', href: '/dashboards', icon: BarChart3 },
    { name: 'GTM', href: '/gtm', icon: Tag },
    { name: 'Sites/LP', href: '/sites-lp', icon: Globe },
    { name: 'Projetos', href: '/projetos', icon: FolderKanban },
  ],
}

// Itens secundários (fora de categorias)
const secondaryNavigation: NavItem[] = [
  { name: 'Gerador UTM', href: '/utm', icon: Link2 },
  { name: 'Follow-up', href: '/follow-up', icon: MessageSquare },
]

interface SidebarProps {
  user: {
    nome: string
    email: string
    avatar_url?: string | null
  } | null
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [gestaoprojetosOpen, setGestaoprojetosOpen] = useState(true)
  const [campanhaOpen, setCampanhaOpen] = useState(true)
  const [inteligenciaOpen, setInteligenciaOpen] = useState(true)

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  // Verifica se algum item dentro de Gestão de Projetos está ativo
  const isGestaoprojetosActive = () => {
    const allItems = [...campanhaSubCategory.items, ...inteligenciaSubCategory.items, projetosFinalizadosItem]
    return allItems.some(item => pathname === item.href)
  }

  // Componente para renderizar um item de navegação
  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href
    return (
      <Link
        href={item.href}
        onClick={() => setIsMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {!isCollapsed && <span>{item.name}</span>}
      </Link>
    )
  }

  // Componente para renderizar uma subcategoria
  const SubCategoryComponent = ({
    subCategory,
    isOpen,
    onToggle,
    indentLevel = 1
  }: {
    subCategory: NavSubCategory
    isOpen: boolean
    onToggle: () => void
    indentLevel?: number
  }) => {
    const hasActiveItem = subCategory.items.some(item => pathname === item.href)

    return (
      <Collapsible open={isOpen && !isCollapsed} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              hasActiveItem
                ? 'text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              indentLevel === 1 && 'ml-4'
            )}
          >
            <div className="flex items-center gap-3">
              <subCategory.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>{subCategory.name}</span>}
            </div>
            {!isCollapsed && (
              <ChevronRight
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  isOpen && 'rotate-90'
                )}
              />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 mt-1">
          {subCategory.items.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  'ml-8'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen bg-card border-r transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-20' : 'w-72',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            {!isCollapsed && (
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">C</span>
                </div>
                <span className="font-bold text-xl">CAP Manager</span>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <ChevronLeft
                className={cn(
                  'h-5 w-5 transition-transform',
                  isCollapsed && 'rotate-180'
                )}
              />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {/* Main navigation items */}
            {mainNavigation.map(item => (
              <NavLink key={item.name} item={item} />
            ))}

            {/* Gestão de Projetos - Categoria Principal */}
            <Collapsible open={gestaoprojetosOpen && !isCollapsed} onOpenChange={() => setGestaoprojetosOpen(!gestaoprojetosOpen)}>
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    'flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isGestaoprojetosActive()
                      ? 'text-primary bg-primary/5'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <FolderKanban className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span>Gestão de Projetos</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform duration-200',
                        gestaoprojetosOpen && 'rotate-180'
                      )}
                    />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {/* Campanha Subcategory */}
                <SubCategoryComponent
                  subCategory={campanhaSubCategory}
                  isOpen={campanhaOpen}
                  onToggle={() => setCampanhaOpen(!campanhaOpen)}
                />

                {/* Inteligência Subcategory */}
                <SubCategoryComponent
                  subCategory={inteligenciaSubCategory}
                  isOpen={inteligenciaOpen}
                  onToggle={() => setInteligenciaOpen(!inteligenciaOpen)}
                />

                {/* Projetos Finalizados - Item direto com cor diferente */}
                <Link
                  href={projetosFinalizadosItem.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ml-4',
                    pathname === projetosFinalizadosItem.href
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                  )}
                >
                  <projetosFinalizadosItem.icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span>{projetosFinalizadosItem.name}</span>}
                </Link>
              </CollapsibleContent>
            </Collapsible>

            {/* Secondary navigation items */}
            {secondaryNavigation.map(item => (
              <NavLink key={item.name} item={item} />
            ))}
          </nav>

          {/* User menu */}
          <div className="border-t p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-3 px-3',
                    isCollapsed && 'justify-center px-0'
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar_url || undefined} />
                    <AvatarFallback>
                      {user?.nome?.slice(0, 2).toUpperCase() || 'US'}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-medium truncate max-w-[140px]">
                        {user?.nome || 'Usuário'}
                      </span>
                      <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                        {user?.email}
                      </span>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/configuracoes" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
    </>
  )
}
