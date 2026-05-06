let _reload = null;

export function registerTabReload(fn) {
  _reload = fn;
}

export function triggerTabReload() {
  _reload?.();
}
