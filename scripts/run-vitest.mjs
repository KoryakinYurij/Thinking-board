import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '..')
const tempDir = resolve(repoRoot, '.tmp', 'vitest')
const vitestEntrypoint = resolve(repoRoot, 'node_modules', 'vitest', 'vitest.mjs')
const vitestCommands = new Set(['bench', 'dev', 'related', 'run', 'watch'])

mkdirSync(tempDir, { recursive: true })

const forwardedArgs = process.argv.slice(2)
const vitestArgs =
  forwardedArgs.length === 0
    ? ['run']
    : vitestCommands.has(forwardedArgs[0]) || forwardedArgs[0].startsWith('-')
      ? forwardedArgs
      : ['run', ...forwardedArgs]

const child = spawn(process.execPath, [vitestEntrypoint, ...vitestArgs], {
  cwd: repoRoot,
  env: {
    ...process.env,
    TEMP: tempDir,
    TMP: tempDir,
    TMPDIR: tempDir,
  },
  stdio: 'inherit',
})

child.on('error', (error) => {
  console.error('Failed to start Vitest.', error)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})
