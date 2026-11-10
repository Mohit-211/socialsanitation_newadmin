/**
 * Delays calling `fn` until `wait` ms have passed without another call.
 * The returned function has a `cancel()` method. Replaces lodash.debounce.
 */
export function debounce(fn, wait = 300) {
  let timer;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}
