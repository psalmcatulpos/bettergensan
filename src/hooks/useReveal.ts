import { useEffect, useRef } from 'react';

/**
 * useReveal — adds `.revealed` to an element when it scrolls into view.
 *
 * Pair with the `.reveal` CSS class in index.css which applies a fade-up
 * animation gated on `prefers-reduced-motion: no-preference`.
 *
 * - Fires once (unobserves after first intersection).
 * - rootMargin `-10%` bottom so reveals trigger slightly before the element
 *   reaches the viewport edge.
 * - When the user prefers reduced motion the class is added immediately so
 *   the element is visible without animation.
 */
const useReveal = <T extends HTMLElement = HTMLDivElement>() => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /* Reduced-motion: show immediately, no observer needed. */
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      el.classList.add('revealed');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed');
          observer.unobserve(el);
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
};

export default useReveal;
