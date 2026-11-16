// Async data for a screen with loading, error and retry states (screens.md «Общие состояния»).
import { useEffect, useState, type DependencyList } from 'react'

export type Resource<T> = { data?: T; error?: boolean; retry: () => void }

export function useResource<T>(loader: () => Promise<T>, dependencies: DependencyList): Resource<T> {
  const [state, setState] = useState<{ data?: T; error?: boolean }>({})
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setState({})
    Promise.resolve().then(loader).then(
      data => { if (active) setState({ data }) },
      () => { if (active) setState({ error: true }) },
    )
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, attempt])
  return { ...state, retry: () => setAttempt(value => value + 1) }
}
