import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

interface UseIntersectionObserverOptions {
  onIntersect: () => void
  enabled?: boolean
  threshold?: number
  rootMargin?: string
}

/**
 * Hook to trigger a callback when an element intersects with viewport.
 * Used for infinite scroll to detect when user scrolls near bottom.
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>({
  onIntersect,
  enabled = true,
  threshold = 0.1,
  rootMargin = '200px',
}: UseIntersectionObserverOptions): React.RefObject<T> {
  const targetRef = useRef<T>(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target || !enabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting) {
          onIntersect()
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [onIntersect, enabled, threshold, rootMargin])

  return targetRef
}
