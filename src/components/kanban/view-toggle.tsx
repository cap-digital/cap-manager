'use client'

import { LayoutGrid, List, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ViewMode = 'kanban' | 'list' | 'table'

interface ViewToggleProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 px-3 gap-2',
          currentView === 'kanban' && 'bg-background shadow-sm'
        )}
        onClick={() => onViewChange('kanban')}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Kanban</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 px-3 gap-2',
          currentView === 'list' && 'bg-background shadow-sm'
        )}
        onClick={() => onViewChange('list')}
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">Lista</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 px-3 gap-2',
          currentView === 'table' && 'bg-background shadow-sm'
        )}
        onClick={() => onViewChange('table')}
      >
        <Table2 className="h-4 w-4" />
        <span className="hidden sm:inline">Tabela</span>
      </Button>
    </div>
  )
}
