'use client'

import { useSidebar } from '@/contexts/sidebar-context'
import { cn } from '@/lib/utils'

interface MainContentProps {
  children: React.ReactNode
}

export function MainContent({ children }: MainContentProps) {
  const { isCollapsed } = useSidebar()

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-in-out',
        isCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      )}
    >
      <main className="min-h-screen p-6">{children}</main>
    </div>
  )
}
