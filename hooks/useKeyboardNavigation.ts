// hooks/useKeyboardNavigation.ts
'use client'

import { useCallback, useEffect, useRef } from 'react'

type KeyboardNavigationOptions = {
  /** Callback when Enter is pressed on an item */
  onSelect: (index: number) => void
  /** Callback when Escape is pressed */
  onEscape?: () => void
  /** Total number of navigable items */
  itemCount: number
  /** Whether navigation is currently enabled */
  enabled?: boolean
}

/**
 * Hook for managing keyboard navigation in dropdowns/menus
 * Handles ArrowUp, ArrowDown, Enter, Escape with proper focus management
 */
export function useKeyboardNavigation({
  onSelect,
  onEscape,
  itemCount,
  enabled = true,
}: KeyboardNavigationOptions) {
  const activeIndexRef = useRef(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  // ✅ FIXED: Use native KeyboardEvent instead of React.KeyboardEvent
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          activeIndexRef.current = Math.min(
            activeIndexRef.current + 1,
            itemCount - 1
          )
          updateActiveDescendant()
          break

        case 'ArrowUp':
          e.preventDefault()
          activeIndexRef.current = Math.max(activeIndexRef.current - 1, -1)
          updateActiveDescendant()
          break

        case 'Enter':
          e.preventDefault()
          if (activeIndexRef.current >= 0) {
            onSelect(activeIndexRef.current)
          }
          break

        case 'Escape':
          e.preventDefault()
          onEscape?.()
          break

        case 'Tab':
          // Allow natural tab navigation but track it
          activeIndexRef.current = -1
          break
      }
    },
    [enabled, itemCount, onSelect, onEscape]
  )

  /**
   * Update aria-activedescendant for screen readers
   */
  const updateActiveDescendant = useCallback(() => {
    if (!containerRef.current) return
    
    const items = containerRef.current.querySelectorAll('[role="option"]')
    items.forEach((item, index) => {
      const element = item as HTMLElement
      if (index === activeIndexRef.current) {
        element.setAttribute('aria-selected', 'true')
        element.scrollIntoView({ block: 'nearest' })
      } else {
        element.setAttribute('aria-selected', 'false')
      }
    })
  }, [])

  /**
   * Reset navigation state
   */
  const reset = useCallback(() => {
    activeIndexRef.current = -1
    updateActiveDescendant()
  }, [updateActiveDescendant])

  // ✅ FIXED: No type assertion needed - types now match naturally
  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled) return

    // handleKeyDown is (e: KeyboardEvent) => void
    // addEventListener expects EventListener = (evt: Event) => void
    // KeyboardEvent extends Event, so this is safe without casting
    const listener = (e: Event) => {
      if (e instanceof KeyboardEvent) {
        handleKeyDown(e)
      }
    }
    
    container.addEventListener('keydown', listener)
    return () => {
      container.removeEventListener('keydown', listener)
    }
  }, [handleKeyDown, enabled])

  // Reset when item count changes
  useEffect(() => {
    if (activeIndexRef.current >= itemCount) {
      reset()
    }
  }, [itemCount, reset])

  return {
    ref: containerRef,
    activeIndex: activeIndexRef.current,
    setActiveIndex: (index: number) => {
      activeIndexRef.current = index
      updateActiveDescendant()
    },
    reset,
    // ✅ Return native handler for direct DOM usage
    handleKeyDown: (e: KeyboardEvent) => handleKeyDown(e),
  }
}