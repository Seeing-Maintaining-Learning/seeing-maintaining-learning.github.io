/** Motion helpers shared by Svelte visualizations. */

export const reducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Duration that collapses to 0 when the reader prefers reduced motion. */
export const dur = (ms: number): number => (reducedMotion() ? 0 : ms);

/** Run `fn` only while `el` is on screen and the tab is visible. Returns a cleanup function. */
export function whileVisible(el: Element, fn: (visible: boolean) => void): () => void {
  let onScreen = false;
  const update = () => fn(onScreen && !document.hidden);
  const io = new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    update();
  });
  io.observe(el);
  document.addEventListener('visibilitychange', update);
  return () => {
    io.disconnect();
    document.removeEventListener('visibilitychange', update);
  };
}
