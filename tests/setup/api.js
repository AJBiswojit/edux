/**
 * Shared API test setup — consolidates the duplicated boot logic that
 * previously lived in 5 separate test files.
 *
 * Provides:
 * - localStorage shim (Map-backed) installed on globalThis
 * - API router registration + latency zeroing
 * - request helpers (get/post/request) and failing helper
 *
 * Usage:
 *   import { installTestStorage, initApi, makeHelpers } from '../setup/api.js'
 *
 *   const { clear } = installTestStorage()
 *   let server, get, post, fail, request
 *   beforeAll(async () => {
 *     server = await initApi()
 *     ;({ get, post, fail, request } = makeHelpers(server))
 *   })
 *   beforeEach(() => clear())
 */

export function installTestStorage() {
  const mem = new Map()
  const storage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
    clear: () => mem.clear(),
  }
  // Install on both globalThis and window for compatibility with
  // handlers that read window.localStorage
  globalThis.window = { localStorage: storage }
  globalThis.localStorage = storage
  return {
    mem,
    storage,
    clear: () => mem.clear(),
    reset: () => {
      mem.clear()
      globalThis.window = { localStorage: storage }
      globalThis.localStorage = storage
    },
  }
}

export async function initApi() {
  // Registering route modules mirrors main.jsx exactly
  await import('../../src/api/index.js')
  const server = await import('../../src/api/core/router.js')
  server.setResponseLatency([0, 0])
  return server
}

export function makeHelpers(server) {
  const get = (url, params = {}) =>
    server.dispatchRequest({ method: 'get', url, params }).then((r) => r.data)
  const post = (url, data, params = {}) =>
    server.dispatchRequest({ method: 'post', url, data, params }).then((r) => r.data)
  const put = (url, data, params = {}) =>
    server.dispatchRequest({ method: 'put', url, data, params }).then((r) => r.data)
  const patch = (url, data, params = {}) =>
    server.dispatchRequest({ method: 'patch', url, data, params }).then((r) => r.data)
  const del = (url, params = {}) =>
    server.dispatchRequest({ method: 'delete', url, params }).then((r) => r.data)
  const request = (opts) => server.dispatchRequest(opts)

  const fail = async (fn) => {
    try {
      await fn()
    } catch (e) {
      return e
    }
    throw new Error('expected the request to fail')
  }

  // Alias for readability in older tests that used `failing`
  const failing = fail

  return { get, post, put, patch, del, request, fail, failing }
}

/**
 * Convenience that installs storage + inits API + returns helpers.
 * For tests that need a one-liner in beforeAll.
 */
export async function setupApiTest() {
  const storage = installTestStorage()
  const server = await initApi()
  const helpers = makeHelpers(server)
  return { ...storage, server, ...helpers }
}
