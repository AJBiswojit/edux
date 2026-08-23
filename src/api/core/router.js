/**
 * MediXO EduX — frontend API router (deterministic prototype adapter).
 *
 * This is the CURRENT implementation of the platform's API boundary. Route
 * modules under `src/api/<domain>/` register endpoints with
 * `defineRoute(method, '/path/:param', handler)`; `dispatchRequest()` resolves
 * a request against them with realistic latency and in-memory mutation, so the
 * product behaves exactly as it will against a real backend.
 *
 * CURRENT: in-browser deterministic adapter (APP_CONFIG.USE_MOCK_API === true)
 * FUTURE : the same endpoint contracts served by the backend over HTTP
 *          (VITE_USE_MOCK=false → src/api/axios.js) — zero service/UI changes.
 */

const routes = []
let latencyRange = [380, 780]

export function defineRoute(method, pattern, handler) {
  routes.push({ method: method.toLowerCase(), pattern, handler })
}

export function setResponseLatency([min, max]) {
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

export function hasRouteHandler(method, url) {
  return routes.some((r) => r.method === method.toLowerCase() && matchPattern(r.pattern, url))
}

export async function dispatchRequest({ method = 'get', url, data, params = {} }) {
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
  const error = new Error(`[api] No handler for ${m.toUpperCase()} ${url}`)
  error.response = { status: 404, data: { message: error.message } }
  throw error
}
