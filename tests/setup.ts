// Vitest setup - mock Chrome APIs
import "fake-indexeddb/auto";

const chromeMock = {
  runtime: {
    onInstalled: { addListener: () => {} },
    onMessage: { addListener: () => {} },
    sendMessage: (_msg: unknown, _cb?: unknown) => {},
    getURL: (path: string) => `chrome-extension://mock-id/${path}`,
  },
  tabs: {
    onUpdated: { addListener: () => {} },
    query: (_query: unknown, cb: (tabs: { url?: string }[]) => void) => {
      cb([{ url: "https://example.com" }]);
    },
    sendMessage: () => Promise.resolve(),
    onRemoved: { addListener: () => {} },
  },
  storage: {
    sync: {
      get: (_keys: unknown, cb: (result: Record<string, unknown>) => void) => cb({}),
      set: (_items: unknown, cb?: () => void) => cb?.(),
      clear: (cb?: () => void) => cb?.(),
    },
    local: {
      get: (_keys: unknown) => Promise.resolve({}),
      set: (_items: unknown) => Promise.resolve(),
    },
  },
  alarms: {
    create: () => {},
    onAlarm: { addListener: () => {} },
  },
  action: {
    setBadgeText: () => {},
    setBadgeBackgroundColor: () => {},
  },
  webRequest: {
    onBeforeRequest: {
      addListener: () => {},
      removeListener: () => {},
    },
  },
  declarativeNetRequest: {
    updateDynamicRules: () => Promise.resolve(),
    getDynamicRules: () => Promise.resolve([]),
  },
};

Object.defineProperty(globalThis, "chrome", {
  value: chromeMock,
  writable: true,
});
