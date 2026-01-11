"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Users, FileText, Wand2 } from "lucide-react"

interface MentionPopupProps {
  query: string
  position: { top: number; left: number }
  onSelect: (mention: { type: "client" | "content-type" | "writing-framework"; name: string; id: string }) => void
  onClose: () => void
  clients: Array<{ id: string; name: string }>
  contentTypes: Array<{ id: string; name: string; category: string }>
  writingFrameworks: Array<{ id: string; name: string; category: string }>
}

type MentionItem = {
  type: "client" | "content-type" | "writing-framework"
  id: string
  name: string
}

export function MentionPopup({
  query,
  position,
  onSelect,
  onClose,
  clients,
  contentTypes,
  writingFrameworks,
}: MentionPopupProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const popupRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current
    if (!container) return
    
    const { scrollTop, scrollHeight, clientHeight } = container
    const isScrollable = scrollHeight > clientHeight
    
    if (isScrollable) {
      const isAtTop = scrollTop <= 0
      const isAtBottom = scrollTop + clientHeight >= scrollHeight
      
      // Only allow scroll if not at boundaries OR scrolling away from boundary
      const scrollingUp = e.deltaY < 0
      const scrollingDown = e.deltaY > 0
      
      if ((isAtTop && scrollingUp) || (isAtBottom && scrollingDown)) {
        e.preventDefault()
      }
    } else {
      // Not scrollable, prevent all wheel
      e.preventDefault()
    }
    
    e.stopPropagation()
  }

  // Filter items based on query
  const lowerQuery = query.toLowerCase()
  
  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(lowerQuery)
  )
  const filteredContentTypes = contentTypes.filter((ct) =>
    ct.name.toLowerCase().includes(lowerQuery)
  )
  const filteredFrameworks = writingFrameworks.filter((f) =>
    f.name.toLowerCase().includes(lowerQuery)
  )

  // Build flat list for keyboard navigation
  const allItems: MentionItem[] = [
    ...filteredClients.map((c) => ({ type: "client" as const, name: c.name, id: c.id })),
    ...filteredContentTypes.map((ct) => ({ type: "content-type" as const, name: ct.name, id: ct.id })),
    ...filteredFrameworks.map((f) => ({ type: "writing-framework" as const, name: f.name, id: f.id })),
  ]

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Scroll selected item into view
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" })
  }, [selectedIndex])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, allItems.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === "Enter" && allItems.length > 0) {
        e.preventDefault()
        onSelect(allItems[selectedIndex])
      } else if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedIndex, allItems, onSelect, onClose])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    window.addEventListener("mousedown", handleClickOutside)
    return () => window.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  // Prevent touch scroll leak on mobile
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return
    
    const preventScroll = (e: TouchEvent) => {
      e.stopPropagation()
    }
    
    scrollContainer.addEventListener('touchmove', preventScroll, { passive: false })
    return () => scrollContainer.removeEventListener('touchmove', preventScroll)
  }, [])

  if (allItems.length === 0) {
    return (
      <div
        ref={popupRef}
        className="fixed z-50 w-64 rounded-lg border border-border bg-popover p-3 shadow-lg"
        style={{
          bottom: `calc(100vh - ${position.top}px)`,
          left: position.left,
        }}
      >
        <p className="text-sm text-muted-foreground">No results found</p>
      </div>
    )
  }

  let globalIndex = 0

  return (
    <div
      ref={popupRef}
      className="fixed z-50 w-64 overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
      style={{
        bottom: `calc(100vh - ${position.top}px)`,
        left: position.left,
        maxHeight: "300px",
      }}
      onWheel={(e) => e.stopPropagation()}
    >
      <div 
        ref={scrollContainerRef}
        className="max-h-[300px] overflow-y-auto overscroll-none"
        onWheel={handleWheel}
      >
        {/* Clients Section */}
        {filteredClients.length > 0 && (
          <div>
            <div className="sticky top-0 flex items-center gap-2 bg-popover px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border/50">
              <Users className="h-3 w-3" />
              Clients
            </div>
            <div className="py-1">
              {filteredClients.map((client) => {
                const index = globalIndex++
                const isSelected = selectedIndex === index
                return (
                  <button
                    key={client.id}
                    ref={isSelected ? selectedRef : null}
                    onClick={() => onSelect({ type: "client", name: client.name, id: client.id })}
                    className={cn(
                      "flex w-full items-center px-3 py-1.5 text-sm transition-colors",
                      isSelected
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent/50"
                    )}
                  >
                    {client.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Content Types Section */}
        {filteredContentTypes.length > 0 && (
          <div>
            <div className="sticky top-0 flex items-center gap-2 bg-popover px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border/50">
              <FileText className="h-3 w-3" />
              Content Types
            </div>
            <div className="py-1">
              {filteredContentTypes.map((ct) => {
                const index = globalIndex++
                const isSelected = selectedIndex === index
                return (
                  <button
                    key={ct.id}
                    ref={isSelected ? selectedRef : null}
                    onClick={() => onSelect({ type: "content-type", name: ct.name, id: ct.id })}
                    className={cn(
                      "flex w-full items-center px-3 py-1.5 text-sm transition-colors",
                      isSelected
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent/50"
                    )}
                  >
                    {ct.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Writing Frameworks Section */}
        {filteredFrameworks.length > 0 && (
          <div>
            <div className="sticky top-0 flex items-center gap-2 bg-popover px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border/50">
              <Wand2 className="h-3 w-3" />
              Writing Frameworks
            </div>
            <div className="py-1">
              {filteredFrameworks.map((fw) => {
                const index = globalIndex++
                const isSelected = selectedIndex === index
                return (
                  <button
                    key={fw.id}
                    ref={isSelected ? selectedRef : null}
                    onClick={() => onSelect({ type: "writing-framework", name: fw.name, id: fw.id })}
                    className={cn(
                      "flex w-full items-center px-3 py-1.5 text-sm transition-colors",
                      isSelected
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent/50"
                    )}
                  >
                    {fw.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
