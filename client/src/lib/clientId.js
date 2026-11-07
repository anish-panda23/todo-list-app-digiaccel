const KEY = 'weekly-todo:client-id';
let memoryId = null;

function randomId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Stable anonymous id for this browser, used to scope tasks on the API. */
export function getClientId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = randomId();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // Storage blocked (private mode etc.): fall back to a per-session id.
    memoryId ??= randomId();
    return memoryId;
  }
}
