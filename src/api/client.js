import api from './axios'
import { APP_CONFIG } from '@/config'
import { handleMockRequest } from './mock-server'

/**
 * Unified request client.
 *
 * In mock mode every call is served by the in-browser mock API layer with
 * realistic latency. In production mode the same call goes through the
 * configured axios instance (auth headers + refresh handling included).
 */
export async function request(config) {
  if (APP_CONFIG.USE_MOCK_API) {
    return handleMockRequest({
      method: config.method || 'get',
      url: config.url,
      data: config.data,
      params: config.params,
    })
  }
  return api(config)
}

export default request
