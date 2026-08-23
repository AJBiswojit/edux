import request from '@/api/client'

/**
 * Shared query-options helper for TanStack Query hooks.
 * `path` is the API endpoint path; `key` is the query cache key.
 */
export function getQuery(path, key) {
  return {
    queryKey: key,
    queryFn: () => request({ url: path }).then((r) => r.data),
  }
}

export default getQuery
