'use client'

import { FileText, Bot, MessageSquare } from 'lucide-react'

interface ProjectRelationsProps {
  contentCount: number
  aiCount: number
  capturesCount: number
}

export function ProjectRelations({ contentCount, aiCount, capturesCount }: ProjectRelationsProps) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  
  const relations = [
    { id: 'content-section', icon: FileText, count: contentCount, label: 'Content' },
    { id: 'ai-section', icon: Bot, count: aiCount, label: 'AI Generations' },
    { id: 'captures-section', icon: MessageSquare, count: capturesCount, label: 'Captures' },
  ]
  
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Jump to section">
      {relations.map((rel) => (
        <button
          key={rel.id}
          onClick={() => scrollTo(rel.id)}
          aria-label={`Jump to ${rel.label} section (${rel.count} items)`}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full 
                     bg-muted hover:bg-muted/80 transition-colors text-sm
                     hover:ring-2 hover:ring-ring/20 active:scale-[0.98]
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <rel.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="font-medium">{rel.count}</span>
          <span className="text-muted-foreground">{rel.label}</span>
        </button>
      ))}
    </nav>
  )
}
