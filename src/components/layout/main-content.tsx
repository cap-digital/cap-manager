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
        // 12px sidebar margin + sidebar width + 16px gap
        isCollapsed ? 'lg:pl-[100px]' : 'lg:pl-[288px]'
      )}
    >
      <main className="min-h-screen p-6">{children}</main>
    </div>
  )
}
