import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './style.css'
import './style-refresh.css'
import './weekend-poster.css'

if (import.meta.env.DEV && new URLSearchParams(location.search).get('ideas-preview') === '1') {
  void import('./screens/day-ideas/dev-preview')
} else if (import.meta.env.DEV && new URLSearchParams(location.search).get('ui') === '1') {
  void import('./ui/preview')
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
