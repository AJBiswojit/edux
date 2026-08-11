import axios from 'axios'
import { APP_CONFIG } from '@/config'

/**
 * MediXO EduX axios instance — the single HTTP client for the platform.
 *
 * - Request interceptor attaches the bearer token from storage.
 * - Response interceptor transparently refreshes expired access tokens
 *   (mock refresh flow) and replays the original request once.
 */
export const api = axios.create({
  baseURL: APP_CONFIG.API_BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(
  (config) => {
    const token = window.localStorage.getItem(APP_CONFIG.TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

let isRefreshing = false
let queue = []

function flushQueue(error, token = null) {
  queue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)))
  queue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && original && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true
      try {
        const refreshToken = window.localStorage.getItem(APP_CONFIG.REFRESH_TOKEN_KEY)
        const { data } = await axios.post(`${APP_CONFIG.API_BASE_URL}/auth/refresh`, { refreshToken })
        window.localStorage.setItem(APP_CONFIG.TOKEN_KEY, data.accessToken)
        window.localStorage.setItem(APP_CONFIG.REFRESH_TOKEN_KEY, data.refreshToken)
        flushQueue(null, data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch (refreshError) {
        flushQueue(refreshError)
        window.localStorage.removeItem(APP_CONFIG.TOKEN_KEY)
        window.localStorage.removeItem(APP_CONFIG.REFRESH_TOKEN_KEY)
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api
