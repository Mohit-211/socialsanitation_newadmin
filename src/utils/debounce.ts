/**
 * Delays calling `fn` until `wait` ms have passed without another call.
 * The returned function has a `cancel()` method. Replaces lodash.debounce.
 */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, wait = 300) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debounced = (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}
