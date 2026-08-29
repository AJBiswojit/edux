import api from './axios'

/**
 * Unified request client — the single production API boundary.
 *
 * Every call is sent over HTTP to the configured backend
 * (VITE_API_BASE_URL via `src/api/axios.js`). There is NO in-browser
 * prototype router, no mock handler, no seeded response, and no fake
 * success in production.
 *
 * Architecture:
 *   Component → Hook → Service → request() → axios → HTTP Backend
 */
export async function request(config) {
  return api(config)
}

export default request
