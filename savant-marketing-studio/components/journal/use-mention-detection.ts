"use client"

import { useCallback, useRef, useState } from "react"

// =============================================================================
// Types
// =============================================================================

export type MentionType = "client" | "project" | "content" | "page"

export interface MentionEntity {
  id: string
  name: string
}

export interface MentionedIds {
  clientIds: string[]
  projectIds: string[]
  contentIds: string[]
  pageIds: string[]
}

export interface CursorPosition {
  top: number
  left: number
}

export interface UseMentionDetectionOptions {
  /**
   * Ref to the textarea element where mentions are detected
   */
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  /**
   * Called when a mention trigger (@) is detected
   * @param searchQuery - The text after the @ symbol
   * @param cursorPosition - Approximate position of the cursor for popover placement
   */
  onMentionTrigger: (searchQuery: string, cursorPosition: CursorPosition) => void
  /**
   * Called when mention mode should be closed (e.g., space typed, escape pressed)
   */
  onMentionClose: () => void
  /**
   * Get the current text value (for controlled inputs)
   */
  getValue: () => string
  /**
   * Set the text value (for controlled inputs)
   */
  setValue: (value: string) => void
}

export interface UseMentionDetectionReturn {
  /**
   * Handle keydown events on the textarea
   * Pass this to the onKeyDown prop of your textarea
   */
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  /**
   * Handle change events on the textarea
   * Pass this to the onChange prop of your textarea
   */
  handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  /**
   * Insert a mention at the current @ position
   * @param type - The type of mention
   * @param entity - The entity being mentioned (must have id and name)
   */
  insertMention: (type: MentionType, entity: MentionEntity) => void
  /**
   * Get all mentioned entity IDs from the tracked mentions
   */
  getMentionedIds: () => MentionedIds
  /**
   * Clear all tracked mentions (call when form is submitted/reset)
   */
  clearMentions: () => void
  /**
   * Check if mention detection is currently active
   */
  isMentionActive: boolean
  /**
   * Current search query (text after @)
   */
  mentionSearchQuery: string
}

// =============================================================================
// Helper: Get caret coordinates in a textarea
// =============================================================================

function getCaretCoordinates(
  element: HTMLTextAreaElement,
  position: number
): { top: number; left: number; height: number } {
  // Create a mirror div to calculate position
  const mirror = document.createElement("div")
  const computed = window.getComputedStyle(element)

  // Copy styles that affect text layout
  const stylesToCopy = [
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "letter-spacing",
    "text-transform",
    "word-spacing",
    "text-indent",
    "white-space",
    "word-wrap",
    "word-break",
    "overflow-wrap",
    "line-height",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "border-top-width",
    "border-right-width",
    "border-bottom-width",
    "border-left-width",
    "box-sizing",
  ]

  mirror.style.position = "absolute"
  mirror.style.visibility = "hidden"
  mirror.style.whiteSpace = "pre-wrap"
  mirror.style.overflow = "hidden"

  for (const style of stylesToCopy) {
    mirror.style.setProperty(style, computed.getPropertyValue(style))
  }

  mirror.style.width = `${element.offsetWidth}px`

  // Copy text up to cursor position
  const textBeforeCursor = element.value.substring(0, position)
  mirror.textContent = textBeforeCursor

  // Add a span at the cursor position to get coordinates
  const cursorSpan = document.createElement("span")
  cursorSpan.textContent = "|"
  mirror.appendChild(cursorSpan)

  document.body.appendChild(mirror)

  const rect = element.getBoundingClientRect()
  const spanRect = cursorSpan.getBoundingClientRect()
  const mirrorRect = mirror.getBoundingClientRect()

  const coordinates = {
    top: spanRect.top - mirrorRect.top + rect.top - element.scrollTop,
    left: spanRect.left - mirrorRect.left + rect.left - element.scrollLeft,
    height: parseFloat(computed.lineHeight) || parseFloat(computed.fontSize) * 1.2,
  }

  document.body.removeChild(mirror)

  return coordinates
}

// =============================================================================
// Hook
// =============================================================================

export function useMentionDetection(
  options: UseMentionDetectionOptions
): UseMentionDetectionReturn {
  const { inputRef, onMentionTrigger, onMentionClose, getValue, setValue } = options

  // Track mentioned entities
  const mentionedClientIds = useRef<Set<string>>(new Set())
  const mentionedProjectIds = useRef<Set<string>>(new Set())
  const mentionedContentIds = useRef<Set<string>>(new Set())
  const mentionedPageIds = useRef<Set<string>>(new Set())

  // Track mention state
  const [isMentionActive, setIsMentionActive] = useState(false)
  const [mentionSearchQuery, setMentionSearchQuery] = useState("")

  // Track the @ position for insertion
  const atPositionRef = useRef<number>(-1)

  /**
   * Detect @ trigger and update state
   */
  const detectMention = useCallback(
    (value: string, cursorPos: number) => {
      const textBeforeCursor = value.slice(0, cursorPos)
      const atIndex = textBeforeCursor.lastIndexOf("@")

      if (atIndex !== -1) {
        const textAfterAt = textBeforeCursor.slice(atIndex + 1)
        // Only trigger if:
        // 1. @ is at start, after space, or after newline
        // 2. No space or newline in the search query yet
        const charBeforeAt = atIndex > 0 ? textBeforeCursor[atIndex - 1] : " "
        const isValidTrigger =
          charBeforeAt === " " || charBeforeAt === "\n" || atIndex === 0
        const hasNoBreaks = !textAfterAt.includes(" ") && !textAfterAt.includes("\n")

        if (isValidTrigger && hasNoBreaks) {
          atPositionRef.current = atIndex
          setMentionSearchQuery(textAfterAt)
          setIsMentionActive(true)

          // Calculate cursor position for popover
          if (inputRef.current) {
            try {
              const coords = getCaretCoordinates(inputRef.current, cursorPos)
              onMentionTrigger(textAfterAt, {
                top: coords.top + coords.height + 4,
                left: coords.left,
              })
            } catch {
              // Fallback position if calculation fails
              const rect = inputRef.current.getBoundingClientRect()
              onMentionTrigger(textAfterAt, {
                top: rect.bottom + 4,
                left: rect.left,
              })
            }
          }
          return
        }
      }

      // No valid mention trigger found
      if (isMentionActive) {
        setIsMentionActive(false)
        setMentionSearchQuery("")
        atPositionRef.current = -1
        onMentionClose()
      }
    },
    [inputRef, onMentionTrigger, onMentionClose, isMentionActive]
  )

  /**
   * Handle textarea change events
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value
      const cursorPos = e.target.selectionStart ?? 0

      // Let parent component update value first
      setValue(value)

      // Detect mentions
      detectMention(value, cursorPos)
    },
    [detectMention, setValue]
  )

  /**
   * Handle keydown events
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Close mention on Escape
      if (e.key === "Escape" && isMentionActive) {
        e.preventDefault()
        setIsMentionActive(false)
        setMentionSearchQuery("")
        atPositionRef.current = -1
        onMentionClose()
        return
      }

      // Close mention on space (but don't prevent default)
      if (e.key === " " && isMentionActive) {
        setIsMentionActive(false)
        setMentionSearchQuery("")
        atPositionRef.current = -1
        onMentionClose()
      }
    },
    [isMentionActive, onMentionClose]
  )

  /**
   * Insert a mention at the @ position
   */
  const insertMention = useCallback(
    (type: MentionType, entity: MentionEntity) => {
      const currentValue = getValue()
      const atIndex = atPositionRef.current
      const cursorPos = inputRef.current?.selectionStart ?? currentValue.length

      if (atIndex === -1) return

      // Build the new text
      const before = currentValue.slice(0, atIndex)
      const after = currentValue.slice(cursorPos)
      const mentionText = `@${entity.name} `
      const newValue = `${before}${mentionText}${after}`

      // Update value
      setValue(newValue)

      // Track the mention by type
      switch (type) {
        case "client":
          mentionedClientIds.current.add(entity.id)
          break
        case "project":
          mentionedProjectIds.current.add(entity.id)
          break
        case "content":
          mentionedContentIds.current.add(entity.id)
          break
        case "page":
          mentionedPageIds.current.add(entity.id)
          break
      }

      // Reset mention state
      setIsMentionActive(false)
      setMentionSearchQuery("")
      atPositionRef.current = -1
      onMentionClose()

      // Focus input and set cursor position after mention
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          const newCursorPos = atIndex + mentionText.length
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
        }
      }, 0)
    },
    [getValue, setValue, inputRef, onMentionClose]
  )

  /**
   * Get all mentioned entity IDs
   */
  const getMentionedIds = useCallback((): MentionedIds => {
    return {
      clientIds: Array.from(mentionedClientIds.current),
      projectIds: Array.from(mentionedProjectIds.current),
      contentIds: Array.from(mentionedContentIds.current),
      pageIds: Array.from(mentionedPageIds.current),
    }
  }, [])

  /**
   * Clear all tracked mentions
   */
  const clearMentions = useCallback(() => {
    mentionedClientIds.current.clear()
    mentionedProjectIds.current.clear()
    mentionedContentIds.current.clear()
    mentionedPageIds.current.clear()
    setIsMentionActive(false)
    setMentionSearchQuery("")
    atPositionRef.current = -1
  }, [])

  return {
    handleKeyDown,
    handleChange,
    insertMention,
    getMentionedIds,
    clearMentions,
    isMentionActive,
    mentionSearchQuery,
  }
}

export default useMentionDetection
