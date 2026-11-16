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
    plugins: [
      // Node 24 tests need JSON attributes; Vite serves dynamic JSON as JS modules.
      // Remove only those options in this one adapter for browser dev/build (strict MIME).
      {
        name: 'browser-json-imports',
        enforce: 'pre' as const,
        transform(code: string, id: string) {
          if (!id.replaceAll('\\', '/').endsWith('/content/static-source.ts')) return
          return { code: code.replace(/,\s*\{\s*with:\s*\{\s*type:\s*['"]json['"]\s*\}\s*\}/g, ''), map: null }
        },
      },
      react(),
    ],
    server: { https, strictPort: true },
    preview: { https, strictPort: true },
  }
})
