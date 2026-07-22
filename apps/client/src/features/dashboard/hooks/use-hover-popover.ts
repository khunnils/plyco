import { useEffect, useRef, useState } from "react"

/** Controlled popover open state for hover-or-focus triggers. */
export const useHoverPopover = () => {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hovering = useRef(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const openPopover = () => {
    hovering.current = true
    cancelClose()
    setOpen(true)
  }

  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => {
      // Keep open while the pointer is still over the trigger/content, even if
      // Radix moved focus into the portaled popover (which fires trigger blur).
      if (
        hovering.current ||
        document.activeElement === triggerRef.current
      ) {
        return
      }

      setOpen(false)
    }, 120)
  }

  const leavePopover = () => {
    hovering.current = false
    scheduleClose()
  }

  const onOpenChange = (next: boolean) => {
    if (!next) {
      hovering.current = false
      cancelClose()
    }

    setOpen(next)
  }

  useEffect(
    () => () => {
      cancelClose()
    },
    []
  )

  return {
    leavePopover,
    onOpenChange,
    open,
    openPopover,
    scheduleClose,
    triggerRef,
  }
}
