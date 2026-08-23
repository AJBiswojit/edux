import api from './axios'
import { APP_CONFIG } from '@/config'
import { dispatchRequest } from './core/router'

/**
 * Unified request client.
 *
 * While APP_CONFIG.USE_MOCK_API is true every call is served by the
 * in-browser prototype adapter (src/api/core/router) with realistic latency.
 * Otherwise the same call goes through the configured axios instance (auth
 * headers + refresh handling included) against the real backend. Services and
 * UI are identical in both modes.
 */
export async function request(config) {
  if (APP_CONFIG.USE_MOCK_API) {
    return dispatchRequest({
      method: config.method || 'get',
      url: config.url,
      data: config.data,
      params: config.params,
    })
  }
  return api(config)
}

export default request
