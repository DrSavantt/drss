'use client'

import * as React from 'react'
import * as VisuallyHiddenPrimitive from '@radix-ui/react-visually-hidden'

/**
 * VisuallyHidden - Hides content visually while keeping it accessible to screen readers.
 * Use this to add accessible labels/descriptions without affecting visual design.
 * 
 * @example
 * // Hidden dialog title for accessibility
 * <VisuallyHidden>
 *   <DialogTitle>Search</DialogTitle>
 * </VisuallyHidden>
 */
const VisuallyHidden = React.forwardRef<
  React.ElementRef<typeof VisuallyHiddenPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof VisuallyHiddenPrimitive.Root>
>(({ ...props }, ref) => (
  <VisuallyHiddenPrimitive.Root ref={ref} {...props} />
))
VisuallyHidden.displayName = 'VisuallyHidden'

export { VisuallyHidden }

