'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
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
  ChevronRight,
  TrendingUp,
  BarChart3,
  DollarSign,
  ClipboardCheck,
  PieChart,
  Tag,
  Globe,
  FolderKanban,
  UserCog,
  Sun,
  Moon,
  ScrollText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useSidebar } from '@/contexts/sidebar-context'

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

// ------- Navigation data -------

const mainNavigation: NavItem[] = [
  { name: 'Visão Geral', href: '/', icon: LayoutDashboard },
  { name: 'Projetos', href: '/projetos', icon: FolderKanban },
  { name: 'Dashboard', href: '/dashboard-gerencial', icon: BarChart3 },
  { name: 'Agências', href: '/agencias', icon: Building2 },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Contratos', href: '/contratos', icon: ScrollText },
  { name: 'PIs', href: '/pi', icon: FileText },
]

const campanhaSubCategory: NavSubCategory = {
  name: 'Campanha',
  icon: Megaphone,
  items: [
    { name: 'Campanhas', href: '/gestao-trafego', icon: TrendingUp },
    { name: 'Relatórios', href: '/relatorios', icon: FileText },
    { name: 'Faturamento', href: '/faturamento', icon: DollarSign },
  ],
}

const inteligenciaSubCategory: NavSubCategory = {
  name: 'Inteligência',
  icon: PieChart,
  items: [
    { name: 'Projetos', href: '/inteligencia-projetos', icon: FolderKanban },
    { name: 'Dashboards', href: '/dashboards', icon: BarChart3 },
    { name: 'GTM', href: '/gtm', icon: Tag },
    { name: 'Sites/LP', href: '/sites-lp', icon: Globe },
  ],
}

const projetosConcluidosItem: NavItem = {
  name: 'Concluídos',
  href: '/projetos-concluidos',
  icon: ClipboardCheck,
}

const toolsNavigation: NavItem[] = [
  { name: 'Gerador UTM', href: '/utm', icon: Link2 },
  { name: 'Follow-Ups', href: '/follow-up', icon: MessageSquare },
]

interface SidebarProps {
  user: {
    nome: string
    email: string
    avatar_url?: string | null
    role?: 'admin' | 'trader' | 'gestor' | 'cliente'
  } | null
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { setTheme, resolvedTheme } = useTheme()
  const { isCollapsed, setIsCollapsed } = useSidebar()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [campanhaOpen, setCampanhaOpen] = useState(false)
  const [inteligenciaOpen, setInteligenciaOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-expand sections with active items
  useEffect(() => {
    if (campanhaSubCategory.items.some(i => pathname === i.href)) setCampanhaOpen(true)
    if (inteligenciaSubCategory.items.some(i => pathname === i.href)) setInteligenciaOpen(true)
  }, [pathname])

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  // ------- Section label -------
  const SectionLabel = ({ children }: { children: string }) => {
    if (isCollapsed) return <div className="h-4" />
    return (
      <div className="px-3 pt-6 pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {children}
        </span>
      </div>
    )
  }

  // ------- Nav link -------
  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href

    const content = (
      <Link
        href={item.href}
        onClick={() => setIsMobileOpen(false)}
        className={cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <item.icon className={cn(
          'h-[18px] w-[18px] shrink-0 transition-colors',
          isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
        )} />
        {!isCollapsed && <span className="truncate">{item.name}</span>}
      </Link>
    )

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.name}
          </TooltipContent>
        </Tooltip>
      )
    }

    return content
  }

  // ------- Sub-category (expanded mode) -------
  const SubCategoryExpanded = ({
    subCategory,
    isOpen,
    onToggle,
  }: {
    subCategory: NavSubCategory
    isOpen: boolean
    onToggle: () => void
  }) => {
    const hasActiveItem = subCategory.items.some(item => pathname === item.href)

    return (
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'flex items-center justify-between w-full px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ml-3',
              hasActiveItem
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="flex items-center gap-3">
              <subCategory.icon className="h-4 w-4 shrink-0" />
              <span>{subCategory.name}</span>
            </div>
            <ChevronRight
              className={cn(
                'h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200',
                isOpen && 'rotate-90'
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-0.5">
          <div className="ml-6 border-l border-border/50 pl-3 space-y-0.5">
            {subCategory.items.map(item => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <span className={cn(
                    'h-1.5 w-1.5 rounded-full shrink-0',
                    isActive ? 'bg-primary' : 'bg-muted-foreground/30'
                  )} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  // ------- Sub-category (collapsed — popover flyout with sub-items) -------
  const SubCategoryCollapsed = ({
    subCategory,
    extraItems,
  }: {
    subCategory: NavSubCategory
    extraItems?: NavItem[]
  }) => {
    const allItems = [...subCategory.items, ...(extraItems || [])]
    const hasActiveItem = allItems.some(item => pathname === item.href)

    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'flex items-center justify-center w-full rounded-xl px-3 py-2.5 transition-all duration-200',
              hasActiveItem
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <subCategory.icon className="h-[18px] w-[18px]" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          sideOffset={12}
          className="w-48 p-1.5"
        >
          <div className="mb-1 px-2.5 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {subCategory.name}
            </span>
          </div>
          <div className="space-y-0.5">
            {allItems.map(item => {
              const isActive = pathname === item.href
              const isGreen = item.href === projetosConcluidosItem.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150',
                    isGreen
                      ? isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium'
                        : 'text-emerald-600/70 dark:text-emerald-400/70 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/5'
                      : isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <TooltipProvider>
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar — floating with margins */}
      <aside
        className={cn(
          'fixed z-40 transition-all duration-300 ease-in-out',
          'top-3 left-3 h-[calc(100vh-24px)] rounded-2xl',
          'bg-card/80 backdrop-blur-xl border border-border/40 shadow-lg shadow-black/5 dark:shadow-black/20',
          isCollapsed ? 'w-[72px]' : 'w-[260px]',
          isMobileOpen ? 'translate-x-0' : '-translate-x-[calc(100%+24px)] lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo + collapse */}
          <div className={cn(
            'flex items-center h-14 px-4',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}>
            {!isCollapsed && (
              <Link href="/" className="flex items-center">
                {mounted && (
                  <Image
                    src={resolvedTheme === 'dark' ? '/images/CAPCO_ORANGE.png' : '/images/CAPCO_OFFBLACK.png'}
                    alt="CAP Manager"
                    width={120}
                    height={36}
                    className="h-7 w-auto"
                    priority
                  />
                )}
              </Link>
            )}
            {isCollapsed && mounted && (
              <Link href="/" className="flex items-center">
                <Image
                  src={resolvedTheme === 'dark' ? '/images/CAP_ORANGE.png' : '/images/CAP_GREY.png'}
                  alt="CAP"
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                  priority
                />
              </Link>
            )}
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setIsCollapsed(true)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* User profile card */}
          <div className={cn('px-3 pb-2', isCollapsed && 'px-2')}>
            <div className={cn(
              'flex items-center gap-3 rounded-xl p-2.5 bg-muted/50',
              isCollapsed && 'justify-center p-2'
            )}>
              <div className="relative">
                <Avatar className={cn('ring-2 ring-background', isCollapsed ? 'h-8 w-8' : 'h-9 w-9')}>
                  <AvatarImage src={user?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                    {user?.nome?.slice(0, 2).toUpperCase() || 'US'}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{user?.nome || 'Usuário'}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 overflow-y-auto scrollbar-thin">
            <SectionLabel>Principal</SectionLabel>
            <div className="space-y-0.5">
              {mainNavigation.map(item => (
                <NavLink key={item.name} item={item} />
              ))}
            </div>

            {/* Gestão de Projetos */}
            <SectionLabel>Gestão de Projetos</SectionLabel>
            <div className="space-y-0.5">
              {!isCollapsed ? (
                <>
                  <SubCategoryExpanded
                    subCategory={campanhaSubCategory}
                    isOpen={campanhaOpen}
                    onToggle={() => setCampanhaOpen(!campanhaOpen)}
                  />
                  <SubCategoryExpanded
                    subCategory={inteligenciaSubCategory}
                    isOpen={inteligenciaOpen}
                    onToggle={() => setInteligenciaOpen(!inteligenciaOpen)}
                  />
                  <Link
                    href={projetosConcluidosItem.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ml-3',
                      pathname === projetosConcluidosItem.href
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'text-emerald-600/70 dark:text-emerald-400/70 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/5'
                    )}
                  >
                    <projetosConcluidosItem.icon className="h-4 w-4 shrink-0" />
                    <span>{projetosConcluidosItem.name}</span>
                  </Link>
                </>
              ) : (
                <>
                  <SubCategoryCollapsed subCategory={campanhaSubCategory} />
                  <SubCategoryCollapsed
                    subCategory={inteligenciaSubCategory}
                    extraItems={[projetosConcluidosItem]}
                  />
                </>
              )}
            </div>

            {/* Ferramentas */}
            <SectionLabel>Ferramentas</SectionLabel>
            <div className="space-y-0.5">
              {toolsNavigation.map(item => (
                <NavLink key={item.name} item={item} />
              ))}
            </div>

            {/* Admin */}
            {user?.role === 'admin' && (
              <>
                <SectionLabel>Admin</SectionLabel>
                <NavLink item={{ name: 'Usuários', href: '/usuarios', icon: UserCog }} />
              </>
            )}
          </nav>

          {/* Bottom section */}
          <div className="border-t border-border/30 mx-3" />
          <div className="px-2 py-2 space-y-0.5">
            {/* Theme toggle */}
            {isCollapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                    className="flex items-center justify-center w-full rounded-xl px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                  >
                    {mounted && resolvedTheme === 'dark' ? (
                      <Sun className="h-[18px] w-[18px]" />
                    ) : mounted ? (
                      <Moon className="h-[18px] w-[18px]" />
                    ) : (
                      <div className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {mounted && resolvedTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
              >
                {mounted && resolvedTheme === 'dark' ? (
                  <Sun className="h-[18px] w-[18px] shrink-0" />
                ) : mounted ? (
                  <Moon className="h-[18px] w-[18px] shrink-0" />
                ) : (
                  <div className="h-[18px] w-[18px] shrink-0" />
                )}
                <span>{mounted && resolvedTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
              </button>
            )}

            {/* Settings */}
            {isCollapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    href="/configuracoes"
                    className={cn(
                      'flex items-center justify-center rounded-xl px-3 py-2.5 transition-all duration-200',
                      pathname === '/configuracoes'
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Settings className="h-[18px] w-[18px]" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Configurações</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                href="/configuracoes"
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  pathname === '/configuracoes'
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Settings className="h-[18px] w-[18px] shrink-0" />
                <span>Configurações</span>
              </Link>
            )}

            {/* Sign out */}
            {isCollapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center justify-center w-full rounded-xl px-3 py-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                  >
                    <LogOut className="h-[18px] w-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Sair</TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
              >
                <LogOut className="h-[18px] w-[18px] shrink-0" />
                <span>Sair</span>
              </button>
            )}

            {/* Expand (collapsed only) */}
            {isCollapsed && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsCollapsed(false)}
                    className="hidden lg:flex items-center justify-center w-full rounded-xl px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                  >
                    <ChevronRight className="h-[18px] w-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Expandir</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
