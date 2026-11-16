// Development-only entry of the new site (D11 since 2026-11-16): ?app=next on the dev server.
// The production build keeps the current App until the release switch (TASK-053).
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppShell } from './AppShell.tsx'
import { planReady } from './plan-state.ts'

void planReady.then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><AppShell /></React.StrictMode>)
})
