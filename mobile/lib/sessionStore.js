let _onExpired = null;
export function setSessionExpiredHandler(fn) { _onExpired = fn; }
export function triggerSessionExpired() { _onExpired?.(); }
