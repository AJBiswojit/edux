import { useEffect, useState } from 'react'

/** Persisted state synced with localStorage. */
export function useLocalStorage(key, initialValue) {
  const [stored, setStored] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(stored))
    } catch {
      /* storage unavailable */
    }
  }, [key, stored])

  return [stored, setStored]
}

export default useLocalStorage
