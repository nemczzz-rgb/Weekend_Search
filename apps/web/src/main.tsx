// Since TASK-053 the site is the new app (app/). Design previews stay development-only (D11).
import { start } from './app/entry.tsx'

const query = new URLSearchParams(location.search)
if (import.meta.env.DEV && query.get('ideas-preview') === '1') {
  void import('./screens/day-ideas/dev-preview')
} else if (import.meta.env.DEV && query.get('ui') === '1') {
  void import('./ui/preview')
} else {
  start(document.getElementById('root')!)
}
