"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Users, BookOpen } from "lucide-react"

interface MentionPopupProps {
  query: string
  position: { top: number; left: number }
  onSelect: (mention: { type: "client" | "framework"; name: string; id: string }) => void
  onClose: () => void
}

const mockClients = [
  { id: "c1", name: "TechStart Inc" },
  { id: "c2", name: "Bloom Wellness" },
  { id: "c3", name: "Urban Eats" },
  { id: "c4", name: "GreenPath Solar" },
]

const mockFrameworks = [
  { id: "f1", name: "AIDA Copy" },
  { id: "f2", name: "PAS Framework" },
  { id: "f3", name: "StoryBrand" },
  { id: "f4", name: "Before-After-Bridge" },
]

export function MentionPopup({ query, position, onSelect, onClose }: MentionPopupProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const popupRef = useRef<HTMLDivElement>(null)

  const filteredClients = mockClients.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
  const filteredFrameworks = mockFrameworks.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))

  const allItems = [
    ...filteredClients.map((c) => ({ ...c, type: "client" as const })),
    ...filteredFrameworks.map((f) => ({ ...f, type: "framework" as const })),
  ]

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % allItems.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length)
      } else if (e.key === "Enter" && allItems.length > 0) {
        e.preventDefault()
        const item = allItems[selectedIndex]
        onSelect({ type: item.type, name: item.name, id: item.id })
      } else if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedIndex, onSelect, onClose])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    window.addEventListener("mousedown", handleClickOutside)
    return () => window.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  if (allItems.length === 0) return null

  return (
    <div
      ref={popupRef}
      className="fixed z-50 w-64 overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
      style={{
        bottom: `calc(100vh - ${position.top}px)`,
        left: position.left,
      }}
    >
      {filteredClients.length > 0 && (
        <div className="p-1">
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
            <Users className="h-3 w-3" />
            Clients
          </div>
          {filteredClients.map((client, index) => (
            <button
              key={client.id}
              onClick={() => onSelect({ type: "client", name: client.name, id: client.id })}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                selectedIndex === index ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50",
              )}
            >
              {client.name}
            </button>
          ))}
        </div>
      )}

      {filteredClients.length > 0 && filteredFrameworks.length > 0 && <div className="mx-2 border-t border-border" />}

      {filteredFrameworks.length > 0 && (
        <div className="p-1">
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
            <BookOpen className="h-3 w-3" />
            Frameworks
          </div>
          {filteredFrameworks.map((framework, index) => {
            const adjustedIndex = filteredClients.length + index
            return (
              <button
                key={framework.id}
                onClick={() => onSelect({ type: "framework", name: framework.name, id: framework.id })}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  selectedIndex === adjustedIndex
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-accent/50",
                )}
              >
                {framework.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
