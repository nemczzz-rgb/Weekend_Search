import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const certificateDirectory = process.env.LOCALAPPDATA
  ? join(process.env.LOCALAPPDATA, 'WeekendSearch', 'https')
  : undefined

const pfxPath = certificateDirectory && join(certificateDirectory, 'localhost.pfx')
const passwordPath = certificateDirectory && join(certificateDirectory, 'passphrase.txt')
export default defineConfig(({ mode }) => {
  const hasCertificate = Boolean(pfxPath && passwordPath && existsSync(pfxPath) && existsSync(passwordPath))
  if (mode === 'https' && !hasCertificate) {
    throw new Error('Create the local certificate with scripts/local-https/setup.ps1 first.')
  }
  const https = mode === 'https' && pfxPath && passwordPath
    ? { pfx: readFileSync(pfxPath), passphrase: readFileSync(passwordPath, 'utf8').trim() }
    : undefined

  return {
    // GitHub Pages serves the site from /Weekend_Search/; local dev and Sites use the root.
    base: process.env.PAGES_BASE ?? '/',
    plugins: [react()],
    server: { https, strictPort: true },
    preview: { https, strictPort: true },
  }
})
