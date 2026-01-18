'use client'

import * as React from 'react'
import { TabsList } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface ScrollableTabsListProps extends React.ComponentPropsWithoutRef<typeof TabsList> {
  children: React.ReactNode
  className?: string
}

export function ScrollableTabsList({ children, className, ...props }: ScrollableTabsListProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [showLeftGradient, setShowLeftGradient] = React.useState(false)
  const [showRightGradient, setShowRightGradient] = React.useState(false)

  const checkScroll = React.useCallback(() => {
    const el = scrollRef.current?.querySelector('[role="tablist"]')
    if (el) {
      const { scrollLeft, scrollWidth, clientWidth } = el as HTMLElement
      setShowLeftGradient(scrollLeft > 0)
      setShowRightGradient(scrollLeft + clientWidth < scrollWidth - 1)
    }
  }, [])

  React.useEffect(() => {
    checkScroll()
    const el = scrollRef.current?.querySelector('[role="tablist"]')
    if (el) {
      el.addEventListener('scroll', checkScroll)
      window.addEventListener('resize', checkScroll)
      return () => {
        el.removeEventListener('scroll', checkScroll)
        window.removeEventListener('resize', checkScroll)
      }
    }
  }, [checkScroll])

  return (
    <div ref={scrollRef} className="relative w-full">
      {/* Gradient fade on left when scrolled */}
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-200 md:hidden",
          showLeftGradient ? "opacity-100" : "opacity-0"
        )} 
      />
      
      <TabsList
        className={cn(
          // Horizontal scroll on mobile
          "w-full overflow-x-auto scrollbar-hide",
          // Scroll snap for nice stopping points
          "snap-x snap-mandatory",
          // Flex instead of grid for variable width tabs
          "flex flex-nowrap justify-start md:justify-center",
          // Ensure touch targets
          "min-h-[44px]",
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              className: cn(
                (child.props as any).className,
                // Scroll snap alignment
                "snap-start",
                // Minimum touch target
                "min-h-[44px] min-w-[44px]",
                // Prevent shrinking
                "shrink-0"
              ),
            })
          }
          return child
        })}
      </TabsList>
      
      {/* Gradient fade on right */}
      <div 
        className={cn(
          "absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-200 md:hidden",
          showRightGradient ? "opacity-100" : "opacity-0"
        )} 
      />
    </div>
  )
}
