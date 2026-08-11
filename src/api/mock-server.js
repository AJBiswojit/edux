/**
 * MediXO EduX mock API server.
 *
 * Routes are registered with `mockRoute(method, '/path/:param', handler)`.
 * When `APP_CONFIG.USE_MOCK_API` is true, every service call is served by
 * this layer — with realistic latency and in-memory mutation — so the entire
 * product behaves exactly as it will against the real backend. Point the
 * client at a live API (VITE_USE_MOCK=false) and zero service code changes.
 */

const routes = []
let latencyRange = [380, 780]

export function mockRoute(method, pattern, handler) {
  routes.push({ method: method.toLowerCase(), pattern, handler })
}

export function setMockLatency([min, max]) {
  latencyRange = [min, max]
}

function matchPattern(pattern, url) {
  const cleanUrl = url.split('?')[0]
  const patternParts = pattern.split('/').filter(Boolean)
  const urlParts = cleanUrl.split('/').filter(Boolean)
  if (patternParts.length !== urlParts.length) return null
  const params = {}
  for (let i = 0; i < patternParts.length; i += 1) {
    const part = patternParts[i]
    if (part.startsWith(':')) params[part.slice(1)] = decodeURIComponent(urlParts[i])
    else if (part !== urlParts[i]) return null
  }
  return params
}

export function hasMockHandler(method, url) {
  return routes.some((r) => r.method === method.toLowerCase() && matchPattern(r.pattern, url))
}

export async function handleMockRequest({ method = 'get', url, data, params = {} }) {
  const m = method.toLowerCase()
  for (const route of routes) {
    if (route.method !== m) continue
    const routeParams = matchPattern(route.pattern, url)
    if (!routeParams) continue
    const [min, max] = latencyRange
    await new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)))
    const payload = await route.handler({ params: { ...routeParams, ...params }, body: data })
    return { data: payload, status: 200, headers: {}, config: {}, statusText: 'OK' }
  }
  const error = new Error(`[mock-server] No handler for ${m.toUpperCase()} ${url}`)
  error.response = { status: 404, data: { message: error.message } }
  throw error
}
