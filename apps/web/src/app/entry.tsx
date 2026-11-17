// Entry of the site (TASK-053): the new app replaces the former App.tsx in production.
// The plan is read from storage first, so the first screen already knows what is in it.
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppShell } from './AppShell.tsx'
import { planReady } from './plan-state.ts'

export function start(root: HTMLElement) {
  void planReady.then(() => {
    ReactDOM.createRoot(root).render(<React.StrictMode><AppShell /></React.StrictMode>)
  })
}
